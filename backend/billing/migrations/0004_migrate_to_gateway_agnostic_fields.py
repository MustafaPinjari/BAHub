# Generated migration for Razorpay migration

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('billing', '0003_processedwebhookevent_tenantsubscription_expires_at_and_more'),
    ]

    operations = [
        # Rename stripe_customer_id to gateway_customer_id
        migrations.RenameField(
            model_name='tenantsubscription',
            old_name='stripe_customer_id',
            new_name='gateway_customer_id',
        ),
        # Rename stripe_subscription_id to gateway_subscription_id
        migrations.RenameField(
            model_name='tenantsubscription',
            old_name='stripe_subscription_id',
            new_name='gateway_subscription_id',
        ),
        # Rename stripe_payment_intent to gateway_payment_id
        migrations.RenameField(
            model_name='payment',
            old_name='stripe_payment_intent',
            new_name='gateway_payment_id',
        ),
        # Rename stripe_invoice to gateway_invoice_id
        migrations.RenameField(
            model_name='payment',
            old_name='stripe_invoice',
            new_name='gateway_invoice_id',
        ),
        # Rename checkout_session to gateway_order_id
        migrations.RenameField(
            model_name='payment',
            old_name='checkout_session',
            new_name='gateway_order_id',
        ),
        # Rename stripe_event_id to gateway_event_id
        migrations.RenameField(
            model_name='processedwebhookevent',
            old_name='stripe_event_id',
            new_name='gateway_event_id',
        ),
    ]
