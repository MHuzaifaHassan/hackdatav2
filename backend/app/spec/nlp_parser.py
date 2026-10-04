import re
from typing import Optional, Tuple, Dict, Any, List
from backend.app.spec.models import (
    ColumnSpec,
    ColumnType,
    ColumnsQuantitySpec,
    DomainSpec,
    QuantitiesSpec,
    RelationSpec,
    TableSpec,
)

WORD_NUMBERS: Dict[str, int] = {
    "zero": 0, "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
    "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
    "eleven": 11, "twelve": 12, "thirteen": 13, "fourteen": 14, "fifteen": 15,
    "sixteen": 16, "seventeen": 17, "eighteen": 18, "nineteen": 19,
    "twenty": 20, "thirty": 30, "forty": 40, "fifty": 50,
    "sixty": 60, "seventy": 70, "eighty": 80, "ninety": 90,
    "hundred": 100, "thousand": 1000,
}


def parse_english_number(text: str) -> Optional[int]:
    """Parses English number phrases like 'one hundred', 'five hundred', 'ten' into integers."""
    tokens = re.findall(r"\b[a-z]+\b", text.lower())
    total = 0
    current = 0
    found = False
    for word in tokens:
        if word in WORD_NUMBERS:
            found = True
            val = WORD_NUMBERS[word]
            if val == 100:
                current = (current if current > 0 else 1) * 100
            elif val == 1000:
                current = (current if current > 0 else 1) * 1000
                total += current
                current = 0
            else:
                current += val
        elif found:
            break
    total += current
    return total if found and total > 0 else None


def extract_locale_and_currency(query: str) -> Tuple[str, str, str, bool, Optional[str]]:
    """
    Extracts locale, currency, and nationality from user query.
    Returns: (locale, currency, nationality, default_applied, default_note)
    """
    q_lower = query.lower() if query else ""
    locale, currency, nationality = "en_US", "USD", "Neutral (US)"
    default_applied = True
    default_note = "No locale specified, using default: en_US (USD)"

    pakistani_keywords = [
        "pakistan", "pakistani", "urdu", "pkr", "en_pk", "ur_pk", "karachi", "lahore",
        "islamabad", "rawalpindi", "faisalabad", "peshawar", "quetta", "multan", "sialkot"
    ]
    german_keywords = ["german", "germany", "deutschland", "de_de", "berlin", "munich", "frankfurt", "cologne", "hamburg"]
    british_keywords = ["british", "britain", "uk", "england", "en_gb", "london", "manchester", "birmingham", "edinburgh"]
    american_keywords = ["american", "usa", "us", "en_us", "new york", "california", "texas"]

    if any(w in q_lower for w in pakistani_keywords):
        locale, currency, nationality = "en_PK", "PKR", "Pakistani"
        default_applied = False
        default_note = "Locale parsed: Pakistani (en_PK, PKR, authentic phone & CNIC)"
    elif any(w in q_lower for w in german_keywords):
        locale, currency, nationality = "de_DE", "EUR", "German"
        default_applied = False
        default_note = "Locale parsed: German (de_DE, EUR)"
    elif any(w in q_lower for w in british_keywords):
        locale, currency, nationality = "en_GB", "GBP", "British"
        default_applied = False
        default_note = "Locale parsed: British (en_GB, GBP)"
    elif any(w in q_lower for w in american_keywords):
        locale, currency, nationality = "en_US", "USD", "American"
        default_applied = False
        default_note = "Locale parsed: American (en_US, USD)"

    # Currency overrides (e.g., "in PKR", "currency USD", "EUR", "in GBP", "rupees", "dollars")
    if re.search(r"\b(pkr|rupees?)\b", q_lower):
        currency = "PKR"
    elif re.search(r"\b(eur|euros?)\b", q_lower):
        currency = "EUR"
    elif re.search(r"\b(gbp|pounds?)\b", q_lower):
        currency = "GBP"
    elif re.search(r"\b(usd|dollars?)\b", q_lower):
        currency = "USD"

    return locale, currency, nationality, default_applied, default_note


def extract_query_size(query: str) -> Tuple[int, bool, Optional[str]]:
    """
    Extracts the general target row count from user query.
    Returns: (row_count, default_applied, default_note)
    """
    if not query:
        return 100, True, "No size specified, using default: 100 rows."

    # 1. Match digits
    digit_match = re.search(r"\b(\d+)\b", query)
    if digit_match:
        val = int(digit_match.group(1))
        if val > 0:
            return val, False, None

    # 2. Match English number words
    word_val = parse_english_number(query)
    if word_val and word_val > 0:
        return word_val, False, None

    # 3. Default to 100
    return 100, True, "No size specified, using default: 100 rows."


def extract_entity_counts(query: str) -> Dict[str, int]:
    """
    Extracts entity-specific counts like:
    - '16 invoices' -> {'invoices': 16}
    - '200 customers and 5 statements each' -> {'customers': 200, 'statements': 1000}
    - '50 employees' -> {'employees': 50}
    """
    counts: Dict[str, int] = {}
    if not query:
        return counts

    q_lower = query.lower()

    # Pattern for 'X entity and Y sub_entity each'
    each_match = re.search(r"(\d+)\s+([a-z_]+)\s+and\s+(\d+)\s+([a-z_]+)\s+each", q_lower)
    if each_match:
        c1 = int(each_match.group(1))
        e1 = each_match.group(2).rstrip("s") + "s"
        c2 = int(each_match.group(3))
        e2 = each_match.group(4).rstrip("s") + "s"
        counts[e1] = c1
        counts[e2] = c1 * c2
        return counts

    # Pattern for '<digits> <entity>'
    matches = re.finditer(r"\b(\d+)\s+([a-z_]+)\b", q_lower)
    for m in matches:
        num = int(m.group(1))
        entity = m.group(2).rstrip("s") + "s"
        if entity not in ("rows", "records", "items", "entries"):
            counts[entity] = num

    # Also check English words before entity, e.g. "sixteen invoices"
    tokens = q_lower.split()
    for i in range(len(tokens) - 1):
        w = tokens[i]
        nxt = tokens[i+1].rstrip("s") + "s"
        if w in WORD_NUMBERS and nxt not in ("rows", "records", "items", "entries"):
            val = WORD_NUMBERS[w]
            if val > 0 and nxt not in counts:
                counts[nxt] = val

    return counts


def extract_constraints(query: str) -> Dict[str, Any]:
    """Extracts numeric ranges, date bounds, or distribution hints from query."""
    constraints: Dict[str, Any] = {}
    if not query:
        return constraints

    q_lower = query.lower()

    # Range: between X and Y
    range_match = re.search(r"between\s+([\d,]+(?:\.\d+)?)\s+and\s+([\d,]+(?:\.\d+)?)", q_lower)
    if range_match:
        try:
            low = float(range_match.group(1).replace(",", ""))
            high = float(range_match.group(2).replace(",", ""))
            constraints["value_range"] = {"min": low, "max": high}
        except ValueError:
            pass

    # Skewed low / high
    if "skewed low" in q_lower:
        constraints["distribution"] = "skewed_low"
    elif "skewed high" in q_lower:
        constraints["distribution"] = "skewed_high"

    # Dates
    date_matches = re.findall(r"\b(\d{4}-\d{2}-\d{2})\b", query)
    if len(date_matches) >= 2:
        constraints["date_range"] = [date_matches[0], date_matches[1]]

    return constraints


def parse_column_prompt(prompt: str) -> Dict[str, Any]:
    """
    Parses plain-English column requirements into structured column attributes.
    Example: 'salary in PKR, between 40,000 and 300,000, skewed low'
    -> name='salary', type='float', min=40000.0, max=300000.0, dist='beta', params={'a': 2.0, 'b': 5.0}
    """
    p_lower = prompt.lower().strip()
    result: Dict[str, Any] = {
        "name": "",
        "type": "float",
        "min": None,
        "max": None,
        "dist": "uniform",
        "params": {},
        "values": None,
        "unique": False,
        "nullable": False,
        "null_rate": 0.0,
        "currency": None,
    }

    # Extract name (first word or before 'in'/'between'/'type'/'is')
    first_token = re.split(r"[\s,;:]+", prompt.strip())[0].lower()
    clean_name = re.sub(r"[^a-zA-Z0-9_]", "", first_token)
    result["name"] = clean_name or "new_column"

    # Type detection
    if any(k in p_lower for k in ["email", "e-mail"]):
        result["type"] = "email"
        result["unique"] = True
    elif any(k in p_lower for k in ["person_name", "full name", "person name", "first name", "last name"]):
        result["type"] = "person_name"
    elif any(k in p_lower for k in ["phone", "mobile", "cell"]):
        result["type"] = "phone"
    elif any(k in p_lower for k in ["date", "timestamp", "created_at", "hired_at"]):
        result["type"] = "date"
    elif any(k in p_lower for k in ["city"]):
        result["type"] = "city"
    elif any(k in p_lower for k in ["address", "street"]):
        result["type"] = "address"
    elif any(k in p_lower for k in ["id", "code", "sku", "identifier"]):
        result["type"] = "id"
    elif any(k in p_lower for k in ["boolean", "bool", "flag", "is_"]):
        result["type"] = "boolean"
    elif any(k in p_lower for k in ["disease", "diagnosis", "condition", "icd10", "icd_10", "illness", "disorder", "symptom"]):
        result["type"] = "category"
        from backend.app.engines.text_fill import DOMAIN_VOCABULARIES
        icd_list = DOMAIN_VOCABULARIES.get("healthcare", {}).get("icd10", [])
        if icd_list:
            result["values"] = {d: round(1.0 / len(icd_list), 4) for d in icd_list}
    elif any(k in p_lower for k in ["merchant", "store", "vendor", "retailer"]):
        result["type"] = "category"
        from backend.app.engines.text_fill import DOMAIN_VOCABULARIES
        m_list = DOMAIN_VOCABULARIES.get("fintech", {}).get("merchants", [])
        if m_list:
            result["values"] = {m: round(1.0 / len(m_list), 4) for m in m_list}
    elif any(k in p_lower for k in ["category", "enum", "status", "segment", "type of", "options", "values"]):
        result["type"] = "category"
    elif any(k in p_lower for k in ["integer", "int", "count", "quantity", "age", "years"]):
        result["type"] = "int"
    elif any(k in p_lower for k in ["float", "salary", "amount", "price", "balance", "cost", "revenue", "income", "rate", "fee"]):
        result["type"] = "float"

    # Currency extraction
    if "pkr" in p_lower or "rupees" in p_lower:
        result["currency"] = "PKR"
    elif "usd" in p_lower or "dollar" in p_lower:
        result["currency"] = "USD"
    elif "eur" in p_lower or "euro" in p_lower:
        result["currency"] = "EUR"
    elif "gbp" in p_lower or "pound" in p_lower:
        result["currency"] = "GBP"

    # Numeric bounds: "between X and Y", "min X max Y", "from X to Y"
    between_match = re.search(r"between\s+([\d,]+(?:\.\d+)?)\s+and\s+([\d,]+(?:\.\d+)?)", p_lower)
    if between_match:
        try:
            result["min"] = float(between_match.group(1).replace(",", ""))
            result["max"] = float(between_match.group(2).replace(",", ""))
        except ValueError:
            pass
    else:
        min_match = re.search(r"(?:min|minimum|from)\s+([\d,]+(?:\.\d+)?)", p_lower)
        max_match = re.search(r"(?:max|maximum|to)\s+([\d,]+(?:\.\d+)?)", p_lower)
        if min_match:
            try:
                result["min"] = float(min_match.group(1).replace(",", ""))
            except ValueError:
                pass
        if max_match:
            try:
                result["max"] = float(max_match.group(1).replace(",", ""))
            except ValueError:
                pass

    # Distribution detection
    if "skewed low" in p_lower or "skew low" in p_lower:
        result["dist"] = "beta"
        result["params"] = {"a": 2.0, "b": 5.0}
    elif "skewed high" in p_lower or "skew high" in p_lower:
        result["dist"] = "beta"
        result["params"] = {"a": 5.0, "b": 2.0}
    elif "lognormal" in p_lower or "log-normal" in p_lower:
        result["dist"] = "lognormal"
        result["params"] = {"mean": 10.5, "sigma": 0.5}
    elif "normal" in p_lower or "gaussian" in p_lower:
        result["dist"] = "normal"
        if result["min"] is not None and result["max"] is not None:
            mean = (result["min"] + result["max"]) / 2.0
            std = (result["max"] - result["min"]) / 6.0
            result["params"] = {"mean": round(mean, 2), "std": round(std, 2)}
    elif "uniform" in p_lower:
        result["dist"] = "uniform"

    # Categories list: "options: A, B, C" or "values: X, Y"
    cat_match = re.search(r"(?:options|values|categories|choices):\s*([a-zA-Z0-9_\-,\s]+)", prompt)
    if cat_match:
        items = [x.strip() for x in cat_match.group(1).split(",") if x.strip()]
        if items:
            result["type"] = "category"
            result["values"] = {it: round(1.0 / len(items), 3) for it in items}

    # Nullable / Unique
    if "nullable" in p_lower or "can be null" in p_lower or "nulls" in p_lower:
        result["nullable"] = True
        result["null_rate"] = 0.05
    if "unique" in p_lower or "distinct" in p_lower:
        result["unique"] = True

    return result



def extract_quantities_contract(query: str, spec: Optional[DomainSpec] = None) -> QuantitiesSpec:
    """
    Parses quantities block (rows, columns, documents) from user query as required by Plan v2 contract.
    """
    quantities = QuantitiesSpec()
    if not query:
        return quantities
    q_lower = query.lower()

    # 1. Documents: e.g. "50 bank statements", "200 invoices", "10 lab reports", "5 discharge summaries"
    doc_matches = re.finditer(r"\b(\d+)\s+([a-z_]+)\b", q_lower)
    for m in doc_matches:
        num = int(m.group(1))
        word = m.group(2).rstrip("s")
        if word in ("statement", "bank_statement"):
            quantities.documents["bank_statement"] = num
        elif word in ("invoice", "bill"):
            quantities.documents["invoice"] = num
        elif word in ("lab_report", "lab", "test"):
            quantities.documents["lab_report"] = num
        elif word in ("discharge_summary", "discharge"):
            quantities.documents["discharge_summary"] = num
        elif word in ("claim", "insurance_claim"):
            quantities.documents["insurance_claim"] = num

    # 2. Rows: e.g. "5000 customers", "50000 transactions", "500 employees"
    entity_counts = extract_entity_counts(query)
    for ent, cnt in entity_counts.items():
        if ent not in ("columns", "statements", "invoices", "bills", "documents", "reports"):
            quantities.rows[ent] = cnt

    # General row count if specified: e.g. "5000 rows"
    row_match = re.search(r"\b(\d+)\s+(?:rows?|records?|entries)\b", q_lower)
    if row_match:
        target_cnt = int(row_match.group(1))
        if spec and spec.tables:
            quantities.rows[spec.tables[0].name] = target_cnt
        else:
            quantities.rows["default"] = target_cnt

    # 3. Columns: e.g. "12 columns", "exactly 12 columns", "columns: amount, merchant, timestamp, city, is_fraud"
    col_cnt_match = re.search(r"\b(?:exactly\s+)?(\d+)\s+columns?\b", q_lower)
    exact_cols = int(col_cnt_match.group(1)) if col_cnt_match else None

    # Required column list:
    req_cols: List[str] = []
    req_match = re.search(r"(?:columns?|with|required|fields):\s*([^.]+)", query, re.IGNORECASE)
    if req_match:
        raw_string = req_match.group(1).replace(" and ", ",")
        raw_list = raw_string.split(",")
        for item in raw_list:
            clean = item.strip()
            if clean and clean.lower() not in ("and", "or", "with", "columns", "rows", "exactly"):
                req_cols.append(clean)

    target_table_name = None
    explicit_table = re.search(r"\btable(?:\s+name)?(?:\s*[:=]|\s+is)?\s+([a-zA-Z0-9_]+)", q_lower)
    if explicit_table:
        cand = explicit_table.group(1).strip()
        if cand == "name":
            after_match = re.search(r"\btable\s+name(?:\s*[:=]|\s+is)?\s+([a-zA-Z0-9_]+)", q_lower)
            if after_match:
                cand = after_match.group(1).strip()
        if cand and cand not in ("with", "has", "of", "for", "name"):
            target_table_name = cand
    elif spec and spec.tables:
        for t in spec.tables:
            t_low = t.name.lower()
            if t_low in q_lower or t_low.rstrip("s") in q_lower:
                target_table_name = t.name
                break
        if not target_table_name:
            target_table_name = spec.tables[0].name
    else:
        target_table_name = "default"

    if exact_cols is not None or req_cols:
        quantities.columns[target_table_name] = ColumnsQuantitySpec(
            exact_count=exact_cols,
            required=req_cols
        )

    return quantities


def parse_query_request(query: str, base_spec: Optional[DomainSpec] = None) -> Dict[str, Any]:
    """
    Comprehensive query parser for Feature 1 & Plan v2:
    Extracts domain, locale, currency, entity row counts, columns, quantities contract, and constraints.
    Returns a structured summary dictionary that the UI can display in a 'Parsed request' modal.
    """
    from backend.app.domains.packs import get_domain_pack

    q_lower = query.lower() if query else ""

    # 1. Determine Domain
    if any(w in q_lower for w in ["invoice", "invoices", "statement", "statements", "bill", "billing", "billings"]):
        domain_name = "invoicing"
    elif any(w in q_lower for w in ["patient", "hospital", "health", "clinic", "doctor"]):
        domain_name = "healthcare"
    elif any(w in q_lower for w in ["customer", "product", "cart", "shop", "ecommerce", "order"]):
        domain_name = "ecommerce"
    elif any(w in q_lower for w in ["employee", "hr", "payroll", "salary", "hiring", "department", "attendance"]):
        domain_name = "hr"
    elif any(w in q_lower for w in ["shipment", "warehouse", "logistics", "freight", "delivery"]):
        domain_name = "logistics"
    else:
        domain_name = base_spec.domain if base_spec else "fintech"

    # 2. Extract Locale & Currency
    locale, currency, nationality, locale_default, locale_note = extract_locale_and_currency(query)

    # 3. Load or build domain spec
    spec = base_spec.model_copy(deep=True) if base_spec and base_spec.domain == domain_name else get_domain_pack(domain_name)
    spec.locale = locale
    spec.currency = currency

    # 4. Extract Entity Counts & General Count
    entity_counts = extract_entity_counts(query)
    constraints = extract_constraints(query)

    # 5. Scale spec based on entity counts & quantities contract
    scaled_spec = scale_domain_spec_to_query(spec, query, entity_counts=entity_counts)

    row_counts = {t.name: t.rows for t in scaled_spec.tables}
    total_rows = sum(row_counts.values())

    return {
        "raw_query": query,
        "domain": domain_name,
        "locale": locale,
        "currency": currency,
        "nationality": nationality,
        "locale_default_applied": locale_default,
        "locale_note": locale_note,
        "default_applied": scaled_spec.default_applied,
        "default_note": scaled_spec.default_note,
        "requested_rows": scaled_spec.requested_rows,
        "quantities": scaled_spec.quantities.model_dump(),
        "total_rows": total_rows,
        "row_counts": row_counts,
        "constraints": constraints,
        "spec": scaled_spec.model_dump(),
        "tables": [
            {
                "name": t.name,
                "rows": t.rows,
                "columns": [{"name": c.name, "type": c.type.value, "pk": c.pk, "unique": c.unique} for c in t.columns]
            }
            for t in scaled_spec.tables
        ],
        "relations": [
            {"parent": r.parent, "child": r.child, "fk": r.fk, "cardinality": r.cardinality, "ratio": r.ratio}
            for r in scaled_spec.relations
        ]
    }


def scale_domain_spec_to_query(
    domain_spec: DomainSpec,
    query: str,
    entity_counts: Optional[Dict[str, int]] = None
) -> DomainSpec:
    """
    Identifies primary and related tables, applying exact entity counts, quantities contracts, or general scaled ratios.
    """
    target_rows, default_applied, default_note = extract_query_size(query)
    if entity_counts is None:
        entity_counts = extract_entity_counts(query)

    spec = domain_spec.model_copy(deep=True)
    locale, currency, nationality, loc_default, loc_note = extract_locale_and_currency(query)
    if not loc_default:
        spec.locale = locale
        spec.currency = currency

    spec.default_applied = default_applied
    spec.default_note = default_note
    spec.requested_rows = target_rows

    if not spec.tables:
        return spec

    # Parse and attach quantities contract
    quantities = extract_quantities_contract(query, spec=spec)
    spec.quantities = quantities

    # Check if any explicit entity count matches a table
    matched_entity_tables: Dict[str, int] = {}
    for t in spec.tables:
        t_name = t.name.lower()
        if t_name in entity_counts:
            matched_entity_tables[t.name] = entity_counts[t_name]
        elif t_name.rstrip("s") in entity_counts:
            matched_entity_tables[t.name] = entity_counts[t_name.rstrip("s")]
        elif (t_name + "s") in entity_counts:
            matched_entity_tables[t.name] = entity_counts[t_name + "s"]

    # Also apply from quantities.rows
    for t_name, count in quantities.rows.items():
        if spec.get_table(t_name):
            matched_entity_tables[t_name] = count
        elif spec.get_table(t_name.rstrip("s")):
            matched_entity_tables[t_name.rstrip("s")] = count
        elif spec.get_table(t_name + "s"):
            matched_entity_tables[t_name + "s"] = count

    # If specific entity was requested, honor it
    if matched_entity_tables:
        for t_name, count in matched_entity_tables.items():
            t = spec.get_table(t_name)
            if t:
                t.rows = count
                spec.default_applied = False
                spec.default_note = None

        # Derive other tables connected to the matched entity tables
        for rel in spec.relations:
            if rel.parent in matched_entity_tables and rel.child not in matched_entity_tables:
                parent_count = matched_entity_tables[rel.parent]
                child_t = spec.get_table(rel.child)
                if child_t:
                    ratio = rel.ratio or 1.0
                    child_t.rows = max(1, int(round(parent_count * ratio)))
            elif rel.child in matched_entity_tables and rel.parent not in matched_entity_tables:
                child_count = matched_entity_tables[rel.child]
                parent_t = spec.get_table(rel.parent)
                if parent_t:
                    if parent_t.name in ("departments", "categories"):
                        parent_t.rows = min(10, parent_t.rows or 10)
                    else:
                        ratio = rel.ratio or 1.0
                        parent_t.rows = max(1, int(round(child_count / ratio))) if ratio > 0 else child_count

        for rel in spec.relations:
            parent_t = spec.get_table(rel.parent)
            child_t = spec.get_table(rel.child)
            if parent_t and child_t and child_t.name not in matched_entity_tables:
                ratio = rel.ratio or 1.0
                child_t.rows = max(1, int(round(parent_t.rows * ratio)))

        return _enforce_column_quantities(spec, quantities, query)

    # Default scaling when no specific entity count was matched:
    child_table_names = {rel.child for rel in spec.relations}
    parent_table_candidates = [t for t in spec.tables if t.name not in child_table_names]

    core_names = ["employees", "customers", "users", "patients", "clients", "invoices"]
    primary_table = None
    for name in core_names:
        for t in spec.tables:
            if t.name.lower() == name:
                primary_table = t
                break
        if primary_table:
            break

    if not primary_table and parent_table_candidates:
        primary_table = parent_table_candidates[0]
    elif not primary_table:
        primary_table = spec.tables[0]

    # Set primary table row count exactly
    primary_table.rows = target_rows

    # Scale lookup tables
    for t in spec.tables:
        if t.name == primary_table.name:
            continue
        if t.name in ("departments", "categories"):
            t.rows = min(10, max(3, int(round(target_rows * 0.1))))

    # Scale child tables based on relation ratios
    for rel in spec.relations:
        child_t = spec.get_table(rel.child)
        if not child_t or child_t.name == primary_table.name:
            continue
        parent_t = spec.get_table(rel.parent)
        parent_rows = parent_t.rows if parent_t else target_rows

        if rel.ratio is not None and rel.ratio > 0:
            child_t.rows = max(1, int(round(parent_rows * rel.ratio)))
        elif rel.cardinality == "1:1":
            child_t.rows = parent_rows
        elif rel.child_count and isinstance(rel.child_count, dict):
            min_c = rel.child_count.get("min", 1)
            max_c = rel.child_count.get("max", 3)
            avg_c = (min_c + max_c) / 2.0
            child_t.rows = max(1, int(round(parent_rows * avg_c)))
        elif rel.child_count and hasattr(rel.child_count, "lambda_") and rel.child_count.lambda_:
            child_t.rows = max(1, int(round(parent_rows * rel.child_count.lambda_)))
        elif rel.child_count and hasattr(rel.child_count, "min") and hasattr(rel.child_count, "max") and rel.child_count.max:
            avg_c = (rel.child_count.min + rel.child_count.max) / 2.0
            child_t.rows = max(1, int(round(parent_rows * avg_c)))
        else:
            child_t.rows = max(1, int(round(parent_rows * 2.0)))

    return _enforce_column_quantities(spec, quantities)


def _enforce_column_quantities(spec: DomainSpec, quantities: QuantitiesSpec, query: str = "") -> DomainSpec:
    """Enforces exact column count and required column presence with exact names."""
    if not quantities or not quantities.columns:
        return spec

    for t_name, col_rule in quantities.columns.items():
        t = spec.get_table(t_name)
        if not t and (t_name == "default" or len(spec.tables) == 1):
            t = spec.tables[0]
            # Rename to match explicit user request if there's only one table
            if t_name != "default":
                t.name = t_name
        if not t:
            for cand in spec.tables:
                if cand.name.lower() in t_name.lower() or t_name.lower() in cand.name.lower():
                    t = cand
                    t.name = t_name  # override with exact name
                    break
        if not t and spec.tables:
            t = spec.tables[0]
            t.name = t_name

        if not t:
            continue

        existing_cols = {c.name.lower(): c for c in t.columns}
        new_columns = []

        # 1. Enforce required columns exist with exact requested names, in order
        for req in col_rule.required:
            inferred = parse_column_prompt(req)
            col_name = inferred["name"].lower()
            if col_name in existing_cols:
                # Keep existing but update properties if inferred
                c = existing_cols[col_name]
                if inferred.get("unique"): c.unique = True
                if inferred.get("type") != "float": c.type = ColumnType(inferred["type"])
                if inferred.get("values"): c.values = inferred["values"]
                new_columns.append(c)
            else:
                new_c = ColumnSpec(
                    name=col_name,
                    type=ColumnType(inferred["type"]),
                    min=inferred.get("min"),
                    max=inferred.get("max"),
                    unique=inferred.get("unique", False),
                    nullable=inferred.get("nullable", False),
                    values=inferred.get("values"),
                )
                if inferred.get("dist") and inferred["dist"] != "uniform":
                    from backend.app.spec.models import DistributionType
                    try:
                        new_c.dist = DistributionType(inferred["dist"])
                        new_c.params = inferred.get("params", {})
                    except ValueError:
                        pass
                new_columns.append(new_c)

        # 2. Fill remaining or trim if exact_count is specified
        if col_rule.exact_count is not None:
            target_count = col_rule.exact_count
            
            # If we need more columns, add fillers
            domain_fillers = [
                ("status", ColumnType.CATEGORY, {"Active": 0.5, "Pending": 0.5}),
                ("description", ColumnType.TEXT_PLACEHOLDER, None),
                ("category", ColumnType.CATEGORY, {"Standard": 0.5, "Premium": 0.5}),
                ("created_at", ColumnType.DATETIME, None),
            ]
            f_idx = 0
            while len(new_columns) < target_count:
                fname, ftype, fvals = domain_fillers[f_idx % len(domain_fillers)]
                cname = fname if not any(c.name.lower() == fname for c in new_columns) else f"{fname}_{f_idx + 1}"
                if not any(c.name.lower() == cname for c in new_columns):
                    new_columns.append(ColumnSpec(name=cname, type=ftype, values=fvals))
                f_idx += 1
                
            # If we have too many, trim down to exact_count (keep the ones we just added from requirements)
            t.columns = new_columns[:target_count]
            
            # If a single table was explicitly requested with exact columns, drop other tables
            is_single_table_prompt = (
                (query and re.search(rf"\btable(?:\s+name)?(?:\s*[:=]|\s+is)?\s+{re.escape(t.name)}\b", query, re.IGNORECASE))
                or (len(quantities.columns) == 1 and (col_rule.exact_count is not None or "tabular" in query.lower()))
            )
            if is_single_table_prompt:
                spec.tables = [t]
                spec.relations = []
        else:
            # If no exact count, just prepend required columns and keep existing
            for c in t.columns:
                if not any(nc.name.lower() == c.name.lower() for nc in new_columns):
                    new_columns.append(c)
            t.columns = new_columns

    return spec

