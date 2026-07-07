# Stripe Payment Integration Guide

This guide explains how to set up Stripe billing for **BAHub 4.0** to enable actual subscription upgrades for Pro and Enterprise plans.

---

## Step 1: Create a Stripe Account
1. Visit [Stripe](https://stripe.com) and register for a developer account.
2. Toggle on the **Test Mode** switch in the top-right corner of your Stripe Dashboard.

---

## Step 2: Retrieve API keys
1. Navigate to **Developers** > **API Keys** on the left menu.
2. Copy your **Secret Key** (`sk_test_...`).
3. Paste this key into your `backend/.env` file under the variable:
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   ```

---

## Step 3: Create Products and Prices
We need products and recurring price plans for the Pro and Enterprise plans. Based on your Stripe Dashboard setup:
1. **BAHub Pro Tier**:
   - Price: `$49.00 USD` recurring monthly.
   - Click on the product in your Stripe Product Catalog, scroll to the Pricing section, and copy the Price API ID (e.g., `price_1...`).
2. **BAHub Enterprise Tier**:
   - Price: `$79.00 USD` recurring monthly.
   - Click on the product in your Stripe Product Catalog, scroll to the Pricing section, and copy the Price API ID (e.g., `price_1...`).
3. Update your `backend/.env` file with these Price IDs:
   ```env
   STRIPE_PRICE_PRO=price_1...
   STRIPE_PRICE_ENTERPRISE=price_1...
   ```

---

## Step 4: Setup Webhook Listener
Webhooks ensure that payment completions upgrade subscriptions asynchronously on the BAHub database.
1. Navigate to **Developers** > **Webhooks** inside Stripe Dashboard.
2. Click **Add Endpoint**.
3. Set the endpoint URL to:
   - For local development: Use a tunneling tool like ngrok to make your local port public (e.g., `https://your-tunnel.ngrok-free.app/api/v1/billing/webhook/stripe/`).
   - For production (Render): `https://bahub-backend.onrender.com/api/v1/billing/webhook/stripe/`.
4. Select the following events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click **Add endpoint** and copy the **Signing Secret** (`whsec_...`).
6. Update your `backend/.env` file with this signing secret:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

---

## Step 5: Test the Integration
1. Restart the Django development server to load the new environment settings.
2. Navigate to the Billing dashboard in the BAHub application, click **Upgrade** under Pro or Enterprise, and check that you are redirected to Stripe's secure Checkout.
3. Use Stripe's canonical test card number `4242 4242 4242 4242` to simulate successful checkouts.
