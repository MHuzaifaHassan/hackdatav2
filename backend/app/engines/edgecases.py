from typing import Any, List, Optional
import numpy as np
import pandas as pd


UNICODE_NAMES = [
    "José María García",
    "Renée Müller",
    "Søren Aabye Kierkegaard",
    "François Hollande",
    "Chloë Sevigny",
    "Krzysztof Kieślowski",
    "Elena Rostova-Бондарчук",
    "李伟 (Li Wei)",
    "佐藤 健 (Takeru Sato)",
    "Hélène Guérin",
    "Nuñez O'Connor",
    "Mária Nagy-Kovács",
    "Björn Åkesson",
    "Amélie Poulain",
    "Zoë Strauß",
    "Łukasz Wójcik",
    "Antonín Dvořák",
    "Fatima Al-Zahra (فاطمة الزهراء)",
    "Aarav Sharma (आरव शर्मा)",
    "Dimitrios Papadopoulos (Δημήτριος)",
    "Nguyễn Văn An",
    "Tariq bin Ziyad (طارق بن زياد)",
    "João Pedro Gonçalves",
]


class EdgeCasesInjector:
    """Injects realistic edge cases: nulls, outliers, unicode, boundaries."""

    @staticmethod
    def inject_nulls(
        series: pd.Series,
        rate: float,
        rng: np.random.Generator
    ) -> pd.Series:
        """Randomly inject null values at the specified target rate."""
        if rate <= 0.0 or len(series) == 0:
            return series

        n = len(series)
        num_nulls = int(round(n * rate))
        if num_nulls <= 0:
            return series

        null_indices = rng.choice(n, size=min(num_nulls, n), replace=False)
        # Ensure series can hold None / NaN without dtype casting errors
        if pd.api.types.is_bool_dtype(series) or pd.api.types.is_integer_dtype(series):
            result = series.astype(object).copy()
        else:
            result = series.copy()

        result.iloc[null_indices] = None
        return result

    @staticmethod
    def inject_outliers(
        series: pd.Series,
        rate: float,
        rng: np.random.Generator,
        is_int: bool = False
    ) -> pd.Series:
        """Injects extreme numeric outliers (low and high) at the specified rate."""
        if rate <= 0.0 or len(series) == 0:
            return series

        valid_mask = series.notna()
        if not valid_mask.any():
            return series

        valid_indices = series[valid_mask].index.to_numpy()
        n_valid = len(valid_indices)
        num_outliers = int(round(n_valid * rate))
        if num_outliers <= 0:
            return series

        outlier_indices = rng.choice(valid_indices, size=num_outliers, replace=False)
        values = series[valid_mask].astype(float)
        q25 = values.quantile(0.25)
        q75 = values.quantile(0.75)
        iqr = max(q75 - q25, 1.0)
        
        result = series.copy()
        for idx in outlier_indices:
            # 50% chance high outlier, 50% chance low/zero outlier
            if rng.random() > 0.5:
                outlier_val = q75 + rng.uniform(3.0, 7.0) * iqr
            else:
                outlier_val = max(0.0, q25 - rng.uniform(2.0, 4.0) * iqr)

            if is_int:
                outlier_val = int(round(outlier_val))
            result.at[idx] = outlier_val

        return result

    @staticmethod
    def inject_unicode_names(
        series: pd.Series,
        rate: float,
        rng: np.random.Generator
    ) -> pd.Series:
        """Injects unicode / multi-script names for stress testing internationalization."""
        if rate <= 0.0 or len(series) == 0:
            return series

        n = len(series)
        num_unicode = max(1, int(round(n * rate)))
        if num_unicode <= 0:
            return series

        indices = rng.choice(n, size=min(num_unicode, n), replace=False)
        result = series.copy()
        for idx in indices:
            result.iloc[idx] = rng.choice(UNICODE_NAMES)
        return result
