class ImpossibleQuantityError(ValueError):
    """Raised when user requests an impossible quantity constraint (e.g. 5000 unique values from 300 possible)."""

    def __init__(self, requested: int, possible: int, reason: str = "", column: str = ""):
        self.requested = requested
        self.possible = possible
        self.reason = reason
        self.column = column
        col_str = f" for column '{column}'" if column else ""
        msg = (
            f"Impossible quantity request{col_str}: requested {requested}, but maximum possible is {possible}. "
            f"Please relax the uniqueness constraint or allow repetitions. {reason}".strip()
        )
        super().__init__(msg)
