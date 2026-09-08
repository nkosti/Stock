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
    except HTTPException:
        raise
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

        # Map UI timeframes to yfinance (period, interval) pairs
        if period == "2h":
            period, interval = "1d", "1m"
        elif period == "2d":
            period, interval = "5d", "5m"
        elif period == "1w":
            period, interval = "5d", "30m"
        elif period == "3h":
            period, interval = "1d", "15m"
        elif period == "1m":
            period, interval = "1mo", "1d"
        elif period == "3m":
            period, interval = "3mo", "1d"
        elif period == "6m":
            period, interval = "6mo", "1d"

        # Handle 1-day requests - get intraday data for the current trading day
        if original_period == "1d":
            period = "2d"  # Get 2 days to ensure we have recent trading day data
            interval = "1m"  # 1-minute intervals for detailed intraday view

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
            hist = hist.dropna(
                subset=["Close"]
            )  # Use all available data from 5d period
        # For 3h timeframe, limit to last 3 hours of trading data (12 intervals of 15 minutes)
        elif original_period == "3h":
            # Get last 3 hours that have data (12 intervals of 15 minutes each)
            hist = hist.dropna(subset=["Close"]).tail(12)

        if hist.empty:
            raise HTTPException(
                status_code=404, detail=f"No historical data found for {symbol}"
            )

        hist.reset_index(inplace=True)

        # Intraday data comes back with a "Datetime" index, daily data with "Date" -
        # branch on the actual column so no interval slips through unformatted
        if "Datetime" in hist.columns:
            # Keep the original datetime with timezone for proper conversion
            hist["Date"] = hist["Datetime"].dt.strftime("%Y-%m-%dT%H:%M:%S%z")
        else:
            hist["Date"] = hist["Date"].dt.strftime("%Y-%m-%d")

        return {"symbol": symbol.upper(), "data": hist.to_dict(orient="records")}
    except HTTPException:
        raise
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
    except HTTPException:
        raise
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
