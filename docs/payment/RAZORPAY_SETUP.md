# Razorpay Setup Guide for BAHub

This guide will walk you through setting up Razorpay as the payment gateway for BAHub.

## 1. Create Razorpay Account

### Sign Up Process

1. Visit [Razorpay](https://razorpay.com) and click "Sign Up"
2. Choose your business type:
   - **Individual**: For freelancers, consultants, or sole proprietors
   - **Partnership**: For partnership firms
   - **Private Limited**: For registered companies
   - **Public Limited**: For publicly traded companies

3. Fill in the required information:
   - Business name
   - Business type
   - Contact details
   - PAN card information
   - Bank account details

4. Verify your email address and phone number

### KYC Completion

To activate your Razorpay account, you must complete KYC (Know Your Customer) verification:

**Required Documents:**
- PAN Card (mandatory)
- Aadhaar Card or Passport (for identity verification)
- Business Registration Certificate (for companies)
- GST Certificate (if applicable)
- Cancelled cheque or bank statement (for bank account verification)

**Steps:**
1. Log in to your Razorpay Dashboard
2. Navigate to Settings → Company Profile
3. Upload all required documents
4. Wait for verification (typically 1-3 business days)

## 2. Generate API Keys

### Access API Keys

1. Log in to your Razorpay Dashboard
2. Navigate to **Settings** → **API Keys**
3. You will see two sets of keys:
   - **Test Mode Keys**: For development and testing
   - **Live Mode Keys**: For production use

### Key Types

**Key ID (rzp_test_xxxxxxxxx or rzp_live_xxxxxxxxx)**
- Public key used on the frontend
- Can be safely exposed in client-side code
- Used to initialize Razorpay checkout

**Key Secret**
- Private key used on the backend
- Never expose this in frontend code
- Used for server-side API calls and signature verification

### Generate New Keys

1. Click "Generate Key" for the desired mode (Test/Live)
2. Copy the Key ID and Key Secret
3. Store them securely in your environment variables
4. Never commit secrets to version control

## 3. Test Mode vs Live Mode

### Test Mode

- **Purpose**: Development and testing
- **Currency**: INR only
- **No real money**: Transactions are simulated
- **Test cards**: Use Razorpay's test card numbers
- **Webhook testing**: Test webhooks can be triggered manually

### Live Mode

- **Purpose**: Production transactions
- **Currency**: Multiple currencies supported
- **Real money**: Actual customer payments
- **Bank integration**: Connected to real payment gateways
- **Live webhooks**: Real-time payment notifications

### Switching Modes

1. In Razorpay Dashboard, click the mode toggle (Test/Live)
2. Ensure you're using the corresponding API keys
3. Update your environment variables accordingly
4. Test thoroughly before going live

## 4. Webhook Setup

### Create Webhook Endpoint

1. Navigate to **Settings** → **Webhooks** in Razorpay Dashboard
2. Click "Add New Webhook"
3. Enter your webhook URL:
   ```
   https://YOUR_BACKEND_URL/api/v1/billing/webhook/razorpay/
   ```
4. Set webhook secret (copy this for environment variables)

### Configure Webhook Events

Select the following events to monitor:

**Payment Events:**
- `payment.captured` - Payment successfully completed
- `payment.failed` - Payment failed
- `payment.authorized` - Payment authorized (for certain payment methods)

**Order Events:**
- `order.paid` - Order fully paid

**Subscription Events (Future):**
- `subscription.charged` - Subscription payment successful
- `subscription.cancelled` - Subscription cancelled
- `subscription.completed` - Subscription completed

### Webhook Secret

- Copy the webhook secret from Razorpay Dashboard
- Add to your environment variables as `RAZORPAY_WEBHOOK_SECRET`
- Used for signature verification to ensure webhook authenticity

## 5. Environment Variables

Add the following variables to your `.env` file:

```bash
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_key_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here

# Application Base URL (for redirects)
APP_BASE_URL=https://bahub.ai
```

### Environment-Specific Configuration

**Development (.env):**
```bash
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxx
RAZORPAY_KEY_SECRET=test_secret_key
RAZORPAY_WEBHOOK_SECRET=test_webhook_secret
```

**Production:**
```bash
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxx
RAZORPAY_KEY_SECRET=live_secret_key
RAZORPAY_WEBHOOK_SECRET=live_webhook_secret
```

## 6. Local Development

### Running Locally

1. Ensure Razorpay is in Test Mode
2. Use test API keys in your `.env` file
3. Start your backend server:
   ```bash
   cd backend
   python manage.py runserver
   ```
4. Start your frontend server:
   ```bash
   cd frontend
   npm run dev
   ```

### Testing Payments Locally

1. Navigate to the billing page in your local frontend
2. Click "Upgrade Workspace" for PRO or ENTERPRISE plan
3. Complete the payment using test card details
4. Verify payment is processed successfully
5. Check database for payment records

### Local Webhook Testing

For local development, use a webhook tunnel service:

**Using ngrok:**
```bash
ngrok http 8000
```

1. Copy the ngrok URL
2. Update webhook URL in Razorpay Dashboard
3. Test webhook events manually from Razorpay Dashboard

## 7. Test Cards

### Card Testing

Use these test card numbers in Razorpay checkout:

**Successful Payment:**
- Card Number: `4111 1111 1111 1111`
- Expiry: Any future date (e.g., 12/25)
- CVV: Any 3 digits (e.g., 123)
- Name: Any name

**Failed Payment:**
- Card Number: `4111 1111 1111 1111`
- Expiry: Any past date (e.g., 12/20)
- CVV: Any 3 digits

**International Card:**
- Card Number: `4242 4242 4242 4242`
- Expiry: Any future date
- CVV: Any 3 digits

### UPI Testing

**Successful UPI:**
- UPI ID: `success@razorpay`
- Use any UPI app for testing

**Failed UPI:**
- UPI ID: `failure@razorpay`

### NetBanking Testing

**Successful NetBanking:**
- Select any bank from the dropdown
- Use test credentials provided by Razorpay

## 8. Go Live Checklist

### Pre-Launch Requirements

✅ **KYC Complete**
- All documents verified
- Account status: Active

✅ **Website Approved**
- Business website live
- Privacy Policy page
- Terms of Service page
- Refund Policy page
- Contact page with valid information

✅ **Pricing Configuration**
- Live API keys configured
- Pricing plans set correctly
- Currency conversion rates verified

✅ **Webhook Configuration**
- Production webhook URL configured
- Webhook secret stored securely
- All required events enabled

✅ **Security**
- SSL certificate installed
- HTTPS enabled
- Environment variables secured
- No hardcoded secrets

✅ **Testing**
- All payment flows tested
- Webhook events verified
- Error handling tested
- Edge cases covered

### Launch Steps

1. **Switch to Live Mode**
   - Toggle to Live mode in Razorpay Dashboard
   - Update environment variables with live keys
   - Deploy to production

2. **Verify Integration**
   - Make a small test payment
   - Check payment status in dashboard
   - Verify webhook received
   - Confirm database updated

3. **Monitor Transactions**
   - Set up payment notifications
   - Monitor failed payments
   - Track refund requests
   - Review settlement reports

### Post-Launch

- Monitor payment success rates
- Set up alerts for failed payments
- Regular webhook health checks
- Keep Razorpay SDK updated
- Review settlement cycles

## Troubleshooting

### Common Issues

**Webhook Not Received:**
- Check webhook URL is accessible
- Verify webhook secret matches
- Check server logs for errors
- Ensure firewall allows Razorpay IPs

**Payment Failing:**
- Verify API keys are correct
- Check order amount and currency
- Ensure test mode matches key type
- Review Razorpay dashboard for errors

**Signature Verification Failed:**
- Verify webhook secret is correct
- Check signature calculation method
- Ensure payload is not modified
- Check encoding (UTF-8)

### Support

- Razorpay Documentation: https://razorpay.com/docs/
- Razorpay Support: support@razorpay.com
- BAHub Documentation: See other docs in this directory
