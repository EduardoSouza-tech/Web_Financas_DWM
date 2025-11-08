from fastapi import APIRouter, Request, HTTPException, Query
from models.schemas import Budget
from services.firestore_service import firestore_service
from typing import List

router = APIRouter()

@router.get("/budgets", response_model=List[Budget])
async def list_budgets(
    request: Request,
    householdId: str = Query(...)
):
    """List all budgets for a household"""
    user_id = request.state.user_id
    
    budgets = await firestore_service.query_documents(
        "budgets",
        filters=[("householdId", "==", householdId)],
        order_by="month"
    )
    
    return [Budget(**b) for b in budgets]

@router.post("/budgets", response_model=Budget)
async def create_budget(request: Request, budget: Budget):
    """Create a new budget"""
    user_id = request.state.user_id
    
    budget_data = budget.model_dump()
    doc_id = await firestore_service.create_document("budgets", budget_data)
    
    created = await firestore_service.get_document("budgets", doc_id)
    return Budget(**created)

@router.get("/budgets/{budget_id}", response_model=Budget)
async def get_budget(request: Request, budget_id: str):
    """Get a specific budget"""
    user_id = request.state.user_id
    
    budget = await firestore_service.get_document("budgets", budget_id)
    
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    return Budget(**budget)
