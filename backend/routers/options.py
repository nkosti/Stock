import math
from typing import Dict

import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from scipy.stats import norm

router = APIRouter(prefix="/api/options", tags=["options"])


class BlackScholesInputs(BaseModel):
    stock_price: float
    strike_price: float
    time_to_expiry: float  # in years
    risk_free_rate: float  # as decimal (e.g., 0.05 for 5%)
    volatility: float  # as decimal (e.g., 0.20 for 20%)
    option_type: str  # "call" or "put"


def black_scholes(S, K, T, r, sigma, option_type="call"):
    """
    Calculate Black-Scholes option price
    S: Current stock price
    K: Strike price
    T: Time to expiration (in years)
    r: Risk-free rate
    sigma: Volatility
    """
    if T <= 0:
        if option_type == "call":
            return max(S - K, 0)
        else:
            return max(K - S, 0)

    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)

    if option_type == "call":
        price = S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)
    else:  # put
        price = K * np.exp(-r * T) * norm.cdf(-d2) - S * norm.cdf(-d1)

    return price


def calculate_greeks(S, K, T, r, sigma, option_type="call"):
    """Calculate option Greeks"""
    if T <= 0:
        return {
            "delta": 1.0 if option_type == "call" and S > K else 0.0,
            "gamma": 0.0,
            "theta": 0.0,
            "vega": 0.0,
            "rho": 0.0,
        }

    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)

    # Delta
    if option_type == "call":
        delta = norm.cdf(d1)
    else:
        delta = norm.cdf(d1) - 1

    # Gamma (same for calls and puts)
    gamma = norm.pdf(d1) / (S * sigma * np.sqrt(T))

    # Theta
    if option_type == "call":
        theta = (
            -(S * norm.pdf(d1) * sigma) / (2 * np.sqrt(T))
            - r * K * np.exp(-r * T) * norm.cdf(d2)
        ) / 365
    else:
        theta = (
            -(S * norm.pdf(d1) * sigma) / (2 * np.sqrt(T))
            + r * K * np.exp(-r * T) * norm.cdf(-d2)
        ) / 365

    # Vega (same for calls and puts)
    vega = S * norm.pdf(d1) * np.sqrt(T) / 100

    # Rho
    if option_type == "call":
        rho = K * T * np.exp(-r * T) * norm.cdf(d2) / 100
    else:
        rho = -K * T * np.exp(-r * T) * norm.cdf(-d2) / 100

    return {
        "delta": round(delta, 4),
        "gamma": round(gamma, 4),
        "theta": round(theta, 4),
        "vega": round(vega, 4),
        "rho": round(rho, 4),
    }


@router.post("/black-scholes")
async def calculate_black_scholes(inputs: BlackScholesInputs) -> Dict:
    """Calculate Black-Scholes option price and Greeks"""
    try:
        if inputs.stock_price <= 0:
            raise HTTPException(status_code=400, detail="Stock price must be positive")
        if inputs.strike_price <= 0:
            raise HTTPException(status_code=400, detail="Strike price must be positive")
        if inputs.time_to_expiry < 0:
            raise HTTPException(
                status_code=400, detail="Time to expiry cannot be negative"
            )
        if inputs.volatility < 0:
            raise HTTPException(status_code=400, detail="Volatility cannot be negative")
        if inputs.option_type.lower() not in ["call", "put"]:
            raise HTTPException(
                status_code=400, detail="Option type must be 'call' or 'put'"
            )

        option_price = black_scholes(
            inputs.stock_price,
            inputs.strike_price,
            inputs.time_to_expiry,
            inputs.risk_free_rate,
            inputs.volatility,
            inputs.option_type.lower(),
        )

        greeks = calculate_greeks(
            inputs.stock_price,
            inputs.strike_price,
            inputs.time_to_expiry,
            inputs.risk_free_rate,
            inputs.volatility,
            inputs.option_type.lower(),
        )

        # Calculate intrinsic and time value
        if inputs.option_type.lower() == "call":
            intrinsic_value = max(inputs.stock_price - inputs.strike_price, 0)
        else:
            intrinsic_value = max(inputs.strike_price - inputs.stock_price, 0)

        time_value = option_price - intrinsic_value

        return {
            "option_price": round(option_price, 4),
            "intrinsic_value": round(intrinsic_value, 4),
            "time_value": round(time_value, 4),
            "greeks": greeks,
            "inputs": {
                "stock_price": inputs.stock_price,
                "strike_price": inputs.strike_price,
                "time_to_expiry": inputs.time_to_expiry,
                "risk_free_rate": inputs.risk_free_rate,
                "volatility": inputs.volatility,
                "option_type": inputs.option_type,
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error calculating option price: {str(e)}"
        )


@router.post("/implied-volatility")
async def calculate_implied_volatility(
    stock_price: float,
    strike_price: float,
    time_to_expiry: float,
    risk_free_rate: float,
    option_price: float,
    option_type: str = "call",
) -> Dict:
    """Calculate implied volatility using Newton-Raphson method"""
    try:
        if option_price <= 0:
            raise HTTPException(status_code=400, detail="Option price must be positive")

        # Initial guess for volatility
        volatility = 0.20
        tolerance = 1e-6
        max_iterations = 100

        for i in range(max_iterations):
            # Calculate option price with current volatility
            calculated_price = black_scholes(
                stock_price,
                strike_price,
                time_to_expiry,
                risk_free_rate,
                volatility,
                option_type.lower(),
            )

            # Calculate vega (sensitivity to volatility)
            if time_to_expiry > 0:
                d1 = (
                    np.log(stock_price / strike_price)
                    + (risk_free_rate + 0.5 * volatility**2) * time_to_expiry
                ) / (volatility * np.sqrt(time_to_expiry))
                vega = stock_price * norm.pdf(d1) * np.sqrt(time_to_expiry)
            else:
                break

            # Newton-Raphson update
            price_diff = calculated_price - option_price

            if abs(price_diff) < tolerance:
                break

            if vega == 0:
                break

            volatility = volatility - price_diff / vega

            # Keep volatility positive
            volatility = max(volatility, 0.001)

        return {
            "implied_volatility": round(volatility, 4),
            "iterations": i + 1,
            "inputs": {
                "stock_price": stock_price,
                "strike_price": strike_price,
                "time_to_expiry": time_to_expiry,
                "risk_free_rate": risk_free_rate,
                "option_price": option_price,
                "option_type": option_type,
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error calculating implied volatility: {str(e)}"
        )


@router.get("/volatility-surface")
async def get_volatility_surface(
    stock_price: float,
    min_strike: float,
    max_strike: float,
    min_expiry: float,
    max_expiry: float,
    volatility: float = 0.20,
) -> Dict:
    """Generate volatility surface data for visualization"""
    try:
        strikes = np.linspace(min_strike, max_strike, 10)
        expiries = np.linspace(min_expiry, max_expiry, 10)
        risk_free_rate = 0.05  # 5% risk-free rate

        surface_data = []

        for expiry in expiries:
            for strike in strikes:
                call_price = black_scholes(
                    stock_price, strike, expiry, risk_free_rate, volatility, "call"
                )
                put_price = black_scholes(
                    stock_price, strike, expiry, risk_free_rate, volatility, "put"
                )

                surface_data.append(
                    {
                        "strike": round(strike, 2),
                        "expiry": round(expiry, 4),
                        "call_price": round(call_price, 4),
                        "put_price": round(put_price, 4),
                    }
                )

        return {
            "surface_data": surface_data,
            "parameters": {
                "stock_price": stock_price,
                "volatility": volatility,
                "risk_free_rate": risk_free_rate,
            },
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error generating volatility surface: {str(e)}"
        )
