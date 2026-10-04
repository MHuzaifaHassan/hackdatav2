"""
Built-in benchmark datasets for TSTR / TRTR evaluation.
Provides Credit Card Fraud, HR Churn, and Customer LTV datasets.
"""
import numpy as np
import pandas as pd
from typing import Dict, Any, List


def generate_credit_card_fraud_dataset(n_rows: int = 1000, seed: int = 42) -> pd.DataFrame:
    """Generates synthetic Credit Card Fraud dataset with realistic financial correlations."""
    rng = np.random.default_rng(seed)

    amounts = np.round(rng.lognormal(mean=4.5, sigma=1.2, size=n_rows), 2)
    oldbalanceOrg = np.round(rng.uniform(100.0, 50000.0, size=n_rows), 2)
    newbalanceOrig = np.maximum(0.0, np.round(oldbalanceOrg - amounts * rng.uniform(0.8, 1.2, size=n_rows), 2))
    oldbalanceDest = np.round(rng.uniform(0.0, 40000.0, size=n_rows), 2)
    newbalanceDest = np.round(oldbalanceDest + amounts * rng.uniform(0.8, 1.2, size=n_rows), 2)
    transaction_hour = rng.integers(0, 24, size=n_rows)
    is_foreign = rng.choice([0, 1], size=n_rows, p=[0.85, 0.15])

    # Probability of fraud increases with high amount, midnight hours, foreign transaction, and emptied balance
    fraud_score = (
        (amounts > 2500).astype(float) * 2.0 +
        ((transaction_hour >= 1) & (transaction_hour <= 5)).astype(float) * 1.5 +
        is_foreign * 1.8 +
        (newbalanceOrig == 0.0).astype(float) * 1.5 +
        rng.normal(0, 0.8, size=n_rows)
    )
    prob_fraud = 1.0 / (1.0 + np.exp(-(fraud_score - 2.5)))
    is_fraud = (rng.uniform(0, 1, size=n_rows) < prob_fraud).astype(int)

    # Ensure at least some fraud cases
    if is_fraud.sum() < 20:
        fraud_indices = np.argsort(fraud_score)[-30:]
        is_fraud[fraud_indices] = 1

    df = pd.DataFrame({
        "amount": amounts,
        "oldbalanceOrg": oldbalanceOrg,
        "newbalanceOrig": newbalanceOrig,
        "oldbalanceDest": oldbalanceDest,
        "newbalanceDest": newbalanceDest,
        "transaction_hour": transaction_hour,
        "is_foreign": is_foreign,
        "is_fraud": is_fraud
    })
    return df


def generate_hr_churn_dataset(n_rows: int = 1000, seed: int = 42) -> pd.DataFrame:
    """Generates synthetic HR Churn dataset for employee retention classification."""
    rng = np.random.default_rng(seed)

    satisfaction = np.round(rng.uniform(0.1, 1.0, size=n_rows), 2)
    last_evaluation = np.round(rng.uniform(0.3, 1.0, size=n_rows), 2)
    number_projects = rng.integers(2, 8, size=n_rows)
    monthly_hours = rng.integers(130, 310, size=n_rows)
    tenure_years = rng.integers(1, 11, size=n_rows)
    work_accident = rng.choice([0, 1], size=n_rows, p=[0.86, 0.14])
    promoted_5years = rng.choice([0, 1], size=n_rows, p=[0.97, 0.03])
    salary_level = rng.choice([0, 1, 2], size=n_rows, p=[0.45, 0.45, 0.10])  # 0: low, 1: medium, 2: high

    # Churn propensity score
    churn_score = (
        (1.0 - satisfaction) * 3.5 +
        (monthly_hours > 250).astype(float) * 1.8 +
        (number_projects > 5).astype(float) * 1.5 +
        (tenure_years >= 3).astype(float) * (tenure_years <= 5).astype(float) * 1.2 -
        promoted_5years * 2.0 -
        salary_level * 0.8 +
        rng.normal(0, 0.6, size=n_rows)
    )
    prob_churn = 1.0 / (1.0 + np.exp(-(churn_score - 2.0)))
    churn = (rng.uniform(0, 1, size=n_rows) < prob_churn).astype(int)

    if churn.sum() < 25:
        churn_indices = np.argsort(churn_score)[-35:]
        churn[churn_indices] = 1

    df = pd.DataFrame({
        "satisfaction_level": satisfaction,
        "last_evaluation": last_evaluation,
        "number_projects": number_projects,
        "monthly_hours": monthly_hours,
        "tenure_years": tenure_years,
        "work_accident": work_accident,
        "promoted_5years": promoted_5years,
        "salary_level": salary_level,
        "churn": churn
    })
    return df


def generate_customer_ltv_dataset(n_rows: int = 1000, seed: int = 42) -> pd.DataFrame:
    """Generates synthetic Customer Lifetime Value dataset for regression modeling."""
    rng = np.random.default_rng(seed)

    age = rng.integers(18, 70, size=n_rows)
    annual_income = np.round(rng.lognormal(10.8, 0.4, size=n_rows), 2)
    credit_score = rng.integers(300, 850, size=n_rows)
    tenure_months = rng.integers(1, 72, size=n_rows)
    support_tickets = rng.poisson(lam=1.8, size=n_rows)

    # LTV equation
    ltv = (
        annual_income * 0.04 +
        tenure_months * 45.0 +
        credit_score * 3.5 -
        support_tickets * 120.0 +
        rng.normal(0, 400.0, size=n_rows)
    )
    ltv = np.maximum(500.0, np.round(ltv, 2))

    df = pd.DataFrame({
        "age": age,
        "annual_income": annual_income,
        "credit_score": credit_score,
        "tenure_months": tenure_months,
        "support_tickets": support_tickets,
        "ltv_value": ltv
    })
    return df


DEMO_DATASETS = {
    "credit_card_fraud": {
        "name": "Credit Card Fraud Detection",
        "task_type": "classification",
        "target_col": "is_fraud",
        "description": "Financial transaction dataset predicting fraudulent activity from account balance deltas and amounts.",
        "generator": generate_credit_card_fraud_dataset
    },
    "hr_churn": {
        "name": "HR Employee Retention & Churn",
        "task_type": "classification",
        "target_col": "churn",
        "description": "Workplace dataset predicting employee departure based on satisfaction, projects, hours, and tenure.",
        "generator": generate_hr_churn_dataset
    },
    "customer_ltv": {
        "name": "Customer Lifetime Value (LTV)",
        "task_type": "regression",
        "target_col": "ltv_value",
        "description": "E-commerce customer lifetime value regression based on income, credit score, tenure, and tickets.",
        "generator": generate_customer_ltv_dataset
    }
}


def get_demo_dataset(name: str, n_rows: int = 1000, seed: int = 42) -> pd.DataFrame:
    """Retrieves a demo dataset by key."""
    if name not in DEMO_DATASETS:
        raise ValueError(f"Unknown demo dataset: {name}. Available: {list(DEMO_DATASETS.keys())}")
    return DEMO_DATASETS[name]["generator"](n_rows=n_rows, seed=seed)
