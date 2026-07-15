from django.conf import settings
from django.urls import path
from .views import (
    SubscriptionDetailView,
    CreateCheckoutSessionView,
    RazorpayWebhookView,
    MockUpgradeView,
    VerifySubscriptionView,
    PaymentHistoryListView,
    DownloadInvoicePDFView,
    BillingAdminDashboardView,
)

urlpatterns = [
    path("subscription/", SubscriptionDetailView.as_view(), name="subscription-detail"),
    path("checkout/", CreateCheckoutSessionView.as_view(), name="create-checkout-session"),
    # Primary webhook endpoint registered in Razorpay dashboard
    path("webhook/razorpay/", RazorpayWebhookView.as_view(), name="razorpay-webhook"),
    # Legacy alias kept for backwards-compatibility
    path("webhook/", RazorpayWebhookView.as_view(), name="webhook-legacy"),
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
