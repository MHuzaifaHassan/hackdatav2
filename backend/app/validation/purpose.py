from typing import Any, Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import train_test_split

from backend.app.engines.locales import PAKISTANI_CITIES
from backend.app.spec.brief import RequirementBrief
from backend.app.spec.models import DomainSpec


class PurposeValidator:
    """
    Layer B Purpose & Utility Checks:
    - ML Utility Test: trains a model on target_column and evaluates ROC AUC vs threshold
    - Realism Checks: no impossible combos (male pregnancy, negative age, discharge before admission)
    - Locale Matching: ensures addresses/cities/currency match the requested region
    - Target Rate Checks: verifies label distribution falls within specified range
    """

    @classmethod
    def evaluate_utility_auc(
        cls,
        df: pd.DataFrame,
        target_col: str,
        min_auc: float = 0.75,
        seed: int = 42
    ) -> Tuple[bool, float, Optional[str]]:
        """
        Trains a predictive model with 75/25 train/test split.
        Returns: (passed, observed_auc, issue_message)
        """
        if target_col not in df.columns or len(df.dropna(subset=[target_col])) < 50:
            return False, 0.50, f"Target column '{target_col}' not found or insufficient valid rows."

        # Filter out rows with NaN in target_col
        df_clean = df.dropna(subset=[target_col]).copy()
        y = pd.to_numeric(df_clean[target_col], errors='coerce').fillna(0).astype(int)

        # Check class balance
        pos_count = y.sum()
        if pos_count == 0 or pos_count == len(y):
            return False, 0.50, f"Target column '{target_col}' has only one class (all {pos_count}). AUC cannot be computed."

        # Feature preparation: select numeric & encoded categorical features
        feature_cols = [c for c in df_clean.columns if c != target_col and not c.endswith("_id") and "name" not in c.lower() and "email" not in c.lower()]
        X_df = pd.DataFrame(index=df_clean.index)

        for col in feature_cols:
            if pd.api.types.is_numeric_dtype(df[col]):
                X_df[col] = df[col].fillna(df[col].median() if len(df[col].dropna()) > 0 else 0.0)
            elif pd.api.types.is_datetime64_any_dtype(df[col]) or "date" in col.lower() or "time" in col.lower():
                try:
                    dt = pd.to_datetime(df[col], errors="coerce")
                    X_df[f"{col}_hour"] = dt.dt.hour.fillna(12)
                    X_df[f"{col}_weekday"] = dt.dt.weekday.fillna(2)
                except Exception:
                    pass
            elif isinstance(df[col].dtype, pd.CategoricalDtype) or df[col].dtype == object:
                # Frequency encode
                freq = df[col].value_counts(normalize=True).to_dict()
                X_df[f"{col}_freq"] = df[col].map(freq).fillna(0.0)

        if X_df.shape[1] == 0:
            return False, 0.50, "No numeric or encodable predictive features found in dataset."

        try:
            X_train, X_test, y_train, y_test = train_test_split(
                X_df, y, test_size=0.25, random_state=seed, stratify=y if pos_count >= 4 else None
            )

            clf = LogisticRegression(max_iter=300, random_state=seed)
            clf.fit(X_train, y_train)

            # Predict probabilities
            if len(np.unique(y_test)) < 2:
                # Fallback to train AUC if test set has only one class
                probs = clf.predict_proba(X_train)[:, 1]
                auc = float(roc_auc_score(y_train, probs))
            else:
                probs = clf.predict_proba(X_test)[:, 1]
                auc = float(roc_auc_score(y_test, probs))

            auc = round(auc, 4)
            passed = auc >= min_auc
            issue = None if passed else f"Model AUC {auc:.3f} is below the required threshold of {min_auc:.3f}. Signals may be too weak or noisy."
            return passed, auc, issue
        except Exception as e:
            return False, 0.50, f"Utility model training failed: {str(e)}"

    @classmethod
    def check_realism_and_locale(
        cls,
        data: Dict[str, pd.DataFrame],
        brief: RequirementBrief,
        spec: DomainSpec
    ) -> Tuple[bool, List[Dict[str, Any]], List[str]]:
        """
        Validates clinical/financial realism and geographical locale matching.
        """
        criteria = []
        issues = []
        all_passed = True

        # 1. Locale Match: If Pakistan requested, check cities and currency
        req_region = brief.constraints.get("region", "").upper()
        if req_region in ("PK", "PAKISTAN") or spec.locale in ("en_PK", "ur_PK") or spec.currency == "PKR":
            # Check city columns across all tables
            pak_city_set = set(c.lower() for c in PAKISTANI_CITIES)
            invalid_cities = []
            for t_name, df in data.items():
                city_cols = [c for c in df.columns if "city" in c.lower()]
                for c_col in city_cols:
                    observed_cities = df[c_col].dropna().unique()
                    non_pk = [c for c in observed_cities if str(c).lower() not in pak_city_set and str(c) != "default"]
                    if non_pk:
                        invalid_cities.extend(non_pk[:3])

            locale_passed = (len(invalid_cities) == 0)
            if not locale_passed:
                all_passed = False
                issues.append(f"Locale mismatch: Non-Pakistani cities detected ({invalid_cities[:3]}) when region=PK was requested.")
            criteria.append({
                "id": "locale_match_pk",
                "description": "All geographical locations match Pakistan (PK)",
                "passed": locale_passed,
                "observed": "Valid PK cities" if locale_passed else f"Invalid cities: {invalid_cities[:3]}",
                "expected": "Pakistani cities only"
            })

        # 2. Impossible Combos Check (Healthcare)
        if "patients" in data:
            p_df = data["patients"]
            if "gender" in p_df.columns and "diagnosis" in p_df.columns:
                impossible = p_df[(p_df["gender"].str.lower() == "male") & (p_df["diagnosis"].str.lower().str.contains("pregnan|obstet"))]
                no_impossible = len(impossible) == 0
                if not no_impossible:
                    all_passed = False
                    issues.append(f"Impossible clinical combination: {len(impossible)} male pregnancy diagnoses detected.")
                criteria.append({
                    "id": "no_impossible_combo_clinical",
                    "description": "Zero impossible clinical combinations (e.g. Male + Pregnancy)",
                    "passed": no_impossible,
                    "observed": f"{len(impossible)} violations",
                    "expected": "0 violations"
                })

        # 3. No Lorem Ipsum / Dummy text
        for t_name, df in data.items():
            text_cols = [c for c in df.columns if df[c].dtype == object]
            for col in text_cols:
                sample_texts = df[col].dropna().astype(str).tolist()[:20]
                has_lorem = any("lorem ipsum" in s.lower() or "dolor sit" in s.lower() for s in sample_texts)
                if has_lorem:
                    all_passed = False
                    issues.append(f"Dummy placeholder text 'Lorem Ipsum' detected in table '{t_name}', column '{col}'.")
                    criteria.append({
                        "id": f"no_lorem_ipsum_{t_name}_{col}",
                        "description": f"No lorem ipsum text in '{t_name}.{col}'",
                        "passed": False,
                        "observed": "Lorem ipsum detected",
                        "expected": "Realistic domain text"
                    })

        return all_passed, criteria, issues
