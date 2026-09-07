import pandas as pd
import pytest

from routers import valuation


class FakeTicker:
    """Deterministic stand-in for yfinance.Ticker used in valuation tests."""

    def __init__(self, symbol):
        self.symbol = symbol.upper()

    @property
    def info(self):
        if self.symbol == "NOPE":
            return {}
        return {
            "symbol": self.symbol,
            "sharesOutstanding": 1_000_000,
            "currentPrice": 50.0,
            "marketCap": 50_000_000,
            "totalRevenue": 10_000_000,
            "trailingPE": 12.5,
            "forwardPE": 10.0,
            "priceToBook": 2.0,
            "enterpriseValue": 60_000_000,
            "ebitda": 5_000_000,
        }

    @property
    def financials(self):
        return pd.DataFrame({"2024-12-31": [10_000_000.0]}, index=["Total Revenue"])

    @property
    def balance_sheet(self):
        return pd.DataFrame(
            {"2024-12-31": [2_000_000.0, 1_000_000.0]},
            index=["Cash And Cash Equivalents", "Total Debt"],
        )


@pytest.fixture(autouse=True)
def fake_yfinance(monkeypatch):
    monkeypatch.setattr(valuation.yf, "Ticker", FakeTicker)


def dcf_payload(**overrides):
    payload = {
        "symbol": "TEST",
        "revenue_growth_rates": [0.10, 0.10, 0.08, 0.06, 0.05],
        "operating_margin": 0.25,
        "tax_rate": 0.21,
        "capex_as_percent_revenue": 0.05,
        "working_capital_change": 100_000,
        "wacc": 0.09,
        "terminal_growth_rate": 0.02,
    }
    payload.update(overrides)
    return payload


def test_dcf_returns_consistent_valuation(client):
    response = client.post("/api/valuation/dcf", json=dcf_payload())
    assert response.status_code == 200
    body = response.json()

    assert body["symbol"] == "TEST"
    assert len(body["projected_fcfs"]) == 5
    assert len(body["pv_fcfs"]) == 5
    # Present values must be smaller than the undiscounted cash flows
    for fcf, pv in zip(body["projected_fcfs"], body["pv_fcfs"]):
        assert pv < fcf
    # equity = enterprise + cash - debt (fake balance sheet: 2M cash, 1M debt)
    assert body["equity_value"] == pytest.approx(
        body["enterprise_value"] + 2_000_000 - 1_000_000, abs=1.0
    )
    # per-share value ties back to equity value and share count
    assert body["dcf_value_per_share"] == pytest.approx(
        body["equity_value"] / 1_000_000, abs=0.01
    )
    assert body["current_price"] == 50.0


def test_dcf_upside_matches_price_gap(client):
    body = client.post("/api/valuation/dcf", json=dcf_payload()).json()
    expected_upside = (body["dcf_value_per_share"] - 50.0) / 50.0 * 100
    assert body["upside_downside_percent"] == pytest.approx(expected_upside, abs=0.01)


def test_dcf_unknown_symbol_returns_404(client):
    response = client.post("/api/valuation/dcf", json=dcf_payload(symbol="NOPE"))
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]


def test_valuation_ratios_are_derived_from_market_data(client):
    response = client.get("/api/valuation/TEST/ratios")
    assert response.status_code == 200
    body = response.json()
    assert body["pe_ratio"] == 12.5
    # price_to_sales = market cap / revenue
    assert body["price_to_sales"] == pytest.approx(5.0)
    # ev_to_ebitda = enterprise value / ebitda
    assert body["ev_to_ebitda"] == pytest.approx(12.0)


def test_peer_comparison_labels_relative_valuation(client):
    response = client.get("/api/valuation/TEST/peer-comparison")
    assert response.status_code == 200
    body = response.json()
    # Fake company PE (12.5) is below the industry average (20.0)
    assert body["relative_valuation"]["pe_ratio"] == "Undervalued"
