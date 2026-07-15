# Testing Payments in BAHub

This guide explains how to test payment flows in BAHub using Razorpay.

## Testing Overview

BAHub supports two testing modes:
1. **Mock Billing** - For development without real payment processing
2. **Razorpay Test Mode** - For testing with Razorpay's test environment

## Mock Billing (Development)

### When to Use Mock Billing

- Local development without Razorpay credentials
- Testing UI flows without payment processing
- CI/CD pipelines
- Quick prototyping

### Enabling Mock Billing

Mock billing is automatically enabled when:
- Django DEBUG mode is True
- Razorpay API keys are not configured
- Running tests (`test` in sys.argv)

### Mock Billing Flow

1. User clicks "Upgrade Workspace"
2. Frontend calls `/api/v1/billing/checkout/`
3. Backend detects missing Razorpay configuration
4. Returns mock checkout URL
5. User is redirected to mock upgrade endpoint
6. Subscription is upgraded without payment
7. Verification email is sent to admins

### Testing Mock Billing

**Manual Testing:**
```bash
# Start backend in DEBUG mode
cd backend
python manage.py runserver

# Start frontend
cd frontend
npm run dev

# Navigate to billing page
# Click upgrade button
# You'll be redirected to mock upgrade
# Check database for subscription update
```

**API Testing:**
```bash
# Create mock upgrade
curl -X GET "http://localhost:8000/api/v1/billing/mock-upgrade/?plan=PRO&org_id=your_org_id&redirect_uri=http://localhost:5173"
```

## Razorpay Test Mode

### When to Use Test Mode

- Testing real payment flows
- Testing webhook integration
- Pre-production validation
- End-to-end testing

### Test Mode Setup

1. Log in to Razorpay Dashboard
2. Ensure Test Mode is enabled
3. Copy test API keys
4. Add to environment variables:
```bash
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxx
RAZORPAY_KEY_SECRET=test_secret_key
RAZORPAY_WEBHOOK_SECRET=test_webhook_secret
```

### Test Cards

#### Successful Payment Cards

**Visa Card:**
```
Card Number: 4111 1111 1111 1111
Expiry: Any future date (e.g., 12/25)
CVV: Any 3 digits (e.g., 123)
Name: Any name
```

**MasterCard:**
```
Card Number: 5555 5555 5555 4444
Expiry: Any future date
CVV: Any 3 digits
Name: Any name
```

**Amex:**
```
Card Number: 3714 49635398431
Expiry: Any future date
CVV: Any 4 digits
Name: Any name
```

#### Failed Payment Cards

**Expired Card:**
```
Card Number: 4111 1111 1111 1111
Expiry: Any past date (e.g., 12/20)
CVV: Any 3 digits
```

**Insufficient Funds:**
```
Card Number: 4111 1111 1111 1111
Expiry: Any future date
CVV: Any 3 digits
Amount: More than available balance
```

### UPI Testing

#### Successful UPI
```
UPI ID: success@razorpay
```

#### Failed UPI
```
UPI ID: failure@razorpay
```

#### Pending UPI
```
UPI ID: pending@razorpay
```

### NetBanking Testing

1. Select NetBanking as payment method
2. Choose any bank from dropdown
3. Use test credentials provided by Razorpay
4. Complete the payment flow

## Testing Scenarios

### 1. Successful Payment Flow

**Steps:**
1. Navigate to billing page
2. Click "Upgrade Workspace" for PRO plan
3. Complete payment with test card
4. Verify payment success message
5. Check database for subscription update
6. Verify receipt email received

**Expected Results:**
- Payment status: SUCCESS
- Subscription: PRO plan
- Seats limit: 20
- AI credits: 1000
- Payment record created
- Invoice PDF generated
- Receipt email sent

**Verification:**
```python
# Check database
sub = TenantSubscription.objects.get(organization=org)
assert sub.plan_tier == "PRO"
assert sub.is_active == True
assert sub.plan_verified == True

# Check payment
payment = Payment.objects.get(subscription=sub)
assert payment.payment_status == "SUCCESS"
assert payment.amount == 49.00
```

### 2. Failed Payment Flow

**Steps:**
1. Navigate to billing page
2. Click "Upgrade Workspace" for ENTERPRISE plan
3. Use expired test card
4. Verify payment failure message
5. Check database (subscription should not upgrade)
6. Check audit log for failure

**Expected Results:**
- Payment status: FAILED
- Subscription: FREE plan (unchanged)
- Payment record created (with failed status)
- Audit log created with failure reason

**Verification:**
```python
# Check subscription unchanged
sub = TenantSubscription.objects.get(organization=org)
assert sub.plan_tier == "FREE"

# Check payment failed
payment = Payment.objects.filter(subscription=sub).last()
assert payment.payment_status == "FAILED"

# Check audit log
audit_log = PaymentAuditLog.objects.filter(organization=org).last()
assert "failed" in audit_log.gateway_response.lower()
```

### 3. Cancelled Payment Flow

**Steps:**
1. Navigate to billing page
2. Click "Upgrade Workspace"
3. Close Razorpay checkout modal
4. Verify cancellation message
5. Check database (subscription unchanged)

**Expected Results:**
- No payment record created
- Subscription unchanged
- Cancellation notification shown

### 4. Duplicate Webhook

**Steps:**
1. Complete a successful payment
2. Manually resend webhook from Razorpay dashboard
3. Verify idempotency handling
4. Check database (no duplicate payment)

**Expected Results:**
- Webhook processed once
- No duplicate payment records
- Idempotency check passed

**Verification:**
```python
# Check webhook event processed once
event_count = ProcessedWebhookEvent.objects.filter(
    gateway_event_id=event_id
).count()
assert event_count == 1

# Check no duplicate payments
payments = Payment.objects.filter(gateway_payment_id=payment_id)
assert payments.count() == 1
```

### 5. Invalid Signature

**Steps:**
1. Send webhook with invalid signature
2. Verify signature verification fails
3. Check webhook rejected (400 status)

**Expected Results:**
- Webhook rejected
- No database changes
- Error logged

**Manual Test:**
```bash
curl -X POST https://your-backend.com/api/v1/billing/webhook/razorpay/ \
  -H "Content-Type: application/json" \
  -H "X-Razorpay-Signature: invalid_signature" \
  -d '{"event": "payment.captured", ...}'
```

### 6. Subscription Upgrade

**Steps:**
1. Start with FREE plan
2. Upgrade to PRO plan
3. Verify limits updated
4. Upgrade to ENTERPRISE plan
5. Verify limits updated again

**Expected Results:**
- FREE → PRO: Seats 5→20, Credits 100→1000
- PRO → ENTERPRISE: Seats 20→1000, Credits 1000→10000

**Verification:**
```python
# After PRO upgrade
assert sub.seats_limit == 20
assert sub.ai_credits_limit == 1000

# After ENTERPRISE upgrade
assert sub.seats_limit == 1000
assert sub.ai_credits_limit == 10000
```

### 7. Subscription Downgrade

**Steps:**
1. Start with ENTERPRISE plan
2. Cancel subscription (via webhook simulation)
3. Verify downgrade to FREE

**Expected Results:**
- Subscription: FREE plan
- Seats limit: 5
- AI credits: 100
- Audit log created

**Webhook Simulation:**
```python
# Simulate subscription cancellation
webhook_data = {
    "event": "subscription.cancelled",
    "payload": {
        "subscription": {
            "entity": {
                "id": sub.gateway_subscription_id
            }
        }
    }
}
# Send to webhook endpoint
```

### 8. Expired Subscription

**Steps:**
1. Create subscription with past expiry date
2. Check subscription status
3. Verify access restrictions

**Expected Results:**
- Subscription expired
- Premium features locked
- Upgrade prompt shown

**Verification:**
```python
# Set expired subscription
sub.expires_at = timezone.now() - timedelta(days=1)
sub.save()

# Check access
assert not sub.is_active
assert sub.plan_tier == "FREE"
```

## Automated Testing

### Unit Tests

**Backend Tests:**
```python
# tests/test_billing.py

class PaymentTests(TestCase):
    def test_create_order(self):
        """Test Razorpay order creation"""
        response = self.client.post('/api/v1/billing/checkout/', {
            'plan': 'PRO'
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn('order_id', response.data)

    def test_verify_payment(self):
        """Test payment verification"""
        response = self.client.post('/api/v1/billing/verify-subscription/', {
            'razorpay_order_id': 'order_test123',
            'razorpay_payment_id': 'pay_test123',
            'razorpay_signature': 'signature_test123',
            'org_id': str(self.org.id),
            'plan': 'PRO'
        })
        self.assertEqual(response.status_code, 200)

    def test_webhook_signature_verification(self):
        """Test webhook signature verification"""
        # Test valid signature
        valid_signature = generate_signature(payload, secret)
        response = self.client.post('/api/v1/billing/webhook/razorpay/',
            data=payload,
            HTTP_X_RAZORPAY_SIGNATURE=valid_signature
        )
        self.assertEqual(response.status_code, 200)

        # Test invalid signature
        invalid_signature = "invalid"
        response = self.client.post('/api/v1/billing/webhook/razorpay/',
            data=payload,
            HTTP_X_RAZORPAY_SIGNATURE=invalid_signature
        )
        self.assertEqual(response.status_code, 400)
```

### Integration Tests

**End-to-End Tests:**
```python
class PaymentIntegrationTests(TestCase):
    def test_full_payment_flow(self):
        """Test complete payment flow"""
        # 1. Create order
        order_response = self.client.post('/api/v1/billing/checkout/', {
            'plan': 'PRO'
        })
        order_id = order_response.data['order_id']

        # 2. Simulate payment (mock Razorpay)
        payment_data = {
            'razorpay_order_id': order_id,
            'razorpay_payment_id': 'pay_test123',
            'razorpay_signature': generate_test_signature(order_id)
        }

        # 3. Verify payment
        verify_response = self.client.post('/api/v1/billing/verify-subscription/', {
            **payment_data,
            'org_id': str(self.org.id),
            'plan': 'PRO'
        })

        # 4. Verify subscription updated
        sub = TenantSubscription.objects.get(organization=self.org)
        self.assertEqual(sub.plan_tier, 'PRO')
        self.assertTrue(sub.is_active)

        # 5. Verify payment record created
        payment = Payment.objects.get(subscription=sub)
        self.assertEqual(payment.payment_status, 'SUCCESS')
```

### Frontend Tests

**React Component Tests:**
```typescript
// BillingPage.test.tsx

describe('BillingPage', () => {
  it('should render upgrade buttons', () => {
    render(<BillingPage />);
    expect(screen.getByText('Upgrade Workspace')).toBeInTheDocument();
  });

  it('should call checkout API on upgrade click', async () => {
    const mockApi = vi.spyOn(api, 'post').mockResolvedValue({
      data: { order_id: 'order123', key_id: 'key123' }
    });

    render(<BillingPage />);
    fireEvent.click(screen.getByText('Upgrade Workspace'));

    expect(mockApi).toHaveBeenCalledWith('/billing/checkout/', {
      plan: 'PRO'
    });
  });

  it('should handle payment success', async () => {
    render(<BillingPage />);
    // Simulate payment success
    // Verify success message shown
    // Verify subscription updated
  });
});
```

## Webhook Testing

### Local Webhook Testing

**Using ngrok:**
```bash
# Start ngrok
ngrok http 8000

# Update webhook URL in Razorpay Dashboard
# Use ngrok URL: https://abc123.ngrok.io/api/v1/billing/webhook/razorpay/

# Test webhook from Razorpay Dashboard
# Monitor local server logs
```

### Webhook Replay

**Razorpay Dashboard:**
1. Navigate to Settings → Webhooks
2. Find your webhook
3. Click "View Events"
4. Select an event
5. Click "Replay"

**Programmatic Replay:**
```python
# Replay webhook manually
webhook_data = {
    "event": "payment.captured",
    "payload": {...},
    "id": "evt_test123"
}

response = requests.post(
    'https://your-backend.com/api/v1/billing/webhook/razorpay/',
    json=webhook_data,
    headers={'X-Razorpay-Signature': generate_signature(webhook_data)}
)
```

## Testing Checklist

### Pre-Deployment Testing

- [ ] Mock billing works in development
- [ ] Test mode payments work correctly
- [ ] Webhook signature verification works
- [ ] Idempotency handling works
- [ ] All payment flows tested
- [ ] Error handling tested
- [ ] Email notifications received
- [ ] Invoice PDFs generated
- [ ] Audit logs created
- [ ] Database constraints enforced

### Production Testing

- [ ] Live mode payments tested (small amount)
- [ ] Live webhooks received
- [ ] Production webhook secret configured
- [ ] SSL certificate valid
- [ ] CORS configured correctly
- [ ] Security headers updated
- [ ] Monitoring and alerting set up
- [ ] Backup and recovery tested

## Common Testing Issues

### Issue: Webhook Not Received in Development

**Cause:** Local server not accessible from internet

**Solution:** Use ngrok or similar tunnel service
```bash
ngrok http 8000
```

### Issue: Signature Verification Fails

**Cause:** Webhook secret mismatch or encoding issue

**Solution:**
- Verify webhook secret matches
- Check UTF-8 encoding
- Ensure payload not modified

### Issue: Test Card Not Working

**Cause:** Using live mode keys with test cards

**Solution:** Ensure test mode is enabled in Razorpay Dashboard

### Issue: Payment Not Updating Database

**Cause:** Webhook processing failed

**Solution:**
- Check server logs for errors
- Verify database connectivity
- Check model fields match payload

## Performance Testing

### Load Testing

**Scenario:** Multiple concurrent payments

**Tool:** Locust

```python
from locust import HttpUser, task, between

class PaymentUser(HttpUser):
    wait_time = between(1, 3)

    @task
    def create_order(self):
        self.client.post("/api/v1/billing/checkout/", {
            "plan": "PRO"
        })

    @task
    def verify_payment(self):
        self.client.post("/api/v1/billing/verify-subscription/", {
            "razorpay_order_id": "order_test",
            "razorpay_payment_id": "pay_test",
            "razorpay_signature": "sig_test",
            "org_id": "test_org",
            "plan": "PRO"
        })
```

**Run Load Test:**
```bash
locust -f load_test.py --host=https://your-backend.com
```

### Webhook Performance

**Metrics to Track:**
- Webhook processing time
- Database query time
- Email sending time
- Total response time

**Target:**
- Processing time < 2 seconds
- Database queries < 100ms
- Email sending < 1 second

## Continuous Integration

### CI Pipeline Testing

**GitHub Actions Example:**
```yaml
name: Payment Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
      - name: Run payment tests
        run: |
          python manage.py test billing.tests
        env:
          RAZORPAY_KEY_ID: test_key
          RAZORPAY_KEY_SECRET: test_secret
          RAZORPAY_WEBHOOK_SECRET: test_webhook_secret
```

## Testing Best Practices

### 1. Test in Isolation

- Use test database
- Mock external dependencies
- Clean up test data

### 2. Test Edge Cases

- Invalid signatures
- Duplicate events
- Network failures
- Timeout scenarios

### 3. Test Security

- Signature verification
- Access control
- SQL injection
- XSS prevention

### 4. Test Performance

- Load testing
- Stress testing
- Database optimization
- Caching effectiveness

### 5. Test User Experience

- Error messages
- Loading states
- Success notifications
- Mobile responsiveness

## Summary

Testing payments in BAHub involves:

- **Mock Billing**: For development without real payments
- **Test Mode**: For testing with Razorpay test environment
- **Automated Tests**: Unit, integration, and E2E tests
- **Webhook Testing**: Signature verification and event processing
- **Performance Testing**: Load and stress testing
- **Security Testing**: Signature verification and access control

Follow this guide to ensure comprehensive payment testing before deployment.
