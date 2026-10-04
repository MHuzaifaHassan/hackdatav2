from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd


class TimeSeriesEngine:
    """
    Applies time-series dynamics: seasonality, weekly cycles, salary-day spikes, and event presets.
    """

    @classmethod
    def apply_timeseries_dynamics(
        cls,
        df: pd.DataFrame,
        date_col: str,
        value_col: str,
        preset: Optional[str] = None,
        salary_day: int = 1,
        weekend_factor: float = 1.35,
        trend_slope: float = 0.001,
        seed: int = 42
    ) -> pd.DataFrame:
        """
        Adjusts numeric series based on calendar dynamics and event shocks.
        Presets: 'black_friday', 'eid_sale', 'salary_surge', 'bank_run'.
        """
        if date_col not in df.columns or value_col not in df.columns or len(df) == 0:
            return df

        rng = np.random.default_rng(seed)
        df_copy = df.copy()

        try:
            dates = pd.to_datetime(df_copy[date_col], errors="coerce")
            values = pd.to_numeric(df_copy[value_col], errors="coerce").fillna(0.0).to_numpy()

            multipliers = np.ones(len(df), dtype=float)

            # 1. Weekend pattern (Saturday=5, Sunday=6)
            weekdays = dates.dt.weekday.to_numpy()
            is_weekend = (weekdays == 5) | (weekdays == 6)
            multipliers[is_weekend] *= weekend_factor

            # 2. Salary-day surge (e.g. 1st or 28th of month +/- 2 days)
            days = dates.dt.day.to_numpy()
            is_salary = np.abs(days - salary_day) <= 2
            multipliers[is_salary] *= 1.6

            # 3. Preset event shocks
            if preset == "black_friday":
                # Late November surge
                is_nov = (dates.dt.month == 11) & (dates.dt.day >= 20) & (dates.dt.day <= 30)
                multipliers[is_nov] *= 2.8
            elif preset == "eid_sale":
                # General festival surge
                is_festive = (dates.dt.day >= 10) & (dates.dt.day <= 15)
                multipliers[is_festive] *= 2.2
            elif preset == "bank_run":
                # Massive withdrawal shock
                multipliers *= rng.uniform(2.5, 5.0, size=len(df))

            # Apply trend
            n = len(df)
            trend = 1.0 + (trend_slope * np.arange(n))
            multipliers *= trend

            df_copy[value_col] = np.round(values * multipliers, 2)
            return df_copy
        except Exception:
            return df
