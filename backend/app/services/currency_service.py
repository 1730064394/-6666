from typing import Dict


class CurrencyService:
    _exchange_rates: Dict[str, float] = {
        "USD": 1.0,
        "EUR": 1.08,
        "GBP": 1.27,
        "JPY": 0.0064,
        "CAD": 0.73,
        "AUD": 0.65,
    }

    @classmethod
    def convert_to_usd(cls, amount: float, currency: str) -> float:
        rate = cls._exchange_rates.get(currency, 1.0)
        return round(amount * rate, 2)

    @classmethod
    def get_supported_currencies(cls) -> list:
        return list(cls._exchange_rates.keys())

    @classmethod
    def update_rates(cls, rates: Dict[str, float]):
        cls._exchange_rates.update(rates)
