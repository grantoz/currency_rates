import asyncio
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Awaitable, Callable

import httpx2
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel

from app.config import Settings


class UpstreamError(Exception):
    pass


class UpstreamInvalidDataError(Exception):
    pass


class ExchangeRates(BaseModel):
    currency: str
    rates: dict[str, str]
    fetched_at: datetime
    cached: bool = False


@dataclass(frozen=True)
class _CacheEntry:
    rates: ExchangeRates
    expires_at: float


class ExchangeRateService:
    def __init__(
        self,
        http_client: httpx2.AsyncClient,
        settings: Settings,
        sleep: Callable[[float], Awaitable[None]] = asyncio.sleep,
    ) -> None:
        self._client = http_client
        self._settings = settings
        self._sleep = sleep
        self._cache: dict[str, _CacheEntry] = {}
        self._locks: dict[str, asyncio.Lock] = {}

    async def get_rates(self, currency: str) -> ExchangeRates:
        code = currency.upper()
        entry = self._cache.get(code)
        if entry is not None and entry.expires_at > time.monotonic():
            return entry.rates.model_copy(update={"cached": True})
        lock = self._locks.setdefault(code, asyncio.Lock())
        async with lock:
            entry = self._cache.get(code)
            if entry is not None and entry.expires_at > time.monotonic():
                return entry.rates.model_copy(update={"cached": True})
            rates = await self._fetch_from_coinbase(code)
            self._cache[code] = _CacheEntry(
                rates=rates,
                expires_at=time.monotonic() + self._settings.cache_ttl_seconds,
            )
            return rates

    async def _fetch_from_coinbase(self, currency: str) -> ExchangeRates:
        last_error: UpstreamError | None = None
        for attempt in range(self._settings.max_retries + 1):
            if attempt > 0:
                await self._sleep(
                    self._settings.retry_backoff_seconds * 2 ** (attempt - 1)
                )
            try:
                response = await self._client.get(
                    self._settings.coinbase_exchange_rates_url,
                    params={"currency": currency},
                )
            except httpx2.TransportError as exc:
                last_error = UpstreamError(f"Coinbase request failed: {exc}")
                continue
            if response.status_code == 429 or response.status_code >= 500:
                last_error = UpstreamError(
                    f"Coinbase returned HTTP {response.status_code}"
                )
                continue
            if response.status_code >= 400:
                raise UpstreamError(f"Coinbase returned HTTP {response.status_code}")
            return self._parse_rates(response, currency)
        raise last_error if last_error is not None else UpstreamError("Coinbase request failed")

    def _parse_rates(self, response: httpx2.Response, currency: str) -> ExchangeRates:
        try:
            payload = response.json()
        except ValueError as exc:
            raise UpstreamInvalidDataError("Coinbase returned malformed JSON") from exc
        if not isinstance(payload, dict):
            raise UpstreamInvalidDataError("Coinbase payload is not an object")
        data = payload.get("data")
        if not isinstance(data, dict):
            raise UpstreamInvalidDataError("Coinbase payload is missing data")
        if str(data.get("currency", "")).upper() != currency.upper():
            raise UpstreamInvalidDataError("Coinbase currency does not match request")
        rates = data.get("rates")
        if not isinstance(rates, dict) or not rates:
            raise UpstreamInvalidDataError("Coinbase rates are missing or empty")
        parsed: dict[str, str] = {}
        for key, value in rates.items():
            if not isinstance(value, str):
                raise UpstreamInvalidDataError("Coinbase rate value is not a string")
            try:
                float(value)
            except ValueError as exc:
                raise UpstreamInvalidDataError(
                    f"Coinbase rate value is not numeric: {value!r}"
                ) from exc
            parsed[key] = value
        return ExchangeRates(
            currency=currency, rates=parsed, fetched_at=datetime.now(timezone.utc)
        )


def get_rates_service(request: Request) -> ExchangeRateService:
    return request.app.state.rates_service


router = APIRouter(tags=["exchange-rates"])


@router.get("/exchange-rates", response_model=ExchangeRates)
async def get_exchange_rates(
    currency: str = Query(default="USD", pattern=r"^[A-Za-z]{3}$"),
    service: ExchangeRateService = Depends(get_rates_service),
) -> ExchangeRates:
    try:
        return await service.get_rates(currency.upper())
    except UpstreamInvalidDataError:
        raise HTTPException(
            status_code=502,
            detail="The exchange rate provider returned invalid data. Please try again later.",
        ) from None
    except UpstreamError:
        raise HTTPException(
            status_code=502,
            detail="The exchange rate provider is temporarily unavailable. Please try again shortly.",
        ) from None
