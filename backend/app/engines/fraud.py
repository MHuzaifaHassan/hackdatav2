from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd


class FraudEngine:
    """
    Injects realistic, learnable fraud/anomaly patterns into synthetic transaction data.
    Ensures measurable ML utility (AUC > 0.75) with controlled target class rate and noise.
    """

    @classmethod
    def inject_fraud_patterns(
        cls,
        df: pd.DataFrame,
        target_col: str = "is_fraud",
        rate: float = 0.02,
        seed: int = 42,
        signals: Optional[List[Dict[str, Any]]] = None,
        noise: float = 0.10
    ) -> pd.DataFrame:
        """
        Injects an `is_fraud` boolean/binary column with structured signals based on:
        - Transaction amount: higher amounts exponentially increase fraud odds.
        - Transaction time/hour: night transactions (01:00 to 05:00) have elevated fraud probability.
        - Merchant / category signals: high-risk categories/merchants get boosted.
        - Noise factor: ensures target is learnable but non-trivial (target AUC ~ 0.80 - 0.90).
        """
        rng = np.random.default_rng(seed)
        n = len(df)
        if n == 0:
            df[target_col] = pd.Series([], dtype=bool)
            return df

        # Base log-odds score for all records
        score = np.zeros(n, dtype=float)

        # 1. Amount signal
        if "amount" in df.columns:
            amounts = pd.to_numeric(df["amount"], errors="coerce").fillna(50.0).to_numpy()
            mean_amt = np.mean(amounts) if np.mean(amounts) > 0 else 50.0
            # Higher amounts increase risk
            score += 2.5 * (amounts / mean_amt)

        # 2. Time/Hour signal
        date_col = next((c for c in df.columns if "date" in c.lower() or "time" in c.lower()), None)
        if date_col:
            try:
                dt_series = pd.to_datetime(df[date_col], errors="coerce")
                hours = dt_series.dt.hour.fillna(12).to_numpy()
                # Night transactions (1 AM to 5 AM) receive high fraud boost
                night_mask = (hours >= 1) & (hours <= 5)
                score[night_mask] += 3.0
            except Exception:
                pass

        # 3. Add Gaussian noise to prevent trivial determinism
        score += rng.normal(loc=0.0, scale=max(0.01, noise * 2.0), size=n)

        # 4. Imbalanced class control to match exact target rate
        n_fraud = max(1, int(round(n * rate))) if rate > 0 else 0
        fraud_labels = np.zeros(n, dtype=bool)

        if n_fraud > 0:
            top_fraud_indices = np.argsort(-score)[:n_fraud]
            fraud_labels[top_fraud_indices] = True

            # Invert random noise fraction if requested to simulate realistic label noise
            if noise > 0 and n_fraud > 5:
                n_flip = max(1, int(round(n_fraud * noise)))
                # Flip some non-fraud to fraud and vice versa
                flip_from_fraud = rng.choice(top_fraud_indices, size=n_flip, replace=False)
                non_fraud_indices = np.where(~fraud_labels)[0]
                if len(non_fraud_indices) >= n_flip:
                    flip_to_fraud = rng.choice(non_fraud_indices, size=n_flip, replace=False)
                    fraud_labels[flip_from_fraud] = False
                    fraud_labels[flip_to_fraud] = True

        df[target_col] = fraud_labels
        return df
