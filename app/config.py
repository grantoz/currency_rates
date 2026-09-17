import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    coinbase_exchange_rates_url: str = "https://api.coinbase.com/v2/exchange-rates"
    cache_ttl_seconds: float = 600.0
    request_timeout_seconds: float = 5.0
    max_retries: int = 3
    retry_backoff_seconds: float = 0.25
    cors_origins: tuple[str, ...] = ("http://localhost:5173", "http://127.0.0.1:5173")

    @classmethod
    def from_env(cls) -> "Settings":
        cors_origins = os.getenv("CORS_ORIGINS")
        return cls(
            coinbase_exchange_rates_url=os.getenv(
                "COINBASE_EXCHANGE_RATES_URL", cls.coinbase_exchange_rates_url
            ),
            cache_ttl_seconds=float(os.getenv("CACHE_TTL_SECONDS", cls.cache_ttl_seconds)),
            request_timeout_seconds=float(
                os.getenv("REQUEST_TIMEOUT_SECONDS", cls.request_timeout_seconds)
            ),
            max_retries=int(os.getenv("MAX_RETRIES", cls.max_retries)),
            retry_backoff_seconds=float(
                os.getenv("RETRY_BACKOFF_SECONDS", cls.retry_backoff_seconds)
            ),
            cors_origins=tuple(cors_origins.split(",")) if cors_origins else cls.cors_origins,
        )
