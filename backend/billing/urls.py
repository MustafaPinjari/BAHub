from django.conf import settings
from django.urls import path
from .views import (
    SubscriptionDetailView,
    CreateCheckoutSessionView,
    StripeWebhookView,
    MockUpgradeView,
    VerifySubscriptionView,
    PaymentHistoryListView,
    DownloadInvoicePDFView,
    BillingAdminDashboardView,
)

urlpatterns = [
    path("subscription/", SubscriptionDetailView.as_view(), name="subscription-detail"),
    path("checkout/", CreateCheckoutSessionView.as_view(), name="create-checkout-session"),
    # Primary webhook endpoint registered in Stripe dashboard
    path("webhook/stripe/", StripeWebhookView.as_view(), name="stripe-webhook"),
    # Legacy alias kept for backwards-compatibility (e.g. existing Stripe configs)
    path("webhook/", StripeWebhookView.as_view(), name="stripe-webhook-legacy"),
    path("invoices/", PaymentHistoryListView.as_view(), name="billing-invoices"),
    path("invoices/<uuid:payment_id>/download/", DownloadInvoicePDFView.as_view(), name="download-invoice"),
    path("admin-dashboard/", BillingAdminDashboardView.as_view(), name="billing-admin-dashboard"),
    path("verify-subscription/", VerifySubscriptionView.as_view(), name="verify-subscription"),
]

import sys
IS_TESTING = "test" in sys.argv

# Mock billing only available in local development or testing — never in production.
if settings.DEBUG or IS_TESTING:
    urlpatterns += [
        path("mock-upgrade/", MockUpgradeView.as_view(), name="mock-upgrade"),
    ]
