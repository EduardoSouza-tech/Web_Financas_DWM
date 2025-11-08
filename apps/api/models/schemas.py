from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime
from enum import Enum

# Enums
class TransactionType(str, Enum):
    income = "income"
    expense = "expense"
    transfer = "transfer"

class TransactionStatus(str, Enum):
    pending = "pending"
    cleared = "cleared"
    cancelled = "cancelled"

class AccountType(str, Enum):
    checking = "checking"
    savings = "savings"
    investment = "investment"
    credit_card = "credit_card"

class BudgetModel(str, Enum):
    zero_based = "zero_based"
    fifty_thirty_twenty = "50/30/20"
    envelope = "envelope"

class GoalType(str, Enum):
    savings = "savings"
    reserve = "reserve"
    debt_payment = "debt_payment"

# Transaction Models
class InstallmentInfo(BaseModel):
    current: int
    total: int
    rate: Optional[float] = 0.0

class Transaction(BaseModel):
    txId: Optional[str] = None
    householdId: str
    personId: str
    accountId: str
    cardId: Optional[str] = None
    type: TransactionType
    amount: float
    currency: str = "BRL"
    date: datetime
    categoryId: str
    tags: List[str] = []
    status: TransactionStatus = TransactionStatus.pending
    isInstallment: bool = False
    installment: Optional[InstallmentInfo] = None
    notes: Optional[str] = None
    attachments: List[str] = []
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

class TransactionCreate(BaseModel):
    householdId: str
    personId: str
    accountId: str
    cardId: Optional[str] = None
    type: TransactionType
    amount: float
    currency: str = "BRL"
    date: datetime
    categoryId: str
    tags: List[str] = []
    isInstallment: bool = False
    installment: Optional[InstallmentInfo] = None
    notes: Optional[str] = None

class TransactionUpdate(BaseModel):
    amount: Optional[float] = None
    date: Optional[datetime] = None
    categoryId: Optional[str] = None
    tags: Optional[List[str]] = None
    status: Optional[TransactionStatus] = None
    notes: Optional[str] = None

# Account Models
class Account(BaseModel):
    accountId: Optional[str] = None
    householdId: str
    name: str
    type: AccountType
    balance: float = 0.0
    currency: str = "BRL"
    color: Optional[str] = None
    icon: Optional[str] = None
    isActive: bool = True
    createdAt: Optional[datetime] = None

# Budget Models
class BudgetCategory(BaseModel):
    categoryId: str
    allocated: float
    spent: float = 0.0
    rollover: bool = False

class Budget(BaseModel):
    budgetId: Optional[str] = None
    householdId: str
    month: str  # YYYY-MM format
    model: BudgetModel
    categories: List[BudgetCategory]
    totalIncome: float
    totalAllocated: float
    createdAt: Optional[datetime] = None

# Goal Models
class Goal(BaseModel):
    goalId: Optional[str] = None
    householdId: str
    name: str
    type: GoalType
    targetAmount: float
    currentAmount: float = 0.0
    deadline: Optional[datetime] = None
    monthlyContribution: Optional[float] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    isActive: bool = True
    createdAt: Optional[datetime] = None

# Overview Response Models
class CategorySummary(BaseModel):
    categoryId: str
    categoryName: str
    amount: float
    percentage: float

class Alert(BaseModel):
    type: Literal["warning", "info", "danger"]
    title: str
    message: str
    categoryId: Optional[str] = None

class OverviewResponse(BaseModel):
    totalIncome: float
    totalExpenses: float
    balance: float
    projectedBalance: float
    savingsRate: float
    score: float
    mainCategories: List[CategorySummary]
    goals: List[Goal]
    alerts: List[Alert]

# Forecast Models
class MonthlyForecast(BaseModel):
    month_offset: int
    income: float
    expense: float
    balance: float

class ForecastResponse(BaseModel):
    scenario: Literal["pessimistic", "base", "optimistic"]
    months: List[MonthlyForecast]
    totalProjected: float
