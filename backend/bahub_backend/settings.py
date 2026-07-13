import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv
import dj_database_url
from django.core.exceptions import ImproperlyConfigured

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env file
load_dotenv(BASE_DIR / ".env")

# Sentry integration for production monitoring
SENTRY_DSN = os.getenv("SENTRY_DSN")
if SENTRY_DSN and not DEBUG:
    try:
        import sentry_sdk
        from sentry_sdk.integrations.django import DjangoIntegration

        sentry_sdk.init(
            dsn=SENTRY_DSN,
            integrations=[DjangoIntegration()],
            traces_sample_rate=0.1,
            profiles_sample_rate=0.1,
            environment=os.getenv("ENVIRONMENT", "production"),
            send_default_pii=False,
        )
    except ImportError:
        pass  # Sentry not installed, skip initialization

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/stable/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv("SECRET_KEY", "django-insecure-replace-me-in-production-12345!")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv("DEBUG", "False").lower() in ("true", "1", "yes")

# Environment variable validation
REQUIRED_ENV_VARS = [
    "SECRET_KEY",
    "DATABASE_URL",
]

OPTIONAL_ENV_VARS = [
    "REDIS_URL",
    "SENTRY_DSN",
    "FRONTEND_URL",
    "CORS_ALLOWED_ORIGINS",
]

def validate_environment():
    """Validate that required environment variables are set."""
    missing_vars = []
    for var in REQUIRED_ENV_VARS:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        raise ImproperlyConfigured(
            f"Missing required environment variables: {', '.join(missing_vars)}. "
            "Please set these in your .env file or environment configuration."
        )
    
    # Warn about optional but recommended variables
    missing_optional = []
    for var in OPTIONAL_ENV_VARS:
        if not os.getenv(var):
            missing_optional.append(var)
    
    if missing_optional and DEBUG:
        import warnings
        warnings.warn(
            f"Optional environment variables not set: {', '.join(missing_optional)}. "
            "These are recommended for production deployment.",
            RuntimeWarning
        )

# Validate environment on startup
validate_environment()

if not DEBUG and SECRET_KEY.startswith("django-insecure-replace-me"):
    raise ImproperlyConfigured("SECRET_KEY must be configured in production.")

ALLOWED_HOSTS = [host.strip() for host in os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",") if host.strip()]
# Ensure Render host is always allowed
if ".onrender.com" not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(".onrender.com")

# Application definition

INSTALLED_APPS = [
    "daphne",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    
    # Third party packages
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "channels",
    
    # Internal apps
    "core",
    "organizations",
    "users",
    "teams",
    "permissions",
    "projects",
    "stakeholders",
    "requirements",
    "stories",
    "documents",
    "meetings",
    "risks",
    "strategic",
    "integrations",
    "billing",
    "django_saml2_auth",
    "audit",
    "diagrams",
    "uat",
    "referrals",
    "templates",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",  # Must be placed at the top
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "audit.middleware.AuditThreadLocalMiddleware",
    "core.middleware.SubscriptionMiddleware",
    "security_headers.SecurityHeadersMiddleware",  # Custom security headers (CSP, X-Content-Type-Options, etc.)
]

ROOT_URLCONF = "bahub_backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "rich": {
            "class": "rich.logging.RichHandler",
            "rich_tracebacks": True,
            "markup": True,
        },
    },
    "root": {
        "handlers": ["rich"],
        "level": "INFO",
    },
}
WSGI_APPLICATION = "bahub_backend.wsgi.application"
ASGI_APPLICATION = "bahub_backend.asgi.application"

REDIS_URL = os.getenv("REDIS_URL", "")
if REDIS_URL:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels_redis.core.RedisChannelLayer",
            "CONFIG": {
                "hosts": [REDIS_URL],
            },
        },
    }
    # Redis caching configuration
    CACHES = {
        "default": {
            "BACKEND": "django_redis.cache.RedisCache",
            "LOCATION": REDIS_URL,
            "OPTIONS": {
                "CLIENT_CLASS": "django_redis.client.DefaultClient",
            },
            "KEY_PREFIX": "bahub",
            "TIMEOUT": 300,  # 5 minutes default
        }
    }
else:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels.layers.InMemoryChannelLayer",
        },
    }
    # Fallback to local memory cache for development
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "bahub-cache",
        }
    }

SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SECURE_SSL_REDIRECT = os.getenv("SECURE_SSL_REDIRECT", "False").lower() in ("true", "1", "yes")
SECURE_HSTS_SECONDS = int(os.getenv("SECURE_HSTS_SECONDS", "0" if DEBUG else "31536000"))
SECURE_HSTS_INCLUDE_SUBDOMAINS = not DEBUG
SECURE_HSTS_PRELOAD = not DEBUG


# Database
# https://docs.djangoproject.com/en/stable/ref/settings/#databases

import sys
IS_TESTING = "test" in sys.argv

if IS_TESTING:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": ":memory:",
        }
    }
else:
    db_url = os.getenv("DATABASE_URL", "").strip()
    # Strip literal quotes if they were mistakenly configured in the environment settings
    db_url = db_url.strip('"').strip("'").strip()
    try:
        if not db_url:
            raise ValueError("Empty DATABASE_URL")
        conn_max_age = int(os.getenv("CONN_MAX_AGE", "600"))
        parsed_db = dj_database_url.parse(
            db_url,
            conn_max_age=conn_max_age,
            ssl_require=True if db_url.startswith("postgres") else False
        )
    except ValueError:
        db_url = f"sqlite:///{BASE_DIR / 'db.sqlite3'}"
        parsed_db = dj_database_url.parse(
            db_url,
            conn_max_age=0,
            ssl_require=False
        )
    # Ensure relative SQLite paths always resolve relative to BASE_DIR
    if parsed_db.get("ENGINE") == "django.db.backends.sqlite3" and parsed_db.get("NAME") != ":memory:":
        from pathlib import Path
        db_path = Path(parsed_db["NAME"])
        if not db_path.is_absolute():
            parsed_db["NAME"] = str(BASE_DIR / db_path)

    DATABASES = {
        "default": parsed_db
    }


# Custom User Model
AUTH_USER_MODEL = "users.User"


# Password validation
# https://docs.djangoproject.com/en/stable/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {
            "min_length": 8,
        }
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
    {
        "NAME": "users.validators.EnterprisePasswordValidator",
    },
]


# Internationalization
# https://docs.djangoproject.com/en/stable/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = os.getenv("TIMEZONE", "UTC")

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/stable/howto/static-files/

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# Media files (Invoice PDFs, uploads)
# Note: Using local filesystem storage. For production, consider S3 or similar.
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"


# Default primary key field type
# https://docs.djangoproject.com/en/stable/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# CORS Configurations
CORS_ALLOWED_ORIGINS = [
    origin.strip().rstrip("/") for origin in os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:5173").split(",") if origin.strip()
]
# Ensure standard production and beta Netlify hosts are always allowed
production_origins = ["https://ba-assistant.netlify.app", "https://bahub-beta.netlify.app"]
for origin in production_origins:
    if origin not in CORS_ALLOWED_ORIGINS:
        CORS_ALLOWED_ORIGINS.append(origin)

# Ensure FRONTEND_URL is allowed
frontend_url_env = os.getenv("FRONTEND_URL", "https://bahub-beta.netlify.app")
if frontend_url_env:
    cleaned_frontend = frontend_url_env.strip().rstrip("/")
    if cleaned_frontend not in CORS_ALLOWED_ORIGINS:
        CORS_ALLOWED_ORIGINS.append(cleaned_frontend)

# Ensure other standard local dev ports are allowed in DEBUG mode to prevent port-conflict CORS errors
if DEBUG:
    for port in ["5174", "5175", "5176"]:
        for host in ["localhost", "127.0.0.1"]:
            local_origin = f"http://{host}:{port}"
            if local_origin not in CORS_ALLOWED_ORIGINS:
                CORS_ALLOWED_ORIGINS.append(local_origin)

CORS_ALLOW_CREDENTIALS = True

# CSRF Trusted Origins
CSRF_TRUSTED_ORIGINS = [
    origin for origin in CORS_ALLOWED_ORIGINS if origin.startswith("http")
]


# REST Framework Settings
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_PAGINATION_CLASS": "core.pagination.StandardResultsSetPagination",
    "EXCEPTION_HANDLER": "core.exceptions.custom_exception_handler",
    # Rate limiting — protects login, OTP, and waitlist from brute-force/spam
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
        "rest_framework.throttling.ScopedRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/hour",
        "user": "1000/hour",
        "login": "10/minute",
        "otp": "5/minute",
        "waitlist": "5/minute",
        "ai_chat": "50/hour",
        "workflow_execution": "20/hour",
        "api_write": "200/hour",
        "api_read": "500/hour",
    },
}


# SimpleJWT settings
JWT_ACCESS_LIFETIME_MINUTES = int(os.getenv("JWT_ACCESS_LIFETIME_MINUTES", "60"))
JWT_REFRESH_LIFETIME_DAYS = int(os.getenv("JWT_REFRESH_LIFETIME_DAYS", "7"))

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=JWT_ACCESS_LIFETIME_MINUTES),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=JWT_REFRESH_LIFETIME_DAYS),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": os.getenv("JWT_SECRET_KEY", SECRET_KEY),
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
}


# Central Logging System
# Configure colored logging for development (when DEBUG=True)
if DEBUG:
    import re
    from colorlog import ColoredFormatter

    class CleanColoredFormatter(ColoredFormatter):
        def format(self, record):
            if record.name == "django.server":
                msg = record.getMessage()
                # 1. Match custom runserver format with HTTP prefix and duration/IP:
                # e.g., HTTP GET /api/v1/requirements/?project=a6ed0b03-120a-4559-9172-147284cefc85 200 [0.02, 127.0.0.1:58297]
                match = re.match(r'^(?:HTTP\s+)?([A-Z]+)\s+([^\s?]+)(?:\?[^\s]*)?\s+(\d+)(?:\s+\[.*\])?$', msg)
                if not match:
                    # 2. Match standard Django runserver format:
                    # e.g., "GET /api/v1/projects/ HTTP/1.1" 200 1234
                    match = re.match(r'^"([A-Z]+)\s+([^\s?]+)(?:\?[^\s]*)?\s+HTTP/[0-9.]+"\s+(\d+)\s+\d+', msg)
                
                if match:
                    method, path, status = match.groups()
                    status_color = "\033[37m"  # Default white
                    if status.startswith("2"):
                        status_color = "\033[32m"  # Green
                    elif status.startswith("3"):
                        status_color = "\033[36m"  # Cyan
                    elif status.startswith("4"):
                        status_color = "\033[33m"  # Yellow
                    elif status.startswith("5"):
                        status_color = "\033[31m"  # Red
                    
                    reset = "\033[0m"
                    
                    # Clean message layout: aligned method, path, and colored status code
                    record.msg = f"{method:<6} {path:<50} {status_color}{status}{reset}"
                    record.args = ()
            return super().format(record)

    LOGGING = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            # Standard Django formatters
            "verbose": {
                "format": "{levelname} {asctime} {module} {process:d} {thread:d} {message}",
                "style": "{",
            },
            "simple": {
                "format": "{levelname} {message}",
                "style": "{",
            },
            # Development colored formatter with clean formatting structure
            "colored": {
                "()": "bahub_backend.settings.CleanColoredFormatter",
                "format": "%(log_color)s[%(asctime)s] %(levelname)-8s%(reset)s %(message)s",
                "datefmt": "%H:%M:%S",
                "log_colors": {
                    "DEBUG": "cyan",
                    "INFO": "green",
                    "WARNING": "yellow",
                    "ERROR": "red",
                    "CRITICAL": "bold_red",
                },
            },
        },
        "handlers": {
            # Console handler using the colorlog CleanColoredFormatter
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "colored",
            },
            # Fallback/production file handler to write logs to warning.log
            "file": {
                "level": "WARNING",
                "class": "logging.FileHandler",
                "filename": BASE_DIR / "warning.log",
                "formatter": "verbose",
            },
        },
        "loggers": {
            # Top-level Django logger
            "django": {
                "handlers": ["console", "file"],
                "level": "INFO",
                "propagate": True,
            },
            # Django server logger (logs requests e.g. "GET /api/... 200")
            "django.server": {
                "handlers": ["console"],
                "level": "INFO",
                "propagate": False,
            },
            # Django request logger (logs system warning/errors in requests)
            "django.request": {
                "handlers": ["console", "file"],
                "level": "INFO",
                "propagate": False,
            },
            # Custom application logger
            "bahub.core": {
                "handlers": ["console", "file"],
                "level": "INFO",
                "propagate": True,
            },
        },
    }
else:
    # Production-safe logging structure without requiring colorlog at runtime
    LOGGING = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "verbose": {
                "format": "{levelname} {asctime} {module} {process:d} {thread:d} {message}",
                "style": "{",
            },
            "simple": {
                "format": "{levelname} {message}",
                "style": "{",
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "verbose",
            },
            "file": {
                "level": "WARNING",
                "class": "logging.FileHandler",
                "filename": BASE_DIR / "warning.log",
                "formatter": "verbose",
            },
        },
        "loggers": {
            "django": {
                "handlers": ["console", "file"],
                "level": "INFO",
                "propagate": True,
            },
            "bahub.core": {
                "handlers": ["console", "file"],
                "level": "INFO",
                "propagate": True,
            },
        },
    }

# Stripe Configuration
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", None)
STRIPE_PUBLIC_KEY = os.getenv("STRIPE_PUBLIC_KEY", None)
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", None)
STRIPE_PRICE_PRO = os.getenv("STRIPE_PRICE_PRO", None)
STRIPE_PRICE_ENTERPRISE = os.getenv("STRIPE_PRICE_ENTERPRISE", None)


# ─── Email Configuration ──────────────────────────────────────────────────
# Priority order for EMAIL_BACKEND:
#   1. Explicit EMAIL_BACKEND env var (always wins — set this on Render).
#   2. If EMAIL_HOST_USER is configured → SMTP (works in both dev and prod).
#   3. Fallback to console backend (safe for local dev with no credentials).
#
# IMPORTANT: On Render, set these env vars in the dashboard:
#   EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
#   EMAIL_HOST=smtp.gmail.com
#   EMAIL_PORT=587
#   EMAIL_HOST_USER=bahubofficial@gmail.com
#   EMAIL_HOST_PASSWORD=<your-app-password>
#   EMAIL_USE_TLS=True
#   DEFAULT_FROM_EMAIL=bahubofficial@gmail.com

EMAIL_HOST = os.getenv("EMAIL_HOST", "localhost")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", 587 if os.getenv("EMAIL_USE_TLS", "False").lower() in ("true", "1", "yes") else (465 if os.getenv("EMAIL_USE_SSL", "False").lower() in ("true", "1", "yes") else 25)))
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "").strip()
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "").strip()
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "False").lower() in ("true", "1", "yes")
EMAIL_USE_SSL = os.getenv("EMAIL_USE_SSL", "False").lower() in ("true", "1", "yes")
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "noreply@bahub.com")
SERVER_EMAIL = DEFAULT_FROM_EMAIL

# Auto-select SMTP when credentials are present, console otherwise.
# An explicit EMAIL_BACKEND env var always takes precedence.
_smtp_backend = "django.core.mail.backends.smtp.EmailBackend"
_console_backend = "django.core.mail.backends.console.EmailBackend"
_default_backend = _smtp_backend if EMAIL_HOST_USER else _console_backend
EMAIL_BACKEND = os.getenv("EMAIL_BACKEND", _default_backend)

# Warn if email is misconfigured in production
if not DEBUG and EMAIL_BACKEND == _console_backend:
    import logging
    logger = logging.getLogger("django")
    logger.warning(
        "⚠️ EMAIL MISCONFIGURED IN PRODUCTION: Using console backend. "
        "Emails will NOT be sent. Set EMAIL_HOST_USER and EMAIL_HOST_PASSWORD "
        "environment variables to enable SMTP delivery."
    )



# Enterprise SAML2 / SSO Configuration
SAML2_AUTH = {
    "Metadata": {
        "Remote": ["https://identityprovider.okta.com/metadata/endpoint"],
    },
    "Entity_Id": "https://api.bahub.com/saml2/metadata/",
    "Attribute_Mapping": {
        "email": ("email",),
        "username": ("username",),
        "first_name": ("first_name",),
        "last_name": ("last_name",),
    },
    "Trigger": {
        "CREATE_USER": "billing.sso_auth_utils.provision_user_organization",
    },
    "TRIGGER": {
        "CREATE_USER": "billing.sso_auth_utils.provision_user_organization",
    }
}


# Frontend URL
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://bahub-beta.netlify.app")

# ---------------------------------------------------------------------------
# Demo Account — credentials stored server-side only, never in the JS bundle.
# Set DEMO_USERNAME and DEMO_PASSWORD in Render environment variables.
# If not set, the /auth/demo-login/ endpoint returns 503 (graceful degradation).
# ---------------------------------------------------------------------------
DEMO_USERNAME = os.getenv("DEMO_USERNAME", "")
DEMO_PASSWORD = os.getenv("DEMO_PASSWORD", "")

