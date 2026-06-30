import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

class EnterprisePasswordValidator:
    """
    Django password validator that enforces:
    - Minimum length of 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one numeric digit
    - At least one special character
    """
    def __init__(self, min_length=8):
        self.min_length = min_length

    def validate(self, password, user=None):
        if len(password) < self.min_length:
            raise ValidationError(
                _("This password must contain at least %(min_length)d characters."),
                code="password_too_short",
                params={"min_length": self.min_length},
            )
        if not re.search(r"[A-Z]", password):
            raise ValidationError(
                _("This password must contain at least one uppercase letter (A-Z)."),
                code="password_no_uppercase",
            )
        if not re.search(r"[a-z]", password):
            raise ValidationError(
                _("This password must contain at least one lowercase letter (a-z)."),
                code="password_no_lowercase",
            )
        if not re.search(r"[0-9]", password):
            raise ValidationError(
                _("This password must contain at least one digit (0-9)."),
                code="password_no_digit",
            )
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>[\]\\_\-+=~`/;']", password):
            raise ValidationError(
                _("This password must contain at least one special character."),
                code="password_no_special",
            )

    def get_help_text(self):
        return _(
            "Your password must contain at least 8 characters, and include "
            "at least one uppercase letter, one lowercase letter, one digit, "
            "and one special character."
        )
