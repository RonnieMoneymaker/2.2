from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from database import get_db
from models import User, Deal, DealStage
from schemas import Deal as DealSchema, DealCreate, DealUpdate
from auth import get_current_active_user

router = APIRouter()

@router.post("/", response_model=DealSchema)
async def create_deal(
    deal: DealCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_deal = Deal(**deal.dict())
    db.add(db_deal)
    db.commit()
    db.refresh(db_deal)
    return db_deal

@router.get("/", response_model=List[DealSchema])
async def read_deals(
    skip: int = 0,
    limit: int = 100,
    stage: Optional[DealStage] = Query(None, description="Filter by deal stage"),
    search: Optional[str] = Query(None, description="Search in title or description"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Deal)
    
    if stage:
        query = query.filter(Deal.stage == stage)
    
    if search:
        query = query.filter(
            or_(
                Deal.title.contains(search),
                Deal.description.contains(search)
            )
        )
    
    deals = query.offset(skip).limit(limit).all()
    return deals

@router.get("/{deal_id}", response_model=DealSchema)
async def read_deal(
    deal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if deal is None:
        raise HTTPException(status_code=404, detail="Deal not found")
    return deal

@router.put("/{deal_id}", response_model=DealSchema)
async def update_deal(
    deal_id: int,
    deal_update: DealUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if deal is None:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    update_data = deal_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(deal, field, value)
    
    db.commit()
    db.refresh(deal)
    return deal

@router.delete("/{deal_id}")
async def delete_deal(
    deal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if deal is None:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    db.delete(deal)
    db.commit()
    return {"message": "Deal deleted successfully"}

@router.get("/pipeline/stats")
async def get_pipeline_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get deal pipeline statistics"""
    pipeline_stats = []
    
    for stage in DealStage:
        deals = db.query(Deal).filter(Deal.stage == stage).all()
        total_value = sum(deal.value for deal in deals)
        
        pipeline_stats.append({
            "stage": stage.value,
            "count": len(deals),
            "total_value": total_value
        })
    
    return pipeline_stats
