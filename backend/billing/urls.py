from django.conf import settings
from django.urls import path
from .views import (
    SubscriptionDetailView,
    CreateCheckoutSessionView,
    StripeWebhookView,
    MockUpgradeView,
    MockInvoiceListView,
)

urlpatterns = [
    path("subscription/", SubscriptionDetailView.as_view(), name="subscription-detail"),
    path("checkout/", CreateCheckoutSessionView.as_view(), name="create-checkout-session"),
    path("webhook/", StripeWebhookView.as_view(), name="stripe-webhook"),
    path("invoices/", MockInvoiceListView.as_view(), name="billing-invoices"),
]

import sys
IS_TESTING = "test" in sys.argv

# Mock billing only available in local development or testing — never in production.
if settings.DEBUG or IS_TESTING:
    urlpatterns += [
        path("mock-upgrade/", MockUpgradeView.as_view(), name="mock-upgrade"),
    ]
