from fastapi import APIRouter, Request, HTTPException, Query
from models.schemas import OverviewResponse, CategorySummary, Alert, Goal
from services.firestore_service import firestore_service
from services.calculation_service import calculate_finance_score, get_month_aggregates
from datetime import datetime
from typing import List

router = APIRouter()

@router.get("/overview", response_model=OverviewResponse)
async def get_overview(
    request: Request,
    householdId: str = Query(...),
    month: str = Query(default=None)
):
    """
    Get financial overview for a household
    Shows KPIs, charts, forecasts, and alerts
    """
    user_id = request.state.user_id
    
    # Default to current month
    if not month:
        month = datetime.now().strftime("%Y-%m")
    
    try:
        # Get aggregated data for the month
        aggregates = await get_month_aggregates(householdId, month)
        
        # Get transactions for the month
        transactions = await firestore_service.query_documents(
            "transactions",
            filters=[
                ("householdId", "==", householdId),
                ("date", ">=", datetime.strptime(f"{month}-01", "%Y-%m-%d")),
            ]
        )
        
        # Calculate totals
        total_income = sum(t['amount'] for t in transactions if t['type'] == 'income')
        total_expenses = sum(t['amount'] for t in transactions if t['type'] == 'expense')
        balance = total_income - total_expenses
        
        # Get budget to calculate projected
        budgets = await firestore_service.query_documents(
            "budgets",
            filters=[
                ("householdId", "==", householdId),
                ("month", "==", month)
            ],
            limit=1
        )
        
        projected_income = budgets[0]['totalIncome'] if budgets else total_income
        projected_expenses = sum(cat['allocated'] for cat in budgets[0]['categories']) if budgets else total_expenses
        projected_balance = projected_income - projected_expenses
        
        # Calculate savings rate
        savings_rate = ((total_income - total_expenses) / total_income * 100) if total_income > 0 else 0
        
        # Calculate score
        score = calculate_finance_score(
            saving_rate=savings_rate / 100,
            debt_trend=0.1,  # TODO: Calculate from debt data
            budget_adherence=0.85,  # TODO: Calculate from budget vs actual
            negative_cash_risk=0.1  # TODO: Calculate from forecast
        )
        
        # Get top categories
        category_totals = {}
        for t in transactions:
            if t['type'] == 'expense':
                cat_id = t['categoryId']
                category_totals[cat_id] = category_totals.get(cat_id, 0) + t['amount']
        
        main_categories = [
            CategorySummary(
                categoryId=cat_id,
                categoryName=cat_id,  # TODO: Get actual category names
                amount=amount,
                percentage=(amount / total_expenses * 100) if total_expenses > 0 else 0
            )
            for cat_id, amount in sorted(category_totals.items(), key=lambda x: x[1], reverse=True)[:5]
        ]
        
        # Get active goals
        goals_data = await firestore_service.query_documents(
            "goals",
            filters=[
                ("householdId", "==", householdId),
                ("isActive", "==", True)
            ],
            limit=5
        )
        
        goals = [Goal(**g) for g in goals_data]
        
        # Generate alerts
        alerts: List[Alert] = []
        
        # Alert if spending is high
        if total_expenses > projected_expenses * 1.1:
            alerts.append(Alert(
                type="warning",
                title="Gastos acima do orçado",
                message=f"Você já gastou R$ {total_expenses:.2f}, que é 10% acima do orçamento de R$ {projected_expenses:.2f}"
            ))
        
        # Alert if savings rate is low
        if savings_rate < 10:
            alerts.append(Alert(
                type="danger",
                title="Taxa de poupança baixa",
                message=f"Sua taxa de poupança está em {savings_rate:.1f}%. Recomendamos manter acima de 20%."
            ))
        
        return OverviewResponse(
            totalIncome=total_income,
            totalExpenses=total_expenses,
            balance=balance,
            projectedBalance=projected_balance,
            savingsRate=savings_rate,
            score=score,
            mainCategories=main_categories,
            goals=goals,
            alerts=alerts
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting overview: {str(e)}")
