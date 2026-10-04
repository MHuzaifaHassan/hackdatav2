import math
import random
from typing import Any, Dict, List, Optional
import pandas as pd

from backend.app.domains.packs import get_domain_pack
from backend.app.engines.relational import RelationalEngine
from backend.app.spec.models import DomainSpec


class DocumentEngine:
    """Generates realistic, mathematically reconciled documents grounded on relational records."""

    @classmethod
    def generate_documents(
        cls,
        doc_type: str,
        domain_spec: Optional[DomainSpec] = None,
        count: int = 5,
        seed: int = 42
    ) -> List[Dict[str, Any]]:
        """Generates a list of structured documents of the requested type."""
        clean_type = doc_type.lower().strip()
        rng = random.Random(seed)

        if "bank" in clean_type or "statement" in clean_type:
            return cls._generate_bank_statements(domain_spec or get_domain_pack("fintech"), count, rng)
        elif "invoice" in clean_type or "bill" in clean_type:
            return cls._generate_invoices(domain_spec or get_domain_pack("ecommerce"), count, rng)
        elif "lab" in clean_type or "test" in clean_type or "blood" in clean_type:
            return cls._generate_lab_reports(domain_spec or get_domain_pack("healthcare"), count, rng)
        elif "discharge" in clean_type or "hospital" in clean_type:
            return cls._generate_discharge_summaries(domain_spec or get_domain_pack("healthcare"), count, rng)
        elif "claim" in clean_type or "insurance" in clean_type:
            return cls._generate_insurance_claims(domain_spec or get_domain_pack("healthcare"), count, rng)
        else:
            # Default to invoice
            return cls._generate_invoices(domain_spec or get_domain_pack("ecommerce"), count, rng)

    @classmethod
    def _generate_bank_statements(cls, spec: DomainSpec, count: int, rng: random.Random) -> List[Dict[str, Any]]:
        engine = RelationalEngine()
        data = engine.generate_relational(spec, seed=spec.seed)
        customers = data.get("customers", pd.DataFrame()).to_dict(orient="records")
        accounts = data.get("accounts", pd.DataFrame()).to_dict(orient="records")
        transactions = data.get("transactions", pd.DataFrame()).to_dict(orient="records")

        docs = []
        if not accounts:
            accounts = [{"account_id": f"ACC-{1000 + j}", "customer_id": f"CUST-{1000 + j}", "account_type": "Checking Account"} for j in range(count)]
        if not customers:
            customers = [{"customer_id": acc.get("customer_id", f"CUST-{1000 + j}"), "full_name": f"Customer {j+1}", "email": f"user{j+1}@example.com", "phone": "+1-555-0100"} for j, acc in enumerate(accounts)]

        for i in range(count):
            acc = accounts[i % len(accounts)]
            cust = next((c for c in customers if c.get("customer_id") == acc.get("customer_id")), customers[i % len(customers)])
            acc_txns = [t for t in transactions if t.get("account_id") == acc.get("account_id")]
            if not acc_txns and transactions:
                acc_txns = transactions[:5]

            # Reconcile running balance
            opening_balance = round(rng.uniform(1500.0, 8500.0), 2)
            current_bal = opening_balance
            reconciled_txns = []
            total_credits = 0.0
            total_debits = 0.0

            for t in acc_txns[:10]:
                raw_amt = t.get("amount")
                if raw_amt is None or (isinstance(raw_amt, float) and math.isnan(raw_amt)):
                    amt = round(rng.uniform(15.0, 250.0), 2)
                else:
                    try:
                        amt = float(raw_amt)
                        if math.isnan(amt) or amt <= 0:
                            amt = round(rng.uniform(15.0, 250.0), 2)
                    except (ValueError, TypeError):
                        amt = round(rng.uniform(15.0, 250.0), 2)
                amt = round(amt, 2)
                ttype = str(t.get("txn_type", "debit")).lower()
                is_credit = ttype == "credit" or "deposit" in str(t.get("description", "")).lower()

                if is_credit:
                    current_bal += amt
                    total_credits += amt
                else:
                    current_bal -= amt
                    total_debits += amt

                reconciled_txns.append({
                    "transaction_id": t.get("transaction_id", f"TXN-{rng.randint(1000, 9999)}"),
                    "date": str(t.get("transaction_date", "2025-08-15"))[:10],
                    "description": t.get("description", "Merchant Purchase"),
                    "type": "Credit" if is_credit else "Debit",
                    "amount": round(amt, 2),
                    "running_balance": round(current_bal, 2)
                })

            docs.append({
                "doc_id": f"STMT-2025-{1000 + i}",
                "doc_type": "Bank Account Statement",
                "statement_period": "August 01, 2025 – August 31, 2025",
                "institution": "Apex Global Financial Bank NA",
                "customer": {
                    "id": cust.get("customer_id", "CUST-00001"),
                    "name": cust.get("full_name", "Alexander Wright"),
                    "email": cust.get("email", "user@example.com"),
                    "phone": cust.get("phone", "+1-415-555-0142"),
                    "address": "452 Financial District Way, San Francisco CA 94104"
                },
                "account": {
                    "number": acc.get("account_id", "ACC-00001"),
                    "type": acc.get("account_type", "Checking Account"),
                    "currency": spec.currency or "USD",
                    "opening_balance": opening_balance,
                    "total_credits": round(total_credits, 2),
                    "total_debits": round(total_debits, 2),
                    "closing_balance": round(current_bal, 2),
                    "reconciled": True
                },
                "transactions": reconciled_txns
            })
        return docs

    @classmethod
    def _generate_invoices(cls, spec: DomainSpec, count: int, rng: random.Random) -> List[Dict[str, Any]]:
        docs = []
        item_catalog = [
            ("Enterprise Cloud Platform Annual License", 450.0),
            ("High-Throughput Webhook Relay (100k requests)", 75.0),
            ("Dedicated API Gateway Load Balancer", 180.0),
            ("Security & Compliance Audit Module", 220.0),
            ("24/7 Priority Engineering SLA Support", 150.0),
            ("Multi-Region Edge Compute Acceleration", 95.0),
            ("Automated Continuous Backup Storage (1TB)", 40.0)
        ]

        for i in range(count):
            num_items = rng.randint(2, 4)
            chosen_items = rng.sample(item_catalog, num_items)

            items_list = []
            subtotal = 0.0
            for title, price in chosen_items:
                qty = rng.randint(1, 3)
                line_total = round(qty * price, 2)
                subtotal += line_total
                items_list.append({
                    "description": title,
                    "quantity": qty,
                    "unit_price": price,
                    "amount": line_total
                })

            tax_rate = 0.0825
            tax_amount = round(subtotal * tax_rate, 2)
            grand_total = round(subtotal + tax_amount, 2)

            docs.append({
                "doc_id": f"INV-2025-{8400 + i}",
                "doc_type": "Commercial Tax Invoice",
                "invoice_date": f"2025-08-{(i % 25) + 1:02d}",
                "due_date": "2025-09-30",
                "issuer": {
                    "company": "Synthetix Cloud Software Inc.",
                    "address": "100 Innovation Blvd, Suite 400, Austin TX 78701",
                    "tax_id": "US-EIN-82947194",
                    "email": "billing@synthetix.cloud"
                },
                "client": {
                    "id": f"CUST-{1000 + i}",
                    "name": ["Acme Global Logistics", "Quantum BioLabs Inc.", "Starlight Commerce Group", "Apex Financial Tech"][i % 4],
                    "email": f"accounts.payable@{['acme.corp', 'quantumbio.io', 'starlight.com', 'apextech.net'][i % 4]}",
                    "address": "742 Evergreen Terrace, Springfield OR 97477"
                },
                "items": items_list,
                "financials": {
                    "currency": spec.currency or "USD",
                    "subtotal": round(subtotal, 2),
                    "tax_rate_percent": 8.25,
                    "tax_amount": tax_amount,
                    "grand_total": grand_total,
                    "payment_status": "PAID" if i % 2 == 0 else "DUE IN 30 DAYS"
                }
            })
        return docs

    @classmethod
    def _generate_lab_reports(cls, spec: DomainSpec, count: int, rng: random.Random) -> List[Dict[str, Any]]:
        docs = []
        test_panels = [
            ("Complete Blood Count (CBC)", [
                {"name": "White Blood Cell (WBC)", "val": 6.8, "unit": "K/uL", "range": "4.5 - 11.0", "status": "Normal"},
                {"name": "Red Blood Cell (RBC)", "val": 4.9, "unit": "M/uL", "range": "4.3 - 5.9", "status": "Normal"},
                {"name": "Hemoglobin (Hgb)", "val": 15.2, "unit": "g/dL", "range": "13.5 - 17.5", "status": "Normal"},
                {"name": "Platelets", "val": 245, "unit": "K/uL", "range": "150 - 450", "status": "Normal"},
            ]),
            ("Comprehensive Metabolic Panel (CMP)", [
                {"name": "Fasting Glucose", "val": 94, "unit": "mg/dL", "range": "70 - 99", "status": "Normal"},
                {"name": "Blood Urea Nitrogen (BUN)", "val": 16, "unit": "mg/dL", "range": "7 - 20", "status": "Normal"},
                {"name": "Serum Creatinine", "val": 0.95, "unit": "mg/dL", "range": "0.70 - 1.30", "status": "Normal"},
                {"name": "Total Cholesterol", "val": 182, "unit": "mg/dL", "range": "< 200", "status": "Desirable"},
            ])
        ]

        for i in range(count):
            panel_name, test_results = test_panels[i % len(test_panels)]
            docs.append({
                "doc_id": f"LAB-2025-{9100 + i}",
                "doc_type": "Clinical Pathology Laboratory Report",
                "collected_date": f"2025-08-{(i % 25) + 1:02d}",
                "reported_date": f"2025-08-{(i % 25) + 2:02d}",
                "laboratory": {
                    "name": "Metropolitan Diagnostic Medical Laboratories",
                    "clia_id": "CLIA-05D9284712",
                    "director": "Dr. Sarah Jenkins, MD, PhD, FCAP"
                },
                "patient": {
                    "id": f"PAT-{String_zfill(i + 1)}",
                    "name": ["James Henderson", "Emily Watson", "Robert Chang", "Maria Rodriguez", "Marcus Johnson"][i % 5],
                    "gender": "Male" if i % 2 == 0 else "Female",
                    "dob": f"19{65 + (i * 3) % 30}-04-12",
                    "ordering_physician": "Dr. David Miller, MD (Internal Medicine)"
                },
                "panel_name": panel_name,
                "tests": test_results,
                "clinical_impression": "All analyzed parameters within standard physiological reference ranges. No critical alarms detected."
            })
        return docs

    @classmethod
    def _generate_discharge_summaries(cls, spec: DomainSpec, count: int, rng: random.Random) -> List[Dict[str, Any]]:
        docs = []
        conditions = [
            ("I10 - Essential Hypertension", "Lisinopril 10mg daily", "Follow-up in 4 weeks. Maintain low-sodium diet."),
            ("E11.9 - Type 2 Diabetes Mellitus", "Metformin 500mg BID", "Routine HbA1c monitoring in 3 months. Exercise daily."),
            ("M54.5 - Acute Lumbosacral Strain", "Cyclobenzaprine 5mg PRN", "Physical therapy twice weekly. Avoid heavy lifting.")
        ]

        for i in range(count):
            dx, rx, instructions = conditions[i % len(conditions)]
            docs.append({
                "doc_id": f"DS-2025-{3200 + i}",
                "doc_type": "Hospital Inpatient Discharge Summary",
                "hospital": "Saint Jude Memorial Medical Center",
                "admission_date": f"2025-08-{(i % 20) + 1:02d}",
                "discharge_date": f"2025-08-{(i % 20) + 4:02d}",
                "patient": {
                    "id": f"PAT-{String_zfill(i + 1)}",
                    "name": ["William Carter", "Grace Hopper", "Alan Turing", "Ada Lovelace", "Donald Knuth"][i % 5],
                    "age": 45 + (i * 4) % 35,
                    "attending_physician": "Dr. Robert Vance, MD"
                },
                "diagnoses": {
                    "primary": dx,
                    "secondary": "Z00.00 - General Health Maintenance"
                },
                "discharge_medications": rx,
                "followup_plan": instructions,
                "condition_at_discharge": "Stable, ambulatory, vitals within baseline limits."
            })
        return docs

    @classmethod
    def _generate_insurance_claims(cls, spec: DomainSpec, count: int, rng: random.Random) -> List[Dict[str, Any]]:
        docs = []
        for i in range(count):
            billed = round(rng.uniform(350.0, 1850.0), 2)
            allowed = round(billed * 0.85, 2)
            copay = 30.00
            insurance_paid = round(allowed - copay, 2)

            docs.append({
                "doc_id": f"CLM-2025-{7700 + i}",
                "doc_type": "Health Insurance Explanation of Benefits (EOB)",
                "carrier": "BlueShield Horizon Health Plan",
                "claim_status": "APPROVED & PROCESSED",
                "subscriber": {
                    "member_id": f"MBR-{88000 + i}",
                    "name": ["Daniel Peterson", "Chloe Bennet", "Richard Hendricks", "Erlich Bachman"][i % 4],
                    "group_number": "GRP-09412"
                },
                "service_details": {
                    "service_date": f"2025-08-{(i % 25) + 1:02d}",
                    "provider": "Valley Medical Group LLC",
                    "cpt_code": "99214 - Office Visit Level 4",
                    "billed_amount": billed,
                    "plan_allowed_amount": allowed,
                    "patient_copay": copay,
                    "plan_paid_amount": insurance_paid,
                    "patient_responsibility": copay
                }
            })
        return docs


def String_zfill(n: int) -> str:
    return str(n).zfill(5)
