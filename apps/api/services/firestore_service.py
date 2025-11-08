from firebase_admin import firestore
from typing import Optional, List, Dict, Any
from datetime import datetime

db = firestore.client()

class FirestoreService:
    def __init__(self):
        self.db = db
    
    # Generic CRUD operations
    async def create_document(self, collection: str, data: Dict[str, Any], doc_id: Optional[str] = None) -> str:
        """Create a document in Firestore"""
        data['createdAt'] = datetime.utcnow()
        data['updatedAt'] = datetime.utcnow()
        
        if doc_id:
            self.db.collection(collection).document(doc_id).set(data)
            return doc_id
        else:
            doc_ref = self.db.collection(collection).add(data)
            return doc_ref[1].id
    
    async def get_document(self, collection: str, doc_id: str) -> Optional[Dict[str, Any]]:
        """Get a document by ID"""
        doc = self.db.collection(collection).document(doc_id).get()
        if doc.exists:
            data = doc.to_dict()
            data['id'] = doc.id
            return data
        return None
    
    async def update_document(self, collection: str, doc_id: str, data: Dict[str, Any]) -> bool:
        """Update a document"""
        data['updatedAt'] = datetime.utcnow()
        self.db.collection(collection).document(doc_id).update(data)
        return True
    
    async def delete_document(self, collection: str, doc_id: str) -> bool:
        """Delete a document"""
        self.db.collection(collection).document(doc_id).delete()
        return True
    
    async def query_documents(
        self, 
        collection: str, 
        filters: Optional[List[tuple]] = None,
        order_by: Optional[str] = None,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Query documents with filters"""
        query = self.db.collection(collection)
        
        if filters:
            for field, operator, value in filters:
                query = query.where(field, operator, value)
        
        if order_by:
            query = query.order_by(order_by)
        
        if limit:
            query = query.limit(limit)
        
        docs = query.stream()
        results = []
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            results.append(data)
        
        return results

firestore_service = FirestoreService()
