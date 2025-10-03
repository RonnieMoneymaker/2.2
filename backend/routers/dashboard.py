from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timedelta

from database import get_db
from models import User, Contact, Deal, Task, DealStage, TaskStatus
from schemas import DashboardStats, DealsByStage
from auth import get_current_active_user

router = APIRouter()

@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get dashboard statistics"""
    
    # Total counts
    total_contacts = db.query(Contact).count()
    total_deals = db.query(Deal).count()
    total_deal_value = db.query(func.sum(Deal.value)).scalar() or 0
    
    # This month's deals
    start_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    end_of_month = (start_of_month + timedelta(days=32)).replace(day=1) - timedelta(days=1)
    
    deals_won_this_month = db.query(Deal).filter(
        and_(
            Deal.stage == DealStage.CLOSED_WON,
            Deal.actual_close_date >= start_of_month,
            Deal.actual_close_date <= end_of_month
        )
    ).count()
    
    deals_lost_this_month = db.query(Deal).filter(
        and_(
            Deal.stage == DealStage.CLOSED_LOST,
            Deal.actual_close_date >= start_of_month,
            Deal.actual_close_date <= end_of_month
        )
    ).count()
    
    # Task statistics
    tasks_pending = db.query(Task).filter(
        Task.status.in_([TaskStatus.TODO, TaskStatus.IN_PROGRESS])
    ).count()
    
    tasks_overdue = db.query(Task).filter(
        and_(
            Task.due_date < datetime.utcnow(),
            Task.status != TaskStatus.COMPLETED
        )
    ).count()
    
    return DashboardStats(
        total_contacts=total_contacts,
        total_deals=total_deals,
        total_deal_value=total_deal_value,
        deals_won_this_month=deals_won_this_month,
        deals_lost_this_month=deals_lost_this_month,
        tasks_pending=tasks_pending,
        tasks_overdue=tasks_overdue
    )

@router.get("/deals-by-stage")
async def get_deals_by_stage(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get deals grouped by stage"""
    
    deals_by_stage = []
    
    for stage in DealStage:
        result = db.query(
            func.count(Deal.id).label('count'),
            func.sum(Deal.value).label('value')
        ).filter(Deal.stage == stage).first()
        
        deals_by_stage.append({
            "stage": stage.value,
            "count": result.count or 0,
            "value": float(result.value or 0)
        })
    
    return deals_by_stage

@router.get("/recent-activities")
async def get_recent_activities(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get recent activities (simplified version)"""
    
    # For now, return recent deals and tasks as activities
    recent_deals = db.query(Deal).order_by(Deal.created_at.desc()).limit(limit//2).all()
    recent_tasks = db.query(Task).order_by(Task.created_at.desc()).limit(limit//2).all()
    
    activities = []
    
    for deal in recent_deals:
        activities.append({
            "id": deal.id,
            "type": "deal",
            "subject": f"Deal created: {deal.title}",
            "created_at": deal.created_at,
            "user_name": deal.owner.full_name if deal.owner else "Unknown"
        })
    
    for task in recent_tasks:
        activities.append({
            "id": task.id,
            "type": "task",
            "subject": f"Task created: {task.title}",
            "created_at": task.created_at,
            "user_name": task.assignee.full_name if task.assignee else "Unknown"
        })
    
    # Sort by created_at descending
    activities.sort(key=lambda x: x["created_at"], reverse=True)
    
    return activities[:limit]
