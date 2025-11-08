from fastapi import APIRouter, Request, HTTPException, Query
from models.schemas import Transaction, TransactionCreate, TransactionUpdate
from services.firestore_service import firestore_service
from typing import List, Optional
from datetime import datetime

router = APIRouter()

@router.post("/transactions", response_model=Transaction)
async def create_transaction(request: Request, transaction: TransactionCreate):
    """Create a new transaction"""
    user_id = request.state.user_id
    
    # Convert to dict and add metadata
    transaction_data = transaction.model_dump()
    transaction_data['createdBy'] = user_id
    
    # Create in Firestore
    doc_id = await firestore_service.create_document("transactions", transaction_data)
    
    # Get created transaction
    created = await firestore_service.get_document("transactions", doc_id)
    return Transaction(**created)

@router.get("/transactions", response_model=List[Transaction])
async def list_transactions(
    request: Request,
    householdId: str = Query(...),
    accountId: Optional[str] = Query(None),
    categoryId: Optional[str] = Query(None),
    startDate: Optional[str] = Query(None),
    endDate: Optional[str] = Query(None),
    limit: int = Query(100, le=1000)
):
    """List transactions with filters"""
    user_id = request.state.user_id
    
    filters = [("householdId", "==", householdId)]
    
    if accountId:
        filters.append(("accountId", "==", accountId))
    
    if categoryId:
        filters.append(("categoryId", "==", categoryId))
    
    if startDate:
        filters.append(("date", ">=", datetime.fromisoformat(startDate)))
    
    if endDate:
        filters.append(("date", "<=", datetime.fromisoformat(endDate)))
    
    transactions = await firestore_service.query_documents(
        "transactions",
        filters=filters,
        order_by="date",
        limit=limit
    )
    
    return [Transaction(**t) for t in transactions]

@router.get("/transactions/{transaction_id}", response_model=Transaction)
async def get_transaction(request: Request, transaction_id: str):
    """Get a specific transaction"""
    user_id = request.state.user_id
    
    transaction = await firestore_service.get_document("transactions", transaction_id)
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    return Transaction(**transaction)

@router.put("/transactions/{transaction_id}", response_model=Transaction)
async def update_transaction(
    request: Request,
    transaction_id: str,
    updates: TransactionUpdate
):
    """Update a transaction"""
    user_id = request.state.user_id
    
    # Get existing transaction
    existing = await firestore_service.get_document("transactions", transaction_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Update only provided fields
    update_data = updates.model_dump(exclude_unset=True)
    await firestore_service.update_document("transactions", transaction_id, update_data)
    
    # Get updated transaction
    updated = await firestore_service.get_document("transactions", transaction_id)
    return Transaction(**updated)

@router.delete("/transactions/{transaction_id}")
async def delete_transaction(request: Request, transaction_id: str):
    """Delete a transaction"""
    user_id = request.state.user_id
    
    # Check if exists
    existing = await firestore_service.get_document("transactions", transaction_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    await firestore_service.delete_document("transactions", transaction_id)
    
    return {"message": "Transaction deleted successfully", "id": transaction_id}
