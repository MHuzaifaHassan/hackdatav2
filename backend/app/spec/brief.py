from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


class SuccessCriterion(BaseModel):
    id: str
    description: str
    check_type: Literal[
        "column_present",
        "row_count",
        "document_count",
        "column_count",
        "rate_within",
        "fk_integrity",
        "model_auc",
        "locale_match",
        "no_impossible_combo",
        "custom_llm"
    ]
    params: Dict[str, Any] = Field(default_factory=dict)


class RequirementBrief(BaseModel):
    purpose: str = "general synthetic data generation"
    domain: str = "fintech"
    tables: List[str] = Field(default_factory=list)
    must_have_columns: Dict[str, List[str]] = Field(default_factory=dict)
    rows: Dict[str, int] = Field(default_factory=dict)
    quantities: Dict[str, Any] = Field(default_factory=dict)
    constraints: Dict[str, Any] = Field(default_factory=dict)
    target_column: Optional[str] = None
    success_criteria: List[SuccessCriterion] = Field(default_factory=list)
    confirmed_by_user: bool = False
