from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import yfinance as yf
import numpy as np
from typing import Dict, List, Optional

router = APIRouter(prefix="/api/valuation", tags=["valuation"])

class DCFInputs(BaseModel):
    symbol: str
    revenue_growth_rates: List[float]  # 5-year projections
    operating_margin: float
    tax_rate: float
    capex_as_percent_revenue: float
    working_capital_change: float
    wacc: float
    terminal_growth_rate: float

@router.post("/dcf")
async def calculate_dcf(inputs: DCFInputs) -> Dict:
    """Calculate Discounted Cash Flow valuation"""
    try:
        stock = yf.Ticker(inputs.symbol.upper())
        info = stock.info
        
        if not info or 'symbol' not in info:
            raise HTTPException(status_code=404, detail=f"Stock {inputs.symbol} not found")
        
        # Get latest financials
        financials = stock.financials
        if financials.empty:
            raise HTTPException(status_code=400, detail="No financial data available for DCF calculation")
        
        # Get latest revenue (most recent year)
        latest_revenue = financials.loc['Total Revenue'].iloc[0] if 'Total Revenue' in financials.index else 0
        
        if latest_revenue <= 0:
            raise HTTPException(status_code=400, detail="Invalid revenue data for DCF calculation")
        
        # Project future cash flows
        projected_revenues = []
        current_revenue = latest_revenue
        
        for growth_rate in inputs.revenue_growth_rates:
            current_revenue *= (1 + growth_rate)
            projected_revenues.append(current_revenue)
        
        # Calculate free cash flows
        free_cash_flows = []
        for revenue in projected_revenues:
            operating_income = revenue * inputs.operating_margin
            tax = operating_income * inputs.tax_rate
            nopat = operating_income - tax
            capex = revenue * inputs.capex_as_percent_revenue
            fcf = nopat - capex - inputs.working_capital_change
            free_cash_flows.append(fcf)
        
        # Calculate terminal value
        terminal_fcf = free_cash_flows[-1] * (1 + inputs.terminal_growth_rate)
        terminal_value = terminal_fcf / (inputs.wacc - inputs.terminal_growth_rate)
        
        # Discount cash flows to present value
        pv_fcfs = []
        for i, fcf in enumerate(free_cash_flows):
            pv = fcf / ((1 + inputs.wacc) ** (i + 1))
            pv_fcfs.append(pv)
        
        pv_terminal = terminal_value / ((1 + inputs.wacc) ** len(free_cash_flows))
        
        # Calculate enterprise value and equity value
        enterprise_value = sum(pv_fcfs) + pv_terminal
        
        # Get debt and cash from balance sheet
        balance_sheet = stock.balance_sheet
        cash = balance_sheet.loc['Cash And Cash Equivalents'].iloc[0] if not balance_sheet.empty and 'Cash And Cash Equivalents' in balance_sheet.index else 0
        debt = balance_sheet.loc['Total Debt'].iloc[0] if not balance_sheet.empty and 'Total Debt' in balance_sheet.index else 0
        
        equity_value = enterprise_value + cash - debt
        
        # Calculate per share value
        shares_outstanding = info.get('sharesOutstanding', 0)
        if shares_outstanding <= 0:
            raise HTTPException(status_code=400, detail="Invalid shares outstanding data")
        
        dcf_value_per_share = equity_value / shares_outstanding
        current_price = info.get('currentPrice', 0)
        
        upside_downside = ((dcf_value_per_share - current_price) / current_price * 100) if current_price > 0 else 0
        
        return {
            "symbol": inputs.symbol.upper(),
            "dcf_value_per_share": round(dcf_value_per_share, 2),
            "current_price": current_price,
            "upside_downside_percent": round(upside_downside, 2),
            "enterprise_value": round(enterprise_value, 0),
            "equity_value": round(equity_value, 0),
            "projected_fcfs": [round(fcf, 0) for fcf in free_cash_flows],
            "pv_fcfs": [round(pv, 0) for pv in pv_fcfs],
            "terminal_value": round(terminal_value, 0),
            "pv_terminal_value": round(pv_terminal, 0)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating DCF: {str(e)}")

@router.get("/{symbol}/ratios")
async def get_valuation_ratios(symbol: str) -> Dict:
    """Get key valuation ratios"""
    try:
        stock = yf.Ticker(symbol.upper())
        info = stock.info
        
        if not info or 'symbol' not in info:
            raise HTTPException(status_code=404, detail=f"Stock {symbol} not found")
        
        # Calculate additional ratios
        market_cap = info.get('marketCap', 0)
        revenue = info.get('totalRevenue', 0)
        price_to_sales = (market_cap / revenue) if revenue > 0 else None
        
        ev = info.get('enterpriseValue', 0)
        ebitda = info.get('ebitda', 0)
        ev_to_ebitda = (ev / ebitda) if ebitda > 0 else None
        
        return {
            "symbol": symbol.upper(),
            "pe_ratio": info.get('trailingPE'),
            "forward_pe": info.get('forwardPE'),
            "peg_ratio": info.get('pegRatio'),
            "price_to_book": info.get('priceToBook'),
            "price_to_sales": round(price_to_sales, 2) if price_to_sales else None,
            "ev_to_ebitda": round(ev_to_ebitda, 2) if ev_to_ebitda else None,
            "price_to_cash_flow": info.get('priceToCashFlowsPerShare'),
            "enterprise_to_revenue": info.get('enterpriseToRevenue'),
            "market_cap": market_cap,
            "enterprise_value": ev
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching valuation ratios: {str(e)}")

@router.get("/{symbol}/peer-comparison")
async def get_peer_comparison(symbol: str) -> Dict:
    """Compare valuation metrics with industry peers"""
    try:
        stock = yf.Ticker(symbol.upper())
        info = stock.info
        
        if not info or 'symbol' not in info:
            raise HTTPException(status_code=404, detail=f"Stock {symbol} not found")
        
        sector = info.get('sector')
        industry = info.get('industry')
        
        # This is a simplified implementation
        # In production, you'd maintain a database of peer companies
        company_metrics = {
            "pe_ratio": info.get('trailingPE'),
            "price_to_book": info.get('priceToBook'),
            "price_to_sales": info.get('priceToSalesTrailing12Months'),
            "debt_to_equity": info.get('debtToEquity'),
            "return_on_equity": info.get('returnOnEquity'),
            "profit_margin": info.get('profitMargins')
        }
        
        # Industry averages (these would be calculated from peer data in production)
        industry_averages = {
            "pe_ratio": 20.0,  # Example average
            "price_to_book": 2.5,
            "price_to_sales": 3.0,
            "debt_to_equity": 0.4,
            "return_on_equity": 0.15,
            "profit_margin": 0.10
        }
        
        return {
            "symbol": symbol.upper(),
            "sector": sector,
            "industry": industry,
            "company_metrics": company_metrics,
            "industry_averages": industry_averages,
            "relative_valuation": {
                metric: (
                    "Undervalued" if company_metrics.get(metric, 0) < industry_averages.get(metric, 0)
                    else "Overvalued"
                ) for metric in ["pe_ratio", "price_to_book", "price_to_sales"]
                if company_metrics.get(metric) is not None
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error performing peer comparison: {str(e)}")