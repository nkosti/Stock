import pandas as pd
import pytest

from routers import stocks


class FakeHistoryTicker:
    """Captures the (period, interval) yfinance is asked for and returns
    a frame shaped like the real response for that interval."""

    last_call = {}

    def __init__(self, symbol):
        self.symbol = symbol

    def history(self, period, interval):
        FakeHistoryTicker.last_call = {"period": period, "interval": interval}
        if interval.endswith(("m", "h")):
            index = pd.DatetimeIndex(
                pd.date_range(
                    "2026-09-04 09:30", periods=5, freq="30min", tz="America/New_York"
                ),
                name="Datetime",
            )
        else:
            index = pd.DatetimeIndex(
                pd.date_range("2026-08-03", periods=5, freq="B"), name="Date"
            )
        return pd.DataFrame(
            {
                "Open": [100.0] * 5,
                "High": [101.0] * 5,
                "Low": [99.0] * 5,
                "Close": [100.5] * 5,
                "Volume": [1_000_000] * 5,
            },
            index=index,
        )


@pytest.fixture(autouse=True)
def fake_yfinance(monkeypatch):
    monkeypatch.setattr(stocks.yf, "Ticker", FakeHistoryTicker)


@pytest.mark.parametrize(
    "ui_period,expected_period,expected_interval",
    [
        ("2h", "1d", "1m"),
        ("1d", "2d", "5m"),
        ("2d", "5d", "5m"),
        ("1w", "5d", "30m"),
        ("1mo", "1mo", "1h"),
        ("3mo", "3mo", "1h"),
        ("6mo", "6mo", "1d"),
        ("ytd", "ytd", "1d"),
        ("1y", "1y", "1wk"),
        ("2y", "2y", "1wk"),
        ("5y", "5y", "1d"),
        ("max", "max", "1d"),
    ],
)
def test_ui_timeframes_map_to_valid_yfinance_args(
    client, ui_period, expected_period, expected_interval
):
    response = client.get(f"/api/stocks/AAPL/history?period={ui_period}")
    assert response.status_code == 200
    assert FakeHistoryTicker.last_call == {
        "period": expected_period,
        "interval": expected_interval,
    }


def test_intraday_history_formats_datetimes_with_timezone(client):
    # Regression: 30m data indexes by "Datetime"; the formatter used to look
    # for a "Date" column and blow up with a KeyError
    response = client.get("/api/stocks/AAPL/history?period=1w")
    assert response.status_code == 200
    dates = [row["Date"] for row in response.json()["data"]]
    assert all("T" in d and d.endswith("-0400") for d in dates)


def test_daily_history_formats_dates_only(client):
    response = client.get("/api/stocks/AAPL/history?period=6mo")
    assert response.status_code == 200
    dates = [row["Date"] for row in response.json()["data"]]
    assert dates[0] == "2026-08-03"
    assert all("T" not in d for d in dates)
