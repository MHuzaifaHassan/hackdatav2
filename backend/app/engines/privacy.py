import hashlib
import re
from typing import Any, List, Optional
import numpy as np
import pandas as pd
from backend.app.spec.models import PrivacyAction, PrivacySpec


class PrivacyEngine:
    """Applies privacy operations: masking, hashing, and differential noise."""

    @staticmethod
    def mask_string(val: Any, spec: PrivacySpec) -> str:
        if val is None or pd.isna(val):
            return val
        s = str(val)
        if not s:
            return s

        char = spec.mask_char or "*"
        
        # Special handling for email addresses
        if "@" in s:
            parts = s.split("@", 1)
            local, domain = parts[0], parts[1]
            if len(local) <= 2:
                masked_local = (local[0] if len(local) > 0 else "") + char * 3
            else:
                masked_local = local[:spec.unmasked_prefix] + char * 3
            return f"{masked_local}@{domain}"

        # Special handling for phone or formatted strings with digits
        if len(s) <= (spec.unmasked_prefix + spec.unmasked_suffix):
            return char * len(s)

        prefix = s[:spec.unmasked_prefix]
        suffix = s[-spec.unmasked_suffix:] if spec.unmasked_suffix > 0 else ""
        masked_len = len(s) - len(prefix) - len(suffix)
        return prefix + (char * max(1, masked_len)) + suffix

    @classmethod
    def mask_email_value(cls, val: Any) -> Any:
        """Masks email address into format e.g. jo***@domain.com."""
        if val is None or pd.isna(val):
            return val
        s = str(val).strip()
        if not s:
            return s
        if "@" in s:
            parts = s.split("@", 1)
            local, domain = parts[0], parts[1]
            if len(local) <= 2:
                masked_local = (local[0] if len(local) > 0 else "") + "***"
            else:
                masked_local = local[:2] + "***"
            return f"{masked_local}@{domain}"
        # Non-standard email fallback
        if len(s) <= 2:
            return (s[0] if len(s) > 0 else "") + "***"
        return s[:2] + "***"

    @classmethod
    def mask_email(cls, series: pd.Series) -> pd.Series:
        """Applies email masking across a pandas Series."""
        return series.apply(cls.mask_email_value)

    @classmethod
    def hash_sha256_value(cls, val: Any) -> Any:
        """Computes deterministic 64-character SHA-256 hexadecimal digest for cryptographic secrets."""
        if val is None or pd.isna(val):
            return val
        s = str(val)
        return hashlib.sha256(s.encode("utf-8")).hexdigest()

    @classmethod
    def hash_sha256(cls, series: pd.Series) -> pd.Series:
        """Applies SHA-256 cryptographic hashing across a pandas Series."""
        return series.apply(cls.hash_sha256_value)

    @staticmethod
    def hash_value(val: Any, spec: PrivacySpec) -> str:
        if val is None or pd.isna(val):
            return val
        s = str(val)
        if spec.salt:
            s = f"{spec.salt}:{s}"
        
        algo = (spec.hash_algorithm or "sha256").lower()
        if algo == "sha256":
            return hashlib.sha256(s.encode("utf-8")).hexdigest()
        elif algo == "md5":
            return hashlib.md5(s.encode("utf-8")).hexdigest()
        elif algo == "sha512":
            return hashlib.sha512(s.encode("utf-8")).hexdigest()
        else:
            return hashlib.sha256(s.encode("utf-8")).hexdigest()

    @staticmethod
    def add_noise(
        series: pd.Series,
        spec: PrivacySpec,
        rng: np.random.Generator,
        is_int: bool = False
    ) -> pd.Series:
        """Injects Laplace or Gaussian noise to numeric series."""
        valid_mask = series.notna()
        if not valid_mask.any():
            return series

        numeric_vals = series[valid_mask].astype(float)
        val_range = numeric_vals.max() - numeric_vals.min()
        if val_range == 0:
            scale = max(abs(numeric_vals.mean()) * spec.noise_scale, 1.0 * spec.noise_scale)
        else:
            scale = val_range * spec.noise_scale

        dist = (spec.noise_distribution or "laplace").lower()
        if dist == "gaussian" or dist == "normal":
            noise = rng.normal(loc=0.0, scale=scale, size=len(numeric_vals))
        else:
            # Default to Laplace distribution (standard for Differential Privacy)
            noise = rng.laplace(loc=0.0, scale=scale, size=len(numeric_vals))

        noised_vals = numeric_vals + noise
        if is_int:
            noised_vals = np.round(noised_vals).astype(int)

        result = series.copy()
        result.loc[valid_mask] = noised_vals
        return result

    @classmethod
    def apply_column_privacy(
        cls,
        series: pd.Series,
        spec: PrivacySpec,
        rng: np.random.Generator,
        is_int: bool = False
    ) -> pd.Series:
        """Apply the configured privacy transformation on a Pandas Series."""
        if spec.action == PrivacyAction.MASK:
            return series.apply(lambda x: cls.mask_string(x, spec))
        elif spec.action == PrivacyAction.HASH:
            return series.apply(lambda x: cls.hash_value(x, spec))
        elif spec.action == PrivacyAction.NOISE:
            return cls.add_noise(series, spec, rng, is_int=is_int)
        return series
