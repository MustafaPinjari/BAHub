# Razorpay Environment Configuration

This document explains how to configure Razorpay environment variables for different environments in BAHub.

## Environment Variables Overview

BAHub requires the following Razorpay-related environment variables:

```bash
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
APP_BASE_URL=https://bahub.ai
```

## Development Environment

### Local Development (.env)

```bash
# Razorpay Test Mode Configuration
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxx
RAZORPAY_KEY_SECRET=test_secret_key_from_razorpay
RAZORPAY_WEBHOOK_SECRET=test_webhook_secret_from_razorpay

# Application URL (for redirects)
APP_BASE_URL=http://localhost:5173
```

### Getting Test Credentials

1. Log in to Razorpay Dashboard
2. Ensure Test Mode is enabled
3. Navigate to Settings → API Keys
4. Copy the Key ID and Key Secret
5. Navigate to Settings → Webhooks
6. Create a test webhook and copy the secret

### Local Webhook Testing

For local development, you'll need to expose your local server to the internet:

**Using ngrok:**
```bash
# Install ngrok
npm install -g ngrok

# Start ngrok tunnel
ngrok http 8000

# Use the provided URL for webhook configuration
# Example: https://abc123.ngrok.io/api/v1/billing/webhook/razorpay/
```

**Using localtunnel:**
```bash
# Install localtunnel
npm install -g localtunnel

# Start tunnel
lt --port 8000

# Use the provided URL for webhook configuration
```

## Staging Environment

### Staging Configuration (.env.staging)

```bash
# Razorpay Test Mode (for staging)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxx
RAZORPAY_KEY_SECRET=staging_test_secret
RAZORPAY_WEBHOOK_SECRET=staging_webhook_secret

# Staging Application URL
APP_BASE_URL=https://staging.bahub.ai
```

### Staging Best Practices

- Use test mode for staging environment
- Separate test credentials from development
- Use staging-specific webhook endpoints
- Monitor webhook delivery in Razorpay dashboard
- Test all payment flows before production deployment

## Production Environment

### Production Configuration (.env.production)

```bash
# Razorpay Live Mode Configuration
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxx
RAZORPAY_KEY_SECRET=live_secret_key_from_razorpay
RAZORPAY_WEBHOOK_SECRET=live_webhook_secret_from_razorpay

# Production Application URL
APP_BASE_URL=https://bahub.ai
```

### Getting Live Credentials

1. Complete KYC verification in Razorpay
2. Switch to Live Mode in Razorpay Dashboard
3. Navigate to Settings → API Keys
4. Generate live API keys
5. Navigate to Settings → Webhooks
6. Create production webhook and copy the secret

### Production Security

**Never commit secrets to version control:**
- Add `.env` to `.gitignore`
- Use environment variable management for deployment
- Rotate secrets if compromised
- Use secret management services (AWS Secrets Manager, etc.)

**Deployment Platforms:**

**Render:**
```bash
# Add environment variables in Render Dashboard
Settings → Environment Variables
```

**AWS:**
```bash
# Use AWS Secrets Manager or Parameter Store
# Reference in deployment configuration
```

**Heroku:**
```bash
heroku config:set RAZORPAY_KEY_ID=rzp_live_xxxxxxxxx
heroku config:set RAZORPAY_KEY_SECRET=your_secret
heroku config:set RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

## Environment Variable Validation

### Backend Validation

The Django backend validates required environment variables on startup:

```python
# In bahub_backend/settings.py
REQUIRED_ENV_VARS = [
    "SECRET_KEY",
    "DATABASE_URL",
]

# Add Razorpay validation
if not all([RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET]):
    raise ImproperlyConfigured("Razorpay credentials not configured")
```

### Frontend Validation

The frontend should gracefully handle missing configuration:

```typescript
// Check if Razorpay is configured
const isRazorpayConfigured = !!import.meta.env.VITE_RAZORPAY_KEY_ID;

if (!isRazorpayConfigured) {
  // Show appropriate error message
  // Disable payment buttons
}
```

## Switching Between Environments

### Development to Staging

1. Update environment variables in staging configuration
2. Deploy to staging environment
3. Test payment flows with test credentials
4. Verify webhook delivery
5. Monitor for any issues

### Staging to Production

1. **Pre-flight checks:**
   - All tests passing
   - KYC completed
   - Live credentials generated
   - Production webhook configured
   - SSL certificate valid

2. **Deployment steps:**
   - Update production environment variables
   - Deploy to production
   - Switch Razorpay to Live Mode
   - Make test payment (small amount)
   - Verify payment processing
   - Monitor webhook events

3. **Post-deployment:**
   - Monitor payment success rates
   - Check webhook delivery
   - Review error logs
   - Be ready to rollback if needed

## Troubleshooting Environment Issues

### Invalid API Keys

**Symptoms:**
- Payment initialization fails
- Webhook signature verification fails
- API calls return 401/403 errors

**Solutions:**
- Verify keys match the mode (test/live)
- Check for typos in environment variables
- Ensure keys are not expired
- Regenerate keys if compromised

### Webhook Not Received

**Symptoms:**
- Payments not updating in database
- No webhook events in logs
- Payment status stuck in pending

**Solutions:**
- Verify webhook URL is accessible
- Check firewall allows Razorpay IPs
- Verify webhook secret matches
- Check server logs for errors
- Test webhook from Razorpay dashboard

### CORS Issues

**Symptoms:**
- Frontend cannot call backend APIs
- Payment initialization blocked
- Webhook verification fails

**Solutions:**
- Add backend URL to CORS_ALLOWED_ORIGINS
- Ensure HTTPS is used in production
- Check Content-Security-Policy headers
- Verify Razorpay domains are allowed

## Security Best Practices

### Secret Management

1. **Never hardcode secrets**
   - Always use environment variables
   - Never commit secrets to git
   - Use secret management services

2. **Rotate secrets regularly**
   - Every 90 days for production
   - Immediately if compromised
   - Update all environments

3. **Principle of least privilege**
   - Use minimal required permissions
   - Separate test and live credentials
   - Restrict API key usage

### Monitoring

1. **Monitor API usage**
   - Track API call rates
   - Monitor failed requests
   - Set up alerts for anomalies

2. **Monitor payment flows**
   - Track success rates
   - Monitor failed payments
   - Alert on unusual patterns

3. **Monitor webhooks**
   - Track delivery rates
   - Monitor processing times
   - Alert on delivery failures

## Environment-Specific Webhooks

### Development Webhook

```
https://your-ngrok-url.ngrok.io/api/v1/billing/webhook/razorpay/
```

### Staging Webhook

```
https://staging.bahub.ai/api/v1/billing/webhook/razorpay/
```

### Production Webhook

```
https://bahub.ai/api/v1/billing/webhook/razorpay/
```

## Summary Checklist

- [ ] Development environment configured with test keys
- [ ] Staging environment configured with test keys
- [ ] Production environment configured with live keys
- [ ] Webhook URLs configured for all environments
- [ ] Webhook secrets stored securely
- [ ] Environment variables validated
- [ ] CORS configured correctly
- [ ] Security headers updated
- [ ] Monitoring and alerting set up
- [ ] Secret rotation schedule established
