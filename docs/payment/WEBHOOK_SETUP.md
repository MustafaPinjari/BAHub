# Razorpay Webhook Setup Guide

This guide explains how to set up and configure Razorpay webhooks for BAHub payment processing.

## Webhook Overview

Webhooks are HTTP callbacks that Razorpay sends to your server when specific payment events occur. BAHub uses webhooks to:

- Update subscription status after successful payments
- Handle failed payments
- Create payment records in the database
- Send receipt emails
- Maintain audit logs
- Trigger business logic based on payment events

## Webhook Endpoint

### BAHub Webhook URL

```
https://YOUR_BACKEND_URL/api/v1/billing/webhook/razorpay/
```

**Examples:**
- Development: `https://abc123.ngrok.io/api/v1/billing/webhook/razorpay/`
- Staging: `https://staging.bahub.ai/api/v1/billing/webhook/razorpay/`
- Production: `https://bahub.ai/api/v1/billing/webhook/razorpay/`

## Webhook Configuration

### Step 1: Access Webhook Settings

1. Log in to your Razorpay Dashboard
2. Navigate to **Settings** → **Webhooks**
3. Click **Add New Webhook**

### Step 2: Configure Webhook

**Webhook Details:**
- **Webhook URL**: Your backend webhook endpoint
- **Webhook Secret**: Auto-generated (copy this for environment variables)
- **Active**: Enable immediately

**Example Configuration:**
```
Webhook URL: https://bahub.ai/api/v1/billing/webhook/razorpay/
Webhook Secret: whsec_abc123xyz789
Active: Yes
```

### Step 3: Select Events

Choose the events you want to monitor:

**Required Events:**
- ✅ `payment.captured` - Payment successfully completed
- ✅ `payment.failed` - Payment failed

**Optional Events (Future):**
- ⬜ `payment.authorized` - Payment authorized
- ⬜ `order.paid` - Order fully paid
- ⬜ `subscription.charged` - Subscription payment successful
- ⬜ `subscription.cancelled` - Subscription cancelled
- ⬜ `subscription.completed` - Subscription completed

### Step 4: Save Configuration

1. Click **Create Webhook**
2. Copy the **Webhook Secret**
3. Add to your environment variables as `RAZORPAY_WEBHOOK_SECRET`

## Webhook Events

### payment.captured

**Trigger:** When a payment is successfully captured

**Payload Structure:**
```json
{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_abc123",
        "order_id": "order_xyz789",
        "amount": 4900,
        "currency": "INR",
        "status": "captured",
        "method": "card",
        "email": "user@example.com",
        "contact": "9876543210"
      }
    }
  },
  "id": "evt_abc123xyz789"
}
```

**BAHub Processing:**
```python
1. Verify webhook signature
2. Extract payment details
3. Fetch order details (to get org_id, plan)
4. Update subscription in database
5. Create payment record
6. Generate invoice PDF
7. Send receipt email
8. Create audit log
```

### payment.failed

**Trigger:** When a payment fails

**Payload Structure:**
```json
{
  "event": "payment.failed",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_abc123",
        "order_id": "order_xyz789",
        "amount": 4900,
        "currency": "INR",
        "status": "failed",
        "error_code": "BAD_REQUEST_ERROR",
        "error_description": "Payment failed",
        "method": "card"
      }
    }
  },
  "id": "evt_abc123xyz789"
}
```

**BAHub Processing:**
```python
1. Verify webhook signature
2. Extract payment details
3. Fetch order details
4. Create audit log with failure reason
5. Optionally notify user
```

## Signature Verification

### Why Signature Verification?

Webhook signatures ensure:
- Webhook is genuinely from Razorpay
- Payload hasn't been tampered with
- Prevents fake payment notifications
- Maintains payment integrity

### Verification Process

**Backend Implementation:**
```python
import hmac
import hashlib

def verify_webhook_signature(payload, signature, secret):
    """
    Verify Razorpay webhook signature
    """
    generated_signature = hmac.new(
        secret.encode('utf-8'),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    # Use timing-safe comparison
    return hmac.compare_digest(generated_signature, signature)
```

**Usage in Webhook Handler:**
```python
def post(self, request):
    payload = request.body
    sig_header = request.META.get('HTTP_X_RAZORPAY_SIGNATURE')
    webhook_secret = getattr(settings, "RAZORPAY_WEBHOOK_SECRET", None)
    
    if not verify_webhook_signature(payload, sig_header, webhook_secret):
        return HttpResponse(status=400)
    
    # Process webhook
    webhook_data = json.loads(payload)
    # ... processing logic
```

## Idempotency Handling

### Why Idempotency?

Razorpay may send the same webhook multiple times:
- Network retries
- Delivery failures
- Manual retries

### Idempotency Implementation

**Database Model:**
```python
class ProcessedWebhookEvent(BaseModel):
    gateway_event_id = models.CharField(max_length=255, unique=True)
    processed_at = models.DateTimeField(auto_now_add=True)
```

**Processing Logic:**
```python
event_id = webhook_data.get('id')

# Check if already processed
if ProcessedWebhookEvent.objects.filter(gateway_event_id=event_id).exists():
    return HttpResponse(status=200)  # Already processed

# Mark as processed
ProcessedWebhookEvent.objects.create(gateway_event_id=event_id)

# Process webhook
# ... processing logic
```

## Webhook Security

### 1. HTTPS Only

Webhooks must use HTTPS:
- Encrypts data in transit
- Prevents man-in-the-middle attacks
- Required by Razorpay

### 2. IP Whitelist (Optional)

Restrict webhook access to Razorpay IPs:
```python
# Razorpay IP ranges (check Razorpay docs for current IPs)
RAZORPAY_IPS = [
    '13.232.199.24',
    '13.232.199.25',
    # Add more IPs as needed
]

def is_razorpay_ip(request):
    client_ip = request.META.get('REMOTE_ADDR')
    return client_ip in RAZORPAY_IPS
```

### 3. Rate Limiting

Prevent webhook abuse:
```python
from django.core.cache import cache

def check_webhook_rate_limit(ip):
    key = f"webhook_rate_limit:{ip}"
    count = cache.get(key, 0)
    
    if count >= 100:  # 100 requests per minute
        return False
    
    cache.set(key, count + 1, 60)
    return True
```

## Webhook Testing

### Test Webhook from Dashboard

1. Navigate to Settings → Webhooks
2. Find your webhook
3. Click "Test Webhook"
4. Select event type
5. View response in your server logs

### Manual Webhook Testing

**Using curl:**
```bash
curl -X POST https://your-backend.com/api/v1/billing/webhook/razorpay/ \
  -H "Content-Type: application/json" \
  -H "X-Razorpay-Signature: generated_signature" \
  -d '{
    "event": "payment.captured",
    "payload": {...},
    "id": "evt_test123"
  }'
```

**Using Python:**
```python
import requests
import hmac
import hashlib

payload = '{"event": "payment.captured", ...}'
signature = hmac.new(
    webhook_secret.encode(),
    payload.encode(),
    hashlib.sha256
).hexdigest()

requests.post(
    'https://your-backend.com/api/v1/billing/webhook/razorpay/',
    headers={
        'Content-Type': 'application/json',
        'X-Razorpay-Signature': signature
    },
    data=payload
)
```

## Webhook Monitoring

### 1. Logging

**Backend Logging:**
```python
logger.info(f"Webhook received: {event_type}")
logger.info(f"Event ID: {event_id}")
logger.info(f"Processing time: {processing_time}")
logger.error(f"Webhook processing failed: {error}")
```

### 2. Metrics to Track

- Webhook delivery rate
- Processing time
- Failure rate
- Signature verification failures
- Duplicate events
- Event types distribution

### 3. Alerting

Set up alerts for:
- High failure rate (>5%)
- Signature verification failures
- Processing delays (>5 seconds)
- Unusual event patterns

## Troubleshooting

### Webhook Not Received

**Symptoms:**
- No webhook events in logs
- Payments not updating in database

**Solutions:**
1. Verify webhook URL is accessible
2. Check firewall allows Razorpay IPs
3. Verify webhook secret matches
4. Check server logs for errors
5. Test webhook from Razorpay dashboard

### Signature Verification Failed

**Symptoms:**
- Webhook rejected with 400 status
- "Signature verification failed" in logs

**Solutions:**
1. Verify webhook secret is correct
2. Check encoding (UTF-8)
3. Ensure payload is not modified
4. Verify signature calculation method
5. Check for whitespace in payload

### Duplicate Events

**Symptoms:**
- Same payment processed multiple times
- Duplicate payment records

**Solutions:**
1. Ensure idempotency handling is working
2. Check ProcessedWebhookEvent table
3. Verify unique constraint on event_id
4. Check webhook retry settings

### Processing Errors

**Symptoms:**
- Webhook received but not processed
- Database errors in logs

**Solutions:**
1. Check database connectivity
2. Verify model fields match payload
3. Check for missing required data
4. Review error logs for specific errors
5. Test webhook processing manually

## Webhook Retries

### Razorpay Retry Policy

Razorpay automatically retries failed webhooks:
- **Retry attempts**: Up to 3 times
- **Retry intervals**: Exponential backoff
- **Retry duration**: Up to 24 hours

### Custom Retry Logic

**Implement Retry Queue:**
```python
from celery import shared_task

@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60
)
def process_webhook_with_retry(self, webhook_data):
    try:
        process_webhook(webhook_data)
    except Exception as exc:
        raise self.retry(exc=exc)
```

## Webhook Best Practices

### 1. Always Verify Signatures

Never skip signature verification, even in development.

### 2. Handle Idempotency

Always check for duplicate events before processing.

### 3. Use HTTPS

Never use HTTP for webhook endpoints in production.

### 4. Log Everything

Log all webhook events for debugging and auditing.

### 5. Monitor Performance

Track webhook processing time and set up alerts.

### 6. Graceful Degradation

If webhook processing fails, don't block the response.

### 7. Test Thoroughly

Test all webhook events before going live.

### 8. Keep Secrets Secure

Never expose webhook secrets in frontend code or logs.

## Webhook Maintenance

### Regular Tasks

**Weekly:**
- Review webhook delivery rates
- Check for failed events
- Monitor processing times

**Monthly:**
- Review webhook logs
- Update IP whitelist if needed
- Test webhook endpoints

**Quarterly:**
- Rotate webhook secrets
- Review security settings
- Update documentation

### Webhook Secret Rotation

**Steps:**
1. Create new webhook with new secret
2. Update environment variables
3. Deploy to production
4. Test new webhook
5. Delete old webhook (after verification)

## Summary

Webhooks are critical for payment processing in BAHub. Proper setup ensures:

- **Reliability**: Automatic payment status updates
- **Security**: Signature verification prevents fraud
- **Integrity**: Idempotency prevents duplicate processing
- **Monitoring**: Comprehensive logging and alerting
- **Compliance**: Audit trail for all payment events

Follow this guide to ensure robust webhook configuration and operation.
