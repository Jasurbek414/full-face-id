"""
URL configuration for backend_project project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/companies/', include('apps.companies.urls')),
    path('api/v1/subscriptions/', include('apps.subscriptions.urls')),
    path('api/v1/roles/', include('apps.roles.urls')),
    path('api/v1/schedules/', include('apps.schedules.urls')),
    path('api/v1/attendance/', include('apps.attendance.urls')),
    path('api/v1/employees/', include('apps.employees.urls')),
    path('api/v1/devices/', include('apps.devices.urls')),
    path('api/v1/face/', include('apps.face.urls')),
    path('api/v1/notifications/', include('apps.notifications.urls')),
    path('api/v1/leaves/', include('apps.leaves.urls')),
    path('api/v1/payroll/', include('apps.payroll.urls')),
    path('api/v1/reports/', include('apps.reports.urls')),
    path('_sa/api/', include('apps.superadmin.urls')),
] + static(settings.MEDIA_URL, document_root=getattr(settings, 'MEDIA_ROOT', None))
