"""
Calculation and business logic service
Contains financial algorithms for scores, forecasts, and aggregations
"""
from typing import List, Dict, Any
from datetime import datetime

def calculate_finance_score(
    saving_rate: float,
    debt_trend: float,
    budget_adherence: float,
    negative_cash_risk: float
) -> float:
    """
    Calculate financial health score (0-100)
    
    Args:
        saving_rate: Percentage of income saved (0-1)
        debt_trend: Debt growth trend (0-1, lower is better)
        budget_adherence: Budget compliance (0-1)
        negative_cash_risk: Risk of negative cashflow (0-1, lower is better)
    
    Returns:
        Score from 0 to 100
    """
    score = (
        40 * saving_rate +
        20 * (1 - debt_trend) +
        30 * budget_adherence +
        10 * (1 - negative_cash_risk)
    )
    
    return max(0, min(100, score))


def forecast_cashflow(
    history: List[Dict[str, float]],
    months: int = 6,
    factor: float = 1.0
) -> List[Dict[str, Any]]:
    """
    Forecast future cashflow based on historical data
    
    Args:
        history: List of monthly data with 'income' and 'expense'
        months: Number of months to forecast
        factor: Adjustment factor (0.9 for pessimistic, 1.0 for base, 1.1 for optimistic)
    
    Returns:
        List of forecasted months with income, expense, and balance
    """
    if not history:
        return []
    
    # Calculate averages from history
    hist = history[-6:] if len(history) >= 6 else history
    avg_income = sum(h['income'] for h in hist) / max(1, len(hist))
    avg_expense = sum(h['expense'] for h in hist) / max(1, len(hist))
    
    # Generate forecast
    forecast = []
    for i in range(months):
        month_forecast = {
            'month_offset': i + 1,
            'income': round(avg_income * factor, 2),
            'expense': round(avg_expense * factor, 2),
            'balance': round(avg_income * factor - avg_expense * factor, 2)
        }
        forecast.append(month_forecast)
    
    return forecast


async def get_month_aggregates(household_id: str, month: str) -> Dict[str, Any]:
    """
    Get or calculate aggregated data for a month
    This would typically check a cache/insights collection first
    
    Args:
        household_id: The household ID
        month: Month in YYYY-MM format
    
    Returns:
        Dictionary with aggregated metrics
    """
    # TODO: Implement caching/aggregation logic
    # For now, return empty dict - caller will calculate from transactions
    return {}


def calculate_budget_adherence(budget: Dict[str, Any], actual: Dict[str, float]) -> float:
    """
    Calculate how well actual spending matches budget
    
    Args:
        budget: Budget allocation by category
        actual: Actual spending by category
    
    Returns:
        Adherence score (0-1)
    """
    if not budget:
        return 0.0
    
    total_categories = len(budget)
    adherent_categories = 0
    
    for category_id, allocated in budget.items():
        actual_spent = actual.get(category_id, 0)
        # Consider adherent if within 10% of budget
        if actual_spent <= allocated * 1.1:
            adherent_categories += 1
    
    return adherent_categories / total_categories if total_categories > 0 else 0.0
