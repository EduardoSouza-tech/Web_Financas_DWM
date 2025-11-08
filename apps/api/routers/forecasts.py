from fastapi import APIRouter, Request, HTTPException, Query
from models.schemas import ForecastResponse, MonthlyForecast
from services.firestore_service import firestore_service
from services.calculation_service import forecast_cashflow
from datetime import datetime
from typing import Literal

router = APIRouter()

@router.get("/forecasts", response_model=ForecastResponse)
async def get_forecast(
    request: Request,
    householdId: str = Query(...),
    months: int = Query(6, ge=1, le=24),
    scenario: Literal["pessimistic", "base", "optimistic"] = Query("base")
):
    """
    Get cashflow forecast for upcoming months
    Supports pessimistic, base, and optimistic scenarios
    """
    user_id = request.state.user_id
    
    try:
        # Get historical transactions (last 6 months)
        transactions = await firestore_service.query_documents(
            "transactions",
            filters=[
                ("householdId", "==", householdId),
            ],
            order_by="date",
            limit=1000
        )
        
        # Group by month
        monthly_data = {}
        for t in transactions:
            month_key = t['date'].strftime("%Y-%m")
            if month_key not in monthly_data:
                monthly_data[month_key] = {'income': 0, 'expense': 0}
            
            if t['type'] == 'income':
                monthly_data[month_key]['income'] += t['amount']
            elif t['type'] == 'expense':
                monthly_data[month_key]['expense'] += t['amount']
        
        # Convert to history list
        history = [
            {'income': data['income'], 'expense': data['expense']}
            for data in sorted(monthly_data.values())[-6:]
        ]
        
        # Calculate scenario factor
        factors = {
            "pessimistic": 0.9,
            "base": 1.0,
            "optimistic": 1.1
        }
        
        factor = factors[scenario]
        
        # Generate forecast
        forecast = forecast_cashflow(history, months=months, factor=factor)
        
        # Calculate total
        total_projected = sum(m['balance'] for m in forecast)
        
        return ForecastResponse(
            scenario=scenario,
            months=[MonthlyForecast(**m) for m in forecast],
            totalProjected=total_projected
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating forecast: {str(e)}")
