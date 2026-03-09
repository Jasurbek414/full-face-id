import os
from pathlib import Path
from datetime import timedelta

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

def _read_key(env_var: str, file_name: str) -> str:
    """Read JWT key from env var first, then try reading from a .pem file."""
    value = os.environ.get(env_var, '')
    if value:
        return value.replace('\\n', '\n')
    key_path = BASE_DIR / file_name
    if key_path.exists():
        return key_path.read_text().strip()
    return ''

# Load environment variables from .env
try:
    from dotenv import load_dotenv
    load_dotenv(BASE_DIR / '.env')
except ImportError:
    pass

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'replace-me-with-secure-key')

DEBUG = os.getenv('DJANGO_DEBUG', 'False') == 'True'

ALLOWED_HOSTS = os.getenv('DJANGO_ALLOWED_HOSTS', '').split(',') if os.getenv('DJANGO_ALLOWED_HOSTS') else []

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Application definition
INSTALLED_APPS = [
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    'channels',
    # Local apps
    'apps.core',
    'apps.accounts',
    'apps.companies',
    'apps.subscriptions',
    'apps.roles',
    'apps.superadmin',
    'apps.schedules',
    'apps.attendance',
    'apps.employees',
    'apps.devices',
    'apps.face',
    'apps.notifications',
    'apps.leaves',
    'apps.payroll',
    'apps.reports',
    # Future apps will be added here
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'apps.core.middleware.tenant.TenantMiddleware',
]

ROOT_URLCONF = 'backend_project.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend_project.wsgi.application'

# Database
# Database
if os.getenv('DB_NAME'):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('DB_NAME'),
            'USER': os.getenv('DB_USER'),
            'PASSWORD': os.getenv('DB_PASSWORD'),
            'HOST': os.getenv('DB_HOST', 'db'),
            'PORT': os.getenv('DB_PORT', '5432'),
            'CONN_MAX_AGE': 0,
            'OPTIONS': {'options': '-c timezone=Asia/Tashkent'},
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
LANGUAGE_CODE = 'uz'
TIME_ZONE = 'Asia/Tashkent'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# CORS
CORS_ALLOW_ALL_ORIGINS = True
from corsheaders.defaults import default_headers
CORS_ALLOW_HEADERS = list(default_headers) + [
    "x-company-id",
]

# Redis & Cache
REDIS_URL = os.getenv('REDIS_URL', 'redis://redis:6379/0')
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': REDIS_URL,
        'OPTIONS': {'CLIENT_CLASS': 'django_redis.client.DefaultClient'},
    }
}

# Celery
CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL
CELERY_TIMEZONE = 'Asia/Tashkent'
CELERY_ENABLE_UTC = True

from celery.schedules import crontab
CELERY_BEAT_SCHEDULE = {
    # Check for expired subscriptions every hour
    'auto-block-expired-subscriptions': {
        'task': 'apps.subscriptions.tasks.auto_block_expired',
        'schedule': crontab(minute=0),  # top of every hour
    },
    # Re-check for paid-but-blocked companies every 15 minutes
    'auto-unblock-paid-subscriptions': {
        'task': 'apps.subscriptions.tasks.auto_unblock_paid',
        'schedule': crontab(minute='*/15'),
    },
}

# JWT (Simple JWT)
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'ALGORITHM': 'RS256',
    'SIGNING_KEY': _read_key('JWT_PRIVATE_KEY', 'private.pem'),
    'VERIFYING_KEY': _read_key('JWT_PUBLIC_KEY', 'public.pem'),
    'AUTH_HEADER_TYPES': ('Bearer',),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}
SA_JWT_SECRET = os.getenv('SA_JWT_SECRET', 'sa-secret-replace-me-123')

# MinIO / S3 storage — only enabled when MINIO_ACCESS_KEY is set
if os.getenv('MINIO_ACCESS_KEY'):
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    AWS_ACCESS_KEY_ID = os.getenv('MINIO_ACCESS_KEY')
    AWS_SECRET_ACCESS_KEY = os.getenv('MINIO_SECRET_KEY')
    AWS_STORAGE_BUCKET_NAME = os.getenv('MINIO_BUCKET', 'worktrackpro')
    AWS_S3_ENDPOINT_URL = os.getenv('MINIO_ENDPOINT', 'http://minio:9000')
    AWS_DEFAULT_ACL = 'private'
    AWS_QUERYSTRING_EXPIRE = 900
else:
    # Local filesystem storage for development
    DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'
    MEDIA_URL = '/media/'
    MEDIA_ROOT = BASE_DIR / 'media'

# Custom user model
AUTH_USER_MODEL = 'accounts.User'

# REST Framework defaults
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
}

# Channels
ASGI_APPLICATION = 'backend_project.asgi.application'

def _make_channel_layers():
    """Use Redis if available, otherwise fall back to InMemoryChannelLayer."""
    import socket
    redis_host = os.getenv('REDIS_HOST', '127.0.0.1')
    redis_port = int(os.getenv('REDIS_PORT', 6379))
    try:
        s = socket.create_connection((redis_host, redis_port), timeout=1)
        s.close()
        return {
            'default': {
                'BACKEND': 'channels_redis.core.RedisChannelLayer',
                'CONFIG': {'hosts': [(redis_host, redis_port)]},
            }
        }
    except OSError:
        return {
            'default': {
                'BACKEND': 'channels.layers.InMemoryChannelLayer',
            }
        }

CHANNEL_LAYERS = _make_channel_layers()

# Email (SMTP) configuration
EMAIL_BACKEND = os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True') == 'True'
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', EMAIL_HOST_USER)
EMAIL_OTP_EXPIRE_MINUTES = int(os.getenv('EMAIL_OTP_EXPIRE_MINUTES', 10))

# Custom Authentication Backends
AUTHENTICATION_BACKENDS = [
    'apps.accounts.backends.EmailBackend',
    'django.contrib.auth.backends.ModelBackend',
]
