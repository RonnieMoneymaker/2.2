from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from models import UserRole, DealStage, TaskStatus, TaskPriority

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    role: UserRole = UserRole.USER
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

class User(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Contact schemas
class ContactBase(BaseModel):
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    position: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[str] = None

class ContactCreate(ContactBase):
    owner_id: int

class ContactUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    position: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[str] = None

class Contact(ContactBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime
    owner: User
    
    class Config:
        from_attributes = True

# Deal schemas
class DealBase(BaseModel):
    title: str
    description: Optional[str] = None
    value: float = 0.0
    stage: DealStage = DealStage.LEAD
    probability: int = 0
    expected_close_date: Optional[datetime] = None

class DealCreate(DealBase):
    contact_id: int
    owner_id: int

class DealUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    value: Optional[float] = None
    stage: Optional[DealStage] = None
    probability: Optional[int] = None
    expected_close_date: Optional[datetime] = None
    actual_close_date: Optional[datetime] = None

class Deal(DealBase):
    id: int
    contact_id: int
    owner_id: int
    actual_close_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    contact: Contact
    owner: User
    
    class Config:
        from_attributes = True

# Task schemas
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    due_date: Optional[datetime] = None

class TaskCreate(TaskBase):
    assignee_id: int
    deal_id: Optional[int] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class Task(TaskBase):
    id: int
    assignee_id: int
    deal_id: Optional[int] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    assignee: User
    
    class Config:
        from_attributes = True

# Auth schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

# Dashboard schemas
class DashboardStats(BaseModel):
    total_contacts: int
    total_deals: int
    total_deal_value: float
    deals_won_this_month: int
    deals_lost_this_month: int
    tasks_pending: int
    tasks_overdue: int

class DealsByStage(BaseModel):
    stage: str
    count: int
    value: float

class RecentActivity(BaseModel):
    id: int
    type: str
    subject: str
    created_at: datetime
    user_name: str
