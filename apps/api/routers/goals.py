from fastapi import APIRouter, Request, HTTPException, Query
from models.schemas import Goal
from services.firestore_service import firestore_service
from typing import List

router = APIRouter()

@router.get("/goals", response_model=List[Goal])
async def list_goals(
    request: Request,
    householdId: str = Query(...)
):
    """List all goals for a household"""
    user_id = request.state.user_id
    
    goals = await firestore_service.query_documents(
        "goals",
        filters=[("householdId", "==", householdId)],
        order_by="createdAt"
    )
    
    return [Goal(**g) for g in goals]

@router.post("/goals", response_model=Goal)
async def create_goal(request: Request, goal: Goal):
    """Create a new goal"""
    user_id = request.state.user_id
    
    goal_data = goal.model_dump()
    doc_id = await firestore_service.create_document("goals", goal_data)
    
    created = await firestore_service.get_document("goals", doc_id)
    return Goal(**created)

@router.get("/goals/{goal_id}", response_model=Goal)
async def get_goal(request: Request, goal_id: str):
    """Get a specific goal"""
    user_id = request.state.user_id
    
    goal = await firestore_service.get_document("goals", goal_id)
    
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    return Goal(**goal)

@router.put("/goals/{goal_id}/contribute")
async def contribute_to_goal(
    request: Request,
    goal_id: str,
    amount: float
):
    """Add a contribution to a goal"""
    user_id = request.state.user_id
    
    goal = await firestore_service.get_document("goals", goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    new_amount = goal['currentAmount'] + amount
    await firestore_service.update_document("goals", goal_id, {
        'currentAmount': new_amount
    })
    
    updated = await firestore_service.get_document("goals", goal_id)
    return Goal(**updated)
