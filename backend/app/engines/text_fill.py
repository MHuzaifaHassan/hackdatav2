import hashlib
import json
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd

from backend.app.llm.provider import BaseLLMProvider


DOMAIN_VOCABULARIES: Dict[str, Dict[str, List[str]]] = {
    "fintech": {
        "merchants": [
            "Amazon.com*Prime Video AMZN.COM/BILL WA",
            "Starbucks Coffee #1042 San Francisco CA",
            "Uber Trip Help.Uber.com CA",
            "Walmart Supercenter #2214 Dallas TX",
            "Shell Oil 575412431 Austin TX",
            "Target T-0842 Chicago IL",
            "Netflix.com Monthly Subscription CA",
            "Whole Foods Market #102 Seattle WA",
            "Apple.com/Bill 866-712-7753 CA",
            "Chevron 0092147 San Jose CA",
            "Costco Wholesale #0481 Kirkland WA",
            "CVS Pharmacy #0314 New York NY",
            "Trader Joe's #540 Boston MA",
            "Lyft Ride 08-24 San Diego CA",
            "Home Depot #0612 Atlanta GA",
            "Kroger Food Stores Cincinnati OH",
            "Walgreens Store #412 Miami FL",
            "Best Buy #1028 Minneapolis MN",
        ],
        "notes": [
            "Monthly Rent payment - Apt 4B",
            "Dinner and drinks split via Venmo",
            "Payroll Direct Deposit - ACME Corp",
            "Utility bill - Consolidated Edison",
            "Bi-weekly savings transfer",
            "Gym membership monthly dues",
            "Car loan repayment installment",
            "Healthcare insurance copay",
            "Subscription renewal for cloud backup",
            "Home internet fiber connection bill",
        ]
    },
    "healthcare": {
        "icd10": [
            "I10 - Essential (primary) hypertension",
            "E11.9 - Type 2 diabetes mellitus without complications",
            "J45.909 - Unspecified asthma, uncomplicated",
            "M54.5 - Low back pain, unspecified",
            "Z00.00 - Encounter for general adult medical examination without abnormal findings",
            "E78.5 - Hyperlipidemia, unspecified",
            "K21.9 - Gastro-esophageal reflux disease without esophagitis",
            "F41.1 - Generalized anxiety disorder",
            "M25.561 - Pain in right knee",
            "J02.9 - Acute pharyngitis, unspecified",
            "R53.83 - Other fatigue",
            "N39.0 - Urinary tract infection, site not specified",
        ],
        "drugs": [
            "Lisinopril 10 mg oral tablet",
            "Metformin HCl 500 mg oral tablet",
            "Atorvastatin Calcium 20 mg oral tablet",
            "Levothyroxine Sodium 50 mcg oral tablet",
            "Amlodipine Besylate 5 mg oral tablet",
            "Metoprolol Tartrate 25 mg oral tablet",
            "Omeprazole 20 mg delayed-release capsule",
            "Losartan Potassium 50 mg oral tablet",
            "Albuterol HFA 90 mcg/actuation inhaler",
            "Amoxicillin 500 mg oral capsule",
            "Hydrochlorothiazide 25 mg oral tablet",
            "Gabapentin 300 mg oral capsule",
        ],
        "clinical_notes": [
            "Patient presents for routine follow-up. Vitals stable. Encouraged lifestyle modifications and daily exercise.",
            "Complains of mild fatigue and seasonal allergies. Physical examination unremarkable. Routine labs ordered.",
            "Follow-up for chronic hypertension. Blood pressure adequately controlled on current regimen. Continue medication.",
            "Evaluation for knee discomfort following physical activity. Range of motion intact. Advised RICE protocol.",
            "Annual health maintenance exam. Discussed preventative screenings and nutritional counseling.",
        ]
    },
    "ecommerce": {
        "products": [
            "Wireless Active Noise-Cancelling Over-Ear Headphones",
            "Ergonomic Compact Mechanical Gaming Keyboard (RGB)",
            "Ultra-Slim 27-inch 4K UHD IPS Computer Monitor",
            "Organic Fair-Trade Cotton Crewneck T-Shirt",
            "Stainless Steel Double-Walled French Press Coffee Maker 34oz",
            "Waterproof Lightweight Trail Running Shoes (Men/Women)",
            "Anodized Aluminum Multi-Angle Laptop Stand",
            "Fast-Charging 65W GaN USB-C Portable Power Adapter",
            "Insulated Reusable Stainless Steel Water Bottle 32oz",
            "Smart Wi-Fi Color LED Dimmable Ambient Bulb (2-Pack)",
        ],
        "reviews": [
            "Exceeded my expectations! Build quality is superb and shipping was remarkably fast.",
            "Solid everyday item. Does exactly what it promises without any fuss. Would recommend.",
            "Great value for money compared to brand-name alternatives. Very pleased with this purchase.",
            "Arrived well packaged and on schedule. Instructions were straightforward.",
            "High quality materials and sleek minimal design. Fits perfectly in my workspace.",
        ]
    },
    "hr": {
        "titles": [
            "Senior Staff Software Engineer",
            "Lead Product Designer (UX/UI)",
            "Director of Enterprise Sales",
            "Strategic People Operations Specialist",
            "Principal Data Platform Architect",
            "Senior Corporate Financial Analyst",
            "Global Customer Success Executive",
            "Senior Cloud Infrastructure DevOps Engineer",
            "Technical Program Manager II",
            "Associate General Counsel",
        ],
        "feedback": [
            "Demonstrated exceptional technical leadership and consistently delivered high-impact platform improvements.",
            "Strong collaborator across cross-functional teams with proactive communication and thorough documentation.",
            "Consistently met key quarterly objectives while mentoring junior engineers across the organization.",
            "Exemplified domain expertise and identified critical performance bottlenecks early in the development lifecycle.",
        ]
    }
}


class TextFillEngine:
    """Provides high-realism text filling, domain vocabularies, and batch LLM generation with hashing cache."""

    def __init__(self, llm: Optional[BaseLLMProvider] = None):
        self.llm = llm
        self._cache: Dict[str, str] = {}

    def get_realistic_merchant(self, rng: np.random.Generator) -> str:
        merchants = DOMAIN_VOCABULARIES["fintech"]["merchants"]
        return str(rng.choice(merchants))

    def get_realistic_transaction_note(self, rng: np.random.Generator) -> str:
        notes = DOMAIN_VOCABULARIES["fintech"]["notes"]
        return str(rng.choice(notes))

    def get_realistic_icd10(self, rng: np.random.Generator, is_male: bool = False) -> str:
        diagnoses = DOMAIN_VOCABULARIES["healthcare"]["icd10"]
        return str(rng.choice(diagnoses))

    def get_realistic_drug(self, rng: np.random.Generator) -> str:
        drugs = DOMAIN_VOCABULARIES["healthcare"]["drugs"]
        return str(rng.choice(drugs))

    def get_realistic_clinical_note(self, rng: np.random.Generator) -> str:
        notes = DOMAIN_VOCABULARIES["healthcare"]["clinical_notes"]
        return str(rng.choice(notes))

    def get_realistic_product_name(self, rng: np.random.Generator) -> str:
        products = DOMAIN_VOCABULARIES["ecommerce"]["products"]
        return str(rng.choice(products))

    def get_realistic_job_title(self, rng: np.random.Generator) -> str:
        titles = DOMAIN_VOCABULARIES["hr"]["titles"]
        return str(rng.choice(titles))

    def fill_realistic_text_for_table(
        self,
        table_name: str,
        df: pd.DataFrame,
        domain: str,
        rng: np.random.Generator
    ) -> pd.DataFrame:
        """Enriches free-text and placeholder columns with realistic domain-specific content."""
        res_df = df.copy()

        for col in res_df.columns:
            lower_col = col.lower()

            # Fintech transactions
            if lower_col in ("description", "merchant", "merchant_name", "memo"):
                if "merchant" in lower_col:
                    res_df[col] = [self.get_realistic_merchant(rng) for _ in range(len(res_df))]
                else:
                    res_df[col] = [
                        rng.choice([self.get_realistic_merchant(rng), self.get_realistic_transaction_note(rng)])
                        for _ in range(len(res_df))
                    ]

            # Healthcare diagnoses and drugs
            elif lower_col in ("diagnosis", "icd10", "icd_10", "condition"):
                res_df[col] = [self.get_realistic_icd10(rng) for _ in range(len(res_df))]
            elif lower_col in ("drug", "medication", "prescription", "rx"):
                res_df[col] = [self.get_realistic_drug(rng) for _ in range(len(res_df))]
            elif lower_col in ("clinical_note", "notes", "physician_notes", "impression"):
                res_df[col] = [self.get_realistic_clinical_note(rng) for _ in range(len(res_df))]

            # E-commerce products
            elif lower_col in ("title", "product_name") and table_name.lower() in ("products", "items"):
                res_df[col] = [self.get_realistic_product_name(rng) for _ in range(len(res_df))]

            # HR job titles
            elif lower_col in ("title", "job_title", "position") and table_name.lower() in ("employees", "staff"):
                res_df[col] = [self.get_realistic_job_title(rng) for _ in range(len(res_df))]

        return res_df
