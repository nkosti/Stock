from datetime import datetime, timedelta
from typing import Dict, List, Optional

import pandas as pd
import yfinance as yf
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/stocks", tags=["stocks"])


@router.get("/{symbol}/info")
async def get_stock_info(symbol: str) -> Dict:
    try:
        stock = yf.Ticker(symbol.upper())
        info = stock.info

        if not info or "symbol" not in info:
            raise HTTPException(status_code=404, detail=f"Stock {symbol} not found")

        return {
            "symbol": info.get("symbol"),
            "company_name": info.get("longName"),
            "sector": info.get("sector"),
            "industry": info.get("industry"),
            "market_cap": info.get("marketCap"),
            "current_price": info.get("currentPrice"),
            "pe_ratio": info.get("trailingPE"),
            "forward_pe": info.get("forwardPE"),
            "peg_ratio": info.get("pegRatio"),
            "price_to_book": info.get("priceToBook"),
            "debt_to_equity": info.get("debtToEquity"),
            "return_on_equity": info.get("returnOnEquity"),
            "revenue_growth": info.get("revenueGrowth"),
            "earnings_growth": info.get("earningsGrowth"),
            "dividend_yield": info.get("dividendYield"),
            "beta": info.get("beta"),
            "52_week_high": info.get("fiftyTwoWeekHigh"),
            "52_week_low": info.get("fiftyTwoWeekLow"),
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error fetching stock data: {str(e)}"
        )


@router.get("/{symbol}/history")
async def get_stock_history(
    symbol: str, period: str = "1y", interval: str = "1d"
) -> Dict:
    try:
        stock = yf.Ticker(symbol.upper())
        original_period = period

        # Handle 2h timeframe - get 1-minute data for last 2 hours (120 data points)
        if period == "2h":
            period = "1d"
            interval = "1m"
        # Handle 2d timeframe - get 10-minute data for 2 days
        elif period == "2d":
            period = "5d"
            interval = "5m"
        # Handle 1w timeframe - get 30-minute data for 1 week
        elif period == "1w":
            period = "5d"
            interval = "30m"
        # Handle 3h timeframe - get 1 day of 15-minute data, then take last 3 hours (12 data points)
        elif period == "3h":
            period = "1d"
            interval = "15m"
        # Handle 1m timeframe for 1-minute data (only available for current day)
        elif period == "1m":
            period = "1d"
            interval = "1m"

        # Handle 1-day requests - get intraday data for the current trading day
        if original_period == "1d":
            period = "2d"  # Get 2 days to ensure we have recent trading day data
            interval = "1m"  # 1-minute intervals for detailed intraday view

        print(f"DEBUG: symbol={symbol}, original_period={original_period}, final_period={period}, interval={interval}")
        hist = stock.history(period=period, interval=interval)

        if hist.empty:
            raise HTTPException(
                status_code=404, detail=f"No historical data found for {symbol}"
            )

        # Handle 1-day requests - filter to most recent trading day intraday data
        if original_period == "1d":
            # Get the most recent trading day's data
            hist = hist.dropna(subset=["Close"])
            if not hist.empty:
                # Get the most recent date and filter to only that day's data
                most_recent_date = hist.index[-1].date()
                hist = hist[hist.index.date == most_recent_date]

        # For 2h timeframe, limit to last 2 hours of trading data (120 intervals of 1 minute)
        if original_period == "2h":
            # Get the most recent 2 hours of actual trading data
            hist = hist.dropna(subset=["Close"])
            if not hist.empty:
                # Get the most recent timestamp and go back 2 hours from there
                latest_time = hist.index[-1]
                two_hours_ago = latest_time - pd.Timedelta(hours=2)
                hist = hist[hist.index >= two_hours_ago]
        # For 2d timeframe, limit to last 2 days of trading data (10-minute intervals)
        elif original_period == "2d":
            # Get last 2 days of 5-minute data (limited subset)
            hist = hist.dropna(subset=["Close"]).tail(192)  # ~2 days of 5-min intervals
        # For 1w timeframe, limit to last week of trading data (30-minute intervals)
        elif original_period == "1w":
            # Get last week of 30-minute data from 5d period
            hist = hist.dropna(subset=["Close"])  # Use all available data from 5d period
        # For 3h timeframe, limit to last 3 hours of trading data (12 intervals of 15 minutes)
        elif original_period == "3h":
            # Get last 3 hours that have data (12 intervals of 15 minutes each)
            hist = hist.dropna(subset=["Close"]).tail(12)
        # For 1m timeframe, limit to last 180 minutes (3 hours of 1-minute data)
        elif original_period == "1m":
            # Get last 3 hours of 1-minute data (180 data points)
            hist = hist.dropna(subset=["Close"]).tail(180)

        if hist.empty:
            raise HTTPException(
                status_code=404, detail=f"No historical data found for {symbol}"
            )

        hist.reset_index(inplace=True)

        # Format date based on interval - preserve timezone info for frontend conversion
        if (
            interval == "15m"
            or interval == "1h"
            or interval == "1m"
            or interval == "5m"
        ):
            # Keep the original datetime with timezone for proper conversion
            hist["Date"] = hist["Datetime"].dt.strftime("%Y-%m-%dT%H:%M:%S%z")
        else:
            hist["Date"] = hist["Date"].dt.strftime("%Y-%m-%d")

        return {"symbol": symbol.upper(), "data": hist.to_dict(orient="records")}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error fetching historical data: {str(e)}"
        )


@router.get("/{symbol}/financials")
async def get_financials(symbol: str) -> Dict:
    try:
        stock = yf.Ticker(symbol.upper())

        # Get financial statements
        income_stmt = stock.income_stmt
        balance_sheet = stock.balance_sheet
        cash_flow = stock.cashflow

        if income_stmt.empty and balance_sheet.empty and cash_flow.empty:
            raise HTTPException(
                status_code=404, detail=f"No financial data found for {symbol}"
            )

        # Convert to dict and handle NaN values
        financials = {
            "income_statement": (
                income_stmt.fillna(0).to_dict() if not income_stmt.empty else {}
            ),
            "balance_sheet": (
                balance_sheet.fillna(0).to_dict() if not balance_sheet.empty else {}
            ),
            "cash_flow": cash_flow.fillna(0).to_dict() if not cash_flow.empty else {},
        }

        return {"symbol": symbol.upper(), "financials": financials}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error fetching financial data: {str(e)}"
        )


@router.get("/search/{query}")
async def search_stocks(query: str) -> List[Dict]:
    """Search for stocks by company name or symbol"""
    try:
        # For now, this is a simple implementation
        # In production, you'd want to use a proper stock search API
        ticker = yf.Ticker(query.upper())
        info = ticker.info

        if info and "symbol" in info:
            return [
                {
                    "symbol": info.get("symbol"),
                    "name": info.get("longName"),
                    "sector": info.get("sector"),
                    "market_cap": info.get("marketCap"),
                }
            ]
        else:
            return []
    except Exception:
        return []
