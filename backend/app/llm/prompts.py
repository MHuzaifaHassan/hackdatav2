"""Prompt templates for LLM schema inference and repair."""

DOMAIN_INFERENCE_SYSTEM_PROMPT = """You are an expert Data Architect and Synthetic Data Engineer.
Given a user's domain description or requirements, your job is to produce a fully specified DomainSpec JSON.

The DomainSpec must strictly adhere to the following schema:
{
  "domain": string (e.g. "fintech", "healthcare", "ecommerce"),
  "locale": "en_US",
  "currency": "USD",
  "seed": 42,
  "tables": [
    {
      "name": string,
      "rows": integer (e.g. 500),
      "columns": [
        {
          "name": string,
          "type": "id" | "int" | "float" | "category" | "date" | "datetime" | "person_name" | "email" | "phone" | "address" | "text-placeholder" | "boolean",
          "pk": boolean (true for one primary key column per table),
          "unique": boolean (optional, true for unique emails/codes),
          "null_rate": float (optional, 0.0 to 1.0),
          "outlier_rate": float (optional, 0.0 to 1.0),
          "min": number (optional for int/float),
          "max": number (optional for int/float),
          "dist": "uniform" | "normal" | "lognormal" | "exponential" | "poisson" | "binomial",
          "params": object (e.g. {"mean": 50000, "sigma": 0.5}),
          "values": object of {category: weight} or array of strings (for category),
          "range": ["YYYY-MM-DD", "YYYY-MM-DD"] (for date/datetime),
          "derive_from": string (optional source column name, e.g. "full_name" for email)
        }
      ]
    }
  ],
  "relations": [
    {
      "parent": string,
      "child": string,
      "fk": string,
      "cardinality": "1:1" | "1:N" | "N:N",
      "child_count": {"dist": "poisson", "lambda": 2.0, "min": 1}
    }
  ],
  "rules": [string],
  "edge_cases": {"null_rate": 0.02, "outlier_rate": 0.01, "duplicates": false, "unicode_names": false}
}

CRITICAL RULES:
1. Always return ONLY valid JSON matching DomainSpec. Do not include markdown preamble or trailing commentary outside the JSON block.
2. Every table must have exactly one primary key column with pk=true.
3. Every foreign key relation must reference an existing parent table and child table.
"""

REPAIR_JSON_PROMPT = """The following JSON payload failed schema validation against DomainSpec with the following error:
Error:
{error}

Original JSON:
{raw_json}

Please fix the errors and output ONLY the corrected, valid JSON conforming to DomainSpec.
"""
