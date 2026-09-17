import asyncio
import time
from collections.abc import Callable
from datetime import UTC, datetime
from typing import Any

import httpx2
import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.main import app
from app.rates import ExchangeRateService, _CacheEntry, get_rates_service


class Recorder:
    def __init__(self, handler: Callable[[httpx2.Request], httpx2.Response]) -> None:
        self.handler = handler
        self.calls: list[httpx2.Request] = []

    def __call__(self, request: httpx2.Request) -> httpx2.Response:
        self.calls.append(request)
        return self.handler(request)


def coinbase_ok(currency: str, rates: dict[str, str] | None = None) -> httpx2.Response:
    return httpx2.Response(
        200,
        json={"data": {"currency": currency, "rates": rates or {"EUR": "0.92"}}},
    )


def responder(*outcomes: httpx2.Response | Exception) -> Callable[[httpx2.Request], httpx2.Response]:
    queue = list(outcomes)

    def handler(request: httpx2.Request) -> httpx2.Response:
        outcome = queue.pop(0) if queue else outcomes[-1]
        if isinstance(outcome, Exception):
            raise outcome
        return outcome

    return handler


def make_sleep(delays: list[float]) -> Callable[[float], Any]:
    async def fake_sleep(delay: float) -> None:
        delays.append(delay)

    return fake_sleep


def install_service(
    recorder: Recorder,
    settings: Settings | None = None,
    sleep: Callable[..., Any] = asyncio.sleep,
) -> ExchangeRateService:
    service = ExchangeRateService(
        httpx2.AsyncClient(transport=httpx2.MockTransport(recorder)),
        settings if settings is not None else Settings(retry_backoff_seconds=0.0),
        sleep=sleep,
    )
    app.dependency_overrides[get_rates_service] = lambda: service
    return service


@pytest.fixture()
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(autouse=True)
def clear_dependency_overrides():
    yield
    app.dependency_overrides.clear()


def test_success_returns_rates_and_calls_upstream_once(client):
    recorder = Recorder(lambda request: coinbase_ok("USD"))
    install_service(recorder)

    response = client.get("/exchange-rates?currency=USD")

    assert response.status_code == 200
    body = response.json()
    assert body["currency"] == "USD"
    assert body["rates"] == {"EUR": "0.92"}
    assert body["cached"] is False
    datetime.fromisoformat(body["fetched_at"])
    assert len(recorder.calls) == 1
    assert recorder.calls[0].url.params["currency"] == "USD"


def test_second_request_is_served_from_cache(client):
    recorder = Recorder(lambda request: coinbase_ok("USD"))
    install_service(recorder)

    first = client.get("/exchange-rates?currency=USD")
    second = client.get("/exchange-rates?currency=USD")

    assert first.status_code == 200
    assert second.status_code == 200
    assert len(recorder.calls) == 1
    assert second.json()["cached"] is True
    assert second.json()["rates"] == first.json()["rates"]


def test_cache_is_per_currency(client):
    def handler(request: httpx2.Request) -> httpx2.Response:
        return coinbase_ok(request.url.params["currency"])

    recorder = Recorder(handler)
    install_service(recorder)

    usd = client.get("/exchange-rates?currency=USD")
    eur = client.get("/exchange-rates?currency=EUR")

    assert usd.json()["currency"] == "USD"
    assert eur.json()["currency"] == "EUR"
    assert len(recorder.calls) == 2


def test_expired_cache_entry_triggers_refetch(client):
    recorder = Recorder(lambda request: coinbase_ok("USD"))
    service = install_service(recorder)

    client.get("/exchange-rates?currency=USD")
    stale = _CacheEntry(
        rates=service._cache["USD"].rates,
        expires_at=time.monotonic() - 1,
    )
    service._cache["USD"] = stale

    response = client.get("/exchange-rates?currency=USD")

    assert response.status_code == 200
    assert response.json()["cached"] is False
    assert len(recorder.calls) == 2


def test_transient_transport_errors_are_retried_with_backoff(client):
    recorder = Recorder(
        responder(
            httpx2.ConnectError("boom"),
            httpx2.ConnectError("boom"),
            coinbase_ok("USD"),
        )
    )
    delays: list[float] = []
    install_service(recorder, Settings(), make_sleep(delays))

    response = client.get("/exchange-rates?currency=USD")

    assert response.status_code == 200
    assert response.json()["cached"] is False
    assert delays == [0.25, 0.5]
    assert len(recorder.calls) == 3


def test_5xx_and_429_are_retried(client):
    recorder = Recorder(
        responder(
            httpx2.Response(503),
            httpx2.Response(429),
            coinbase_ok("USD"),
        )
    )
    install_service(recorder)

    response = client.get("/exchange-rates?currency=USD")

    assert response.status_code == 200
    assert len(recorder.calls) == 3


def test_exhausted_retries_return_502(client):
    recorder = Recorder(responder(httpx2.ConnectError("boom")))
    install_service(recorder)

    response = client.get("/exchange-rates?currency=USD")

    assert response.status_code == 502
    assert "temporarily unavailable" in response.json()["detail"]
    assert len(recorder.calls) == Settings().max_retries + 1 == 4


def test_403_is_not_retried(client):
    recorder = Recorder(responder(httpx2.Response(403)))
    install_service(recorder)

    response = client.get("/exchange-rates?currency=USD")

    assert response.status_code == 502
    assert "temporarily unavailable" in response.json()["detail"]
    assert len(recorder.calls) == 1


def test_invalid_payload_fails_fast_without_retry(client):
    recorder = Recorder(responder(httpx2.Response(200, json={"foo": "bar"})))
    install_service(recorder)

    response = client.get("/exchange-rates?currency=USD")

    assert response.status_code == 502
    assert "invalid data" in response.json()["detail"]
    assert len(recorder.calls) == 1


def test_non_numeric_rate_value_returns_502(client):
    recorder = Recorder(
        responder(coinbase_ok("USD", rates={"EUR": "0.92", "GBP": "abc"}))
    )
    install_service(recorder)

    response = client.get("/exchange-rates?currency=USD")

    assert response.status_code == 502
    assert "invalid data" in response.json()["detail"]
    assert len(recorder.calls) == 1


def test_malformed_json_body_returns_502(client):
    recorder = Recorder(
        responder(
            httpx2.Response(200, text="not json", headers={"content-type": "application/json"})
        )
    )
    install_service(recorder)

    response = client.get("/exchange-rates?currency=USD")

    assert response.status_code == 502
    assert "invalid data" in response.json()["detail"]
    assert len(recorder.calls) == 1


@pytest.mark.parametrize("currency", ["USDD", "12$", "US", ""])
def test_invalid_currency_param_returns_422(client, currency):
    install_service(Recorder(lambda request: coinbase_ok("USD")))

    response = client.get("/exchange-rates", params={"currency": currency})

    assert response.status_code == 422


def test_lowercase_currency_is_normalized(client):
    recorder = Recorder(lambda request: coinbase_ok(request.url.params["currency"]))
    install_service(recorder)

    response = client.get("/exchange-rates?currency=eur")

    assert response.status_code == 200
    assert len(recorder.calls) == 1
    assert recorder.calls[0].url.params["currency"] == "EUR"
    assert response.json()["currency"] == "EUR"
