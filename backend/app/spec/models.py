from enum import Enum
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class ColumnType(str, Enum):
    ID = "id"
    INT = "int"
    FLOAT = "float"
    CATEGORY = "category"
    DATE = "date"
    DATETIME = "datetime"
    PERSON_NAME = "person_name"
    FIRST_NAME = "first_name"
    LAST_NAME = "last_name"
    EMAIL = "email"
    PHONE = "phone"
    ADDRESS = "address"
    CITY = "city"
    STATE = "state"
    ZIP_CODE = "zip_code"
    COUNTRY = "country"
    TEXT_PLACEHOLDER = "text-placeholder"
    BOOLEAN = "boolean"


class DistributionType(str, Enum):
    UNIFORM = "uniform"
    NORMAL = "normal"
    LOGNORMAL = "lognormal"
    EXPONENTIAL = "exponential"
    POISSON = "poisson"
    BINOMIAL = "binomial"
    BETA = "beta"
    GAMMA = "gamma"


class PrivacyAction(str, Enum):
    MASK = "mask"
    HASH = "hash"
    NOISE = "noise"


class DistributionSpec(BaseModel):
    dist: DistributionType = DistributionType.UNIFORM
    params: Dict[str, float] = Field(default_factory=dict)

    @model_validator(mode="before")
    @classmethod
    def normalize_spec(cls, data: Any) -> Any:
        if isinstance(data, str):
            return {"dist": data, "params": {}}
        return data


class PrivacySpec(BaseModel):
    action: PrivacyAction
    mask_char: str = "*"
    unmasked_prefix: int = 2
    unmasked_suffix: int = 2
    noise_scale: float = 0.05
    noise_distribution: str = "laplace"  # 'laplace' or 'gaussian'
    hash_algorithm: str = "sha256"
    salt: Optional[str] = None


class ColumnSpec(BaseModel):
    name: str
    type: ColumnType
    pk: bool = False
    unique: bool = False
    null_rate: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    outlier_rate: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    
    # Distribution / numeric parameters
    dist: Optional[DistributionType] = None
    params: Dict[str, Any] = Field(default_factory=dict)
    min: Optional[Union[int, float]] = None
    max: Optional[Union[int, float]] = None
    decimals: Optional[int] = 2

    # Categorical values (either dict of {value: weight} or list of values)
    values: Optional[Union[Dict[str, float], List[str]]] = None

    # Date / Datetime range: ["YYYY-MM-DD", "YYYY-MM-DD"]
    range: Optional[List[str]] = None
    date_format: Optional[str] = None

    # Relationship / Derivation
    derive_from: Optional[str] = None
    transform: Optional[str] = None  # e.g. "email_slug", "lowercase", "uppercase"
    prefix: Optional[str] = None  # for ID prefix, e.g. "CUST-"

    # Privacy configuration
    privacy: Optional[PrivacySpec] = None

    # Description/notes for LLM grounding or schema inference
    description: Optional[str] = None

    @field_validator("type", mode="before")
    @classmethod
    def parse_type(cls, v: Any) -> ColumnType:
        if isinstance(v, str):
            v_clean = v.strip().lower()
            if v_clean in ("string", "text", "description", "note", "notes", "text-placeholder", "text_placeholder"):
                return ColumnType.TEXT_PLACEHOLDER
            if v_clean in ("name", "full_name", "person_name"):
                return ColumnType.PERSON_NAME
            if v_clean in ("bool", "boolean"):
                return ColumnType.BOOLEAN
            if v_clean in ("integer", "int"):
                return ColumnType.INT
            if v_clean in ("number", "float", "double", "decimal"):
                return ColumnType.FLOAT
            if v_clean in ("enum", "categorical", "category"):
                return ColumnType.CATEGORY
            if v_clean in ("id", "uuid", "identifier"):
                return ColumnType.ID
            for member in ColumnType:
                if member.value == v_clean:
                    return member
        return v

    @field_validator("dist", mode="before")
    @classmethod
    def parse_dist(cls, v: Any) -> Optional[DistributionType]:
        if v is None:
            return None
        if isinstance(v, str):
            v_clean = v.strip().lower()
            for member in DistributionType:
                if member.value == v_clean:
                    return member
            return DistributionType.UNIFORM
        return v


class ChildCountSpec(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    dist: DistributionType = DistributionType.POISSON
    lambda_: Optional[float] = Field(default=2.0, alias="lambda")
    min: int = 1
    max: Optional[int] = None
    params: Dict[str, Any] = Field(default_factory=dict)


class RelationSpec(BaseModel):
    parent: str
    child: str
    fk: str
    parent_pk: Optional[str] = None
    cardinality: str = "1:N"  # "1:1", "1:N", "N:N"
    ratio: Optional[float] = None
    child_count: Optional[Union[ChildCountSpec, Dict[str, Any]]] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_child_count(cls, data: Any) -> Any:
        if isinstance(data, dict):
            cc = data.get("child_count")
            if isinstance(cc, dict) and not isinstance(cc, ChildCountSpec):
                data["child_count"] = ChildCountSpec(**cc)
        return data


class EdgeCasesSpec(BaseModel):
    null_rate: float = Field(default=0.0, ge=0.0, le=1.0)
    outlier_rate: float = Field(default=0.0, ge=0.0, le=1.0)
    duplicates: bool = False
    unicode_names: bool = False
    mask_emails: bool = False
    hash_secrets: bool = False


class TableSpec(BaseModel):
    name: str
    rows: int = Field(default=100, ge=1)
    columns: List[ColumnSpec]
    description: Optional[str] = None

    @field_validator("columns")
    @classmethod
    def validate_pk_exists_or_create(cls, cols: List[ColumnSpec]) -> List[ColumnSpec]:
        if not cols:
            raise ValueError("Table must contain at least one column")
        return cols

    def get_pk_column(self) -> Optional[ColumnSpec]:
        for col in self.columns:
            if col.pk:
                return col
        return None


class ColumnsQuantitySpec(BaseModel):
    exact_count: Optional[int] = None
    required: List[str] = Field(default_factory=list)


class QuantitiesSpec(BaseModel):
    rows: Dict[str, int] = Field(default_factory=dict)
    columns: Dict[str, ColumnsQuantitySpec] = Field(default_factory=dict)
    documents: Dict[str, int] = Field(default_factory=dict)


class DomainSpec(BaseModel):
    domain: str = "general"
    locale: str = "en_US"
    currency: str = "USD"
    seed: int = 42
    tables: List[TableSpec]
    relations: List[RelationSpec] = Field(default_factory=list)
    rules: List[str] = Field(default_factory=list)
    edge_cases: EdgeCasesSpec = Field(default_factory=EdgeCasesSpec)
    quantities: QuantitiesSpec = Field(default_factory=QuantitiesSpec)
    default_applied: bool = False
    default_note: Optional[str] = None
    requested_rows: Optional[int] = None

    @field_validator("tables")
    @classmethod
    def validate_table_names_unique(cls, tables: List[TableSpec]) -> List[TableSpec]:
        names = [t.name for t in tables]
        if len(names) != len(set(names)):
            raise ValueError(f"Duplicate table names found: {names}")
        return tables

    def get_table(self, name: str) -> Optional[TableSpec]:
        for t in self.tables:
            if t.name == name:
                return t
        return None
