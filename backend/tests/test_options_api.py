import math

import pytest

BS_ENDPOINT = "/api/options/black-scholes"
IV_ENDPOINT = "/api/options/implied-volatility"
SURFACE_ENDPOINT = "/api/options/volatility-surface"


def bs_payload(**overrides):
    payload = {
        "stock_price": 100.0,
        "strike_price": 100.0,
        "time_to_expiry": 1.0,
        "risk_free_rate": 0.05,
        "volatility": 0.20,
        "option_type": "call",
    }
    payload.update(overrides)
    return payload


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_call_price_matches_reference_value(client):
    # Textbook reference: S=100, K=100, T=1, r=5%, sigma=20% -> C ~= 10.4506
    response = client.post(BS_ENDPOINT, json=bs_payload())
    assert response.status_code == 200
    body = response.json()
    assert body["option_price"] == pytest.approx(10.4506, abs=1e-3)
    assert body["intrinsic_value"] == 0.0
    assert body["time_value"] == pytest.approx(body["option_price"], abs=1e-9)


def test_put_call_parity_holds(client):
    call = client.post(BS_ENDPOINT, json=bs_payload(option_type="call")).json()
    put = client.post(BS_ENDPOINT, json=bs_payload(option_type="put")).json()
    # C - P = S - K * e^(-rT)
    lhs = call["option_price"] - put["option_price"]
    rhs = 100.0 - 100.0 * math.exp(-0.05 * 1.0)
    assert lhs == pytest.approx(rhs, abs=1e-3)


def test_expired_option_returns_intrinsic_value(client):
    response = client.post(
        BS_ENDPOINT, json=bs_payload(stock_price=110.0, time_to_expiry=0.0)
    )
    assert response.status_code == 200
    body = response.json()
    assert body["option_price"] == pytest.approx(10.0)
    assert body["intrinsic_value"] == pytest.approx(10.0)
    assert body["time_value"] == pytest.approx(0.0)


def test_greeks_are_within_theoretical_bounds(client):
    call = client.post(BS_ENDPOINT, json=bs_payload(option_type="call")).json()
    put = client.post(BS_ENDPOINT, json=bs_payload(option_type="put")).json()

    assert 0.0 <= call["greeks"]["delta"] <= 1.0
    assert -1.0 <= put["greeks"]["delta"] <= 0.0
    # Gamma and vega are identical for calls and puts and strictly positive
    assert call["greeks"]["gamma"] == pytest.approx(put["greeks"]["gamma"])
    assert call["greeks"]["vega"] == pytest.approx(put["greeks"]["vega"])
    assert call["greeks"]["gamma"] > 0
    assert call["greeks"]["vega"] > 0
    # A long call loses value as time passes
    assert call["greeks"]["theta"] < 0


@pytest.mark.parametrize(
    "overrides,expected_detail",
    [
        ({"stock_price": -1.0}, "Stock price must be positive"),
        ({"strike_price": 0.0}, "Strike price must be positive"),
        ({"time_to_expiry": -0.5}, "Time to expiry cannot be negative"),
        ({"volatility": -0.2}, "Volatility cannot be negative"),
        ({"option_type": "straddle"}, "Option type must be 'call' or 'put'"),
    ],
)
def test_invalid_inputs_return_400(client, overrides, expected_detail):
    response = client.post(BS_ENDPOINT, json=bs_payload(**overrides))
    assert response.status_code == 400
    assert response.json()["detail"] == expected_detail


def test_implied_volatility_recovers_input_volatility(client):
    target_sigma = 0.25
    price = client.post(BS_ENDPOINT, json=bs_payload(volatility=target_sigma)).json()[
        "option_price"
    ]

    response = client.post(
        IV_ENDPOINT,
        params={
            "stock_price": 100.0,
            "strike_price": 100.0,
            "time_to_expiry": 1.0,
            "risk_free_rate": 0.05,
            "option_price": price,
            "option_type": "call",
        },
    )
    assert response.status_code == 200
    assert response.json()["implied_volatility"] == pytest.approx(
        target_sigma, abs=1e-3
    )


def test_volatility_surface_has_expected_grid(client):
    response = client.get(
        SURFACE_ENDPOINT,
        params={
            "stock_price": 100.0,
            "min_strike": 80.0,
            "max_strike": 120.0,
            "min_expiry": 0.1,
            "max_expiry": 1.0,
        },
    )
    assert response.status_code == 200
    surface = response.json()["surface_data"]
    assert len(surface) == 100  # 10 strikes x 10 expiries
    for point in surface:
        assert point["call_price"] >= 0
        assert point["put_price"] >= 0
