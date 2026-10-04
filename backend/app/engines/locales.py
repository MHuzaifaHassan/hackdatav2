"""
Locale Engine for Synthetic Data Generation.
Provides authentic names, cities, phone formats, national ID formats, currency,
and address formats for Pakistani (en_PK/ur_PK), German (de_DE), British (en_GB), and American (en_US).
"""
import re
from typing import Any, Dict, List, Optional, Tuple
import numpy as np

PAKISTANI_NAMES = [
    "Muhammad Ali", "Fatima Zahra", "Ahmed Khan", "Ayesha Malik", "Tariq Mahmood",
    "Zainab Bibi", "Bilal Tariq", "Sana Mir", "Usman Farooq", "Maryam Nawaz",
    "Hamza Sheikh", "Hira Mani", "Imran Abbas", "Sadia Khan", "Faisal Qureshi",
    "Nida Yasir", "Zubair Hashmi", "Rabia Anum", "Kamran Akmal", "Mehwish Hayat",
    "Shahid Afridi", "Mahira Khan", "Babar Azam", "Shaheen Afridi", "Haris Rauf",
    "Sidra Ameen", "Nasir Jamshed", "Asad Shafiq", "Sarfaraz Ahmed", "Noman Ali",
    "Kashif Mehmood", "Javerya Khan", "Muniba Mazari", "Junaid Jamshed", "Atif Aslam"
]

PAKISTANI_CITIES = [
    "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad",
    "Peshawar", "Quetta", "Multan", "Sialkot", "Gujranwala",
    "Hyderabad", "Abbottabad", "Bahawalpur", "Sargodha", "Sukkur"
]

PAKISTANI_ADDRESSES = [
    "House 12, Street 4, Sector F-7/2, Islamabad",
    "Plot 45-B, Commercial Area, DHA Phase 6, Lahore",
    "Flat 302, Al-Noor Heights, Clifton Block 5, Karachi",
    "Street 9, Gulberg III, Lahore",
    "House 88, Satellite Town, Rawalpindi",
    "Suit 10, Trade Center, I.I. Chundrigar Road, Karachi",
    "B-14, Model Town, Lahore",
    "House 5, Street 18, F-10/2, Islamabad",
    "Plot 22, University Town, Peshawar",
    "Jinnah Road, Near Cantonment, Quetta"
]

GERMAN_NAMES = [
    "Lukas Müller", "Maximilian Schmidt", "Anna Schneider", "Sophie Fischer",
    "Leon Weber", "Emma Meyer", "Jonas Wagner", "Mia Becker", "Paul Schulz",
    "Hannah Hoffmann", "Felix Schäfer", "Lea Koch", "David Bauer", "Laura Richter"
]

GERMAN_CITIES = [
    "Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne",
    "Stuttgart", "Düsseldorf", "Leipzig", "Dresden", "Hanover"
]

GERMAN_ADDRESSES = [
    "Hauptstraße 14, 10115 Berlin",
    "Goethestraße 8, 80336 München",
    "Königsallee 27, 40212 Düsseldorf",
    "Mönckebergstraße 5, 20095 Hamburg",
    "Zeil 106, 60313 Frankfurt am Main"
]

BRITISH_NAMES = [
    "Oliver Smith", "Charlotte Jones", "George Taylor", "Amelia Brown",
    "Harry Wilson", "Emily Davies", "Jack Evans", "Olivia Thomas", "Noah Roberts"
]

BRITISH_CITIES = [
    "London", "Manchester", "Birmingham", "Edinburgh", "Glasgow",
    "Bristol", "Liverpool", "Leeds", "Sheffield", "Newcastle"
]


class LocaleManager:
    """Provides locale-specific synthetic generators."""

    @staticmethod
    def normalize_locale(locale_str: Optional[str]) -> Tuple[str, str]:
        """
        Normalizes locale string to (standard_locale, currency).
        Defaults to ('en_US', 'USD').
        """
        if not locale_str:
            return ("en_US", "USD")

        l_lower = locale_str.lower()
        if any(w in l_lower for w in ["pakistan", "pakistani", "en_pk", "ur_pk", "pkr"]):
            return ("en_PK", "PKR")
        elif any(w in l_lower for w in ["german", "germany", "deutschland", "de_de", "eur", "euro"]):
            return ("de_DE", "EUR")
        elif any(w in l_lower for w in ["british", "britain", "uk", "england", "en_gb", "gbp"]):
            return ("en_GB", "GBP")
        else:
            return ("en_US", "USD")

    @classmethod
    def generate_names(cls, locale: str, n_rows: int, rng: np.random.Generator) -> np.ndarray:
        norm_locale, _ = cls.normalize_locale(locale)
        if norm_locale == "en_PK":
            return rng.choice(PAKISTANI_NAMES, size=n_rows)
        elif norm_locale == "de_DE":
            return rng.choice(GERMAN_NAMES, size=n_rows)
        elif norm_locale == "en_GB":
            return rng.choice(BRITISH_NAMES, size=n_rows)
        return None

    @classmethod
    def generate_cities(cls, locale: str, n_rows: int, rng: np.random.Generator) -> np.ndarray:
        norm_locale, _ = cls.normalize_locale(locale)
        if norm_locale == "en_PK":
            return rng.choice(PAKISTANI_CITIES, size=n_rows)
        elif norm_locale == "de_DE":
            return rng.choice(GERMAN_CITIES, size=n_rows)
        elif norm_locale == "en_GB":
            return rng.choice(BRITISH_CITIES, size=n_rows)
        return None

    @classmethod
    def generate_phone(cls, locale: str, n_rows: int, rng: np.random.Generator) -> np.ndarray:
        norm_locale, _ = cls.normalize_locale(locale)
        if norm_locale == "en_PK":
            # Authentic Pakistani mobile numbers: +92-3xx-xxxxxxx
            prefixes = ["300", "301", "302", "312", "321", "333", "345", "346"]
            phones = []
            for _ in range(n_rows):
                p = rng.choice(prefixes)
                sub = rng.integers(1000000, 9999999)
                phones.append(f"+92-{p}-{sub}")
            return np.array(phones, dtype=object)
        elif norm_locale == "de_DE":
            phones = [f"+49-17{rng.integers(0, 9)}-{rng.integers(1000000, 9999999)}" for _ in range(n_rows)]
            return np.array(phones, dtype=object)
        elif norm_locale == "en_GB":
            phones = [f"+44-7{rng.integers(100, 999)}-{rng.integers(100000, 999999)}" for _ in range(n_rows)]
            return np.array(phones, dtype=object)
        else:
            area_codes = [212, 312, 415, 617, 206, 303, 512, 702]
            phones = [f"+1-{rng.choice(area_codes)}-555-{rng.integers(1000, 9999):04d}" for _ in range(n_rows)]
            return np.array(phones, dtype=object)

    @classmethod
    def generate_national_id(cls, locale: str, n_rows: int, rng: np.random.Generator) -> np.ndarray:
        norm_locale, _ = cls.normalize_locale(locale)
        if norm_locale == "en_PK":
            # CNIC format: xxxxx-xxxxxxx-x (e.g. 42101-1234567-1)
            districts = ["42101", "35201", "61101", "38403", "17301"]
            ids = []
            for _ in range(n_rows):
                d = rng.choice(districts)
                mid = rng.integers(1000000, 9999999)
                last = rng.integers(1, 9)
                ids.append(f"{d}-{mid}-{last}")
            return np.array(ids, dtype=object)
        else:
            return np.array([f"NID-{rng.integers(100000, 999999)}" for _ in range(n_rows)], dtype=object)

    @classmethod
    def generate_addresses(cls, locale: str, n_rows: int, rng: np.random.Generator) -> np.ndarray:
        norm_locale, _ = cls.normalize_locale(locale)
        if norm_locale == "en_PK":
            return rng.choice(PAKISTANI_ADDRESSES, size=n_rows)
        elif norm_locale == "de_DE":
            return rng.choice(GERMAN_ADDRESSES, size=n_rows)
        return None
