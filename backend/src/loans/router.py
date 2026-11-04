"""
Loans & Financial Services module — EMI Calculator & Loan Eligibility.
"""

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/loans", tags=["Loans & EMI"])


class EMICalculateRequest(BaseModel):
    loan_amount: float = Field(gt=0, description="Principal loan amount in INR")
    interest_rate: float = Field(gt=0, le=30, description="Annual interest rate in %")
    tenure_years: int = Field(gt=0, le=35, description="Tenure in years")


class LoanEligibilityRequest(BaseModel):
    monthly_income: float = Field(gt=0)
    existing_emis: float = Field(default=0, ge=0)
    interest_rate: float = Field(default=8.5)
    tenure_years: int = Field(default=20)


@router.post("/calculate-emi", summary="Calculate monthly EMI and total interest")
async def calculate_emi(data: EMICalculateRequest):
    p = data.loan_amount
    r = (data.interest_rate / 12) / 100
    n = data.tenure_years * 12

    # EMI Formula: P * r * (1+r)^n / ((1+r)^n - 1)
    emi = p * r * ((1 + r) ** n) / (((1 + r) ** n) - 1)
    total_payment = emi * n
    total_interest = total_payment - p

    return {
        "monthly_emi": round(emi, 2),
        "total_payment": round(total_payment, 2),
        "total_interest": round(total_interest, 2),
        "principal_amount": p,
        "tenure_months": n,
        "annual_interest_rate": data.interest_rate,
    }


@router.post("/eligibility", summary="Check loan eligibility")
async def check_eligibility(data: LoanEligibilityRequest):
    max_allowed_emi = (data.monthly_income * 0.50) - data.existing_emis
    max_allowed_emi = max(0, max_allowed_emi)

    r = (data.interest_rate / 12) / 100
    n = data.tenure_years * 12
    max_loan = (max_allowed_emi * (((1 + r) ** n) - 1)) / (r * ((1 + r) ** n))

    return {
        "eligible_loan_amount": round(max_loan, 2),
        "max_monthly_emi": round(max_allowed_emi, 2),
        "monthly_income": data.monthly_income,
    }
