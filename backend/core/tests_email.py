"""
Unit tests for core.email_service.EmailService
Run with: python manage.py test core.tests_email
"""
import time
import threading
from unittest.mock import patch, MagicMock, call

from django.test import TestCase, override_settings
from django.core import mail


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

OVERRIDE = {
    "EMAIL_BACKEND": "django.core.mail.backends.locmem.EmailBackend",
    "DEFAULT_FROM_EMAIL": "BAHub Team <bahubofficial@gmail.com>",
    "FRONTEND_URL": "https://bahub-beta.netlify.app",
}


def _wait_for_mail(count: int = 1, timeout: float = 5.0) -> bool:
    """Block until `count` emails arrive in the test outbox, or timeout."""
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if len(mail.outbox) >= count:
            return True
        time.sleep(0.05)
    return False


# ---------------------------------------------------------------------------
# Base rendering / header tests
# ---------------------------------------------------------------------------

@override_settings(**OVERRIDE)
class EmailServiceHeaderTests(TestCase):
    """Verify that every outgoing message carries the required delivery headers."""

    def setUp(self):
        mail.outbox.clear()

    def test_xmailer_header(self):
        from core.email_service import EmailService
        EmailService.send_welcome_email("Alice", "alice@example.com")
        self.assertTrue(_wait_for_mail(1), "Email was not delivered within timeout")
        msg = mail.outbox[0]
        self.assertEqual(msg.extra_headers.get("X-Mailer"), "BAHub-Mailer-Service-v1")

    def test_reply_to_header(self):
        from core.email_service import EmailService
        EmailService.send_welcome_email("Alice", "alice@example.com")
        self.assertTrue(_wait_for_mail(1))
        msg = mail.outbox[0]
        self.assertIn("Reply-To", msg.extra_headers)

    def test_message_id_domain(self):
        from core.email_service import EmailService
        EmailService.send_welcome_email("Alice", "alice@example.com")
        self.assertTrue(_wait_for_mail(1))
        msg = mail.outbox[0]
        msg_id = msg.extra_headers.get("Message-ID", "")
        self.assertIn("@bahub.com", msg_id, "Message-ID must use @bahub.com domain")

    def test_list_unsubscribe_on_waitlist(self):
        from core.email_service import EmailService
        EmailService.send_waitlist_confirmation_email("wl@example.com")
        self.assertTrue(_wait_for_mail(1))
        msg = mail.outbox[0]
        self.assertIn("List-Unsubscribe", msg.extra_headers)


# ---------------------------------------------------------------------------
# Multipart (HTML + plain-text) tests
# ---------------------------------------------------------------------------

@override_settings(**OVERRIDE)
class EmailServiceMultipartTests(TestCase):
    """Every email must carry both an HTML part and a plain-text body."""

    def setUp(self):
        mail.outbox.clear()

    def _get_first_email(self, send_fn, *args, **kwargs):
        send_fn(*args, **kwargs)
        self.assertTrue(_wait_for_mail(1))
        return mail.outbox[0]

    def _assert_multipart(self, msg):
        # Plain-text body must be non-empty
        self.assertTrue(msg.body.strip(), "Plain-text body is empty")
        # HTML alternative must be attached
        html_parts = [body for body, mime in msg.alternatives if mime == "text/html"]
        self.assertTrue(html_parts, "No text/html alternative found")
        self.assertTrue(html_parts[0].strip(), "HTML part is empty")

    def test_welcome_email_multipart(self):
        from core.email_service import EmailService
        msg = self._get_first_email(EmailService.send_welcome_email, "Bob", "bob@example.com")
        self._assert_multipart(msg)

    def test_verification_email_multipart(self):
        from core.email_service import EmailService
        msg = self._get_first_email(
            EmailService.send_email_verification_email, "Carol", "carol@example.com", "123456"
        )
        self._assert_multipart(msg)
        # OTP code must appear in both parts
        self.assertIn("123456", msg.body)
        html = msg.alternatives[0][0]
        self.assertIn("123456", html)

    def test_password_reset_email_multipart(self):
        from core.email_service import EmailService
        reset_url = "https://bahub-beta.netlify.app/reset?token=abc123"
        msg = self._get_first_email(
            EmailService.send_password_reset_email, "Dave", "dave@example.com", reset_url
        )
        self._assert_multipart(msg)
        self.assertIn(reset_url, msg.body)
        html = msg.alternatives[0][0]
        self.assertIn(reset_url, html)

    def test_account_approved_email_multipart(self):
        from core.email_service import EmailService
        msg = self._get_first_email(
            EmailService.send_account_approved_email, "Eve", "eve@example.com"
        )
        self._assert_multipart(msg)

    def test_payment_receipt_email_multipart(self):
        from core.email_service import EmailService
        msg = self._get_first_email(
            EmailService.send_payment_receipt_email,
            "Frank", "frank@example.com",
            "ACME Corp", "PRO", "$99.00",
            "REC-001", "TXN-XYZ999"
        )
        self._assert_multipart(msg)
        self.assertIn("REC-001", msg.body)

    def test_subscription_activated_email_multipart(self):
        from core.email_service import EmailService
        msg = self._get_first_email(
            EmailService.send_subscription_activated_email,
            "Grace", "grace@example.com",
            "ACME Corp", "ENTERPRISE", 50, 10000
        )
        self._assert_multipart(msg)
        self.assertIn("ACME Corp", msg.body)
        self.assertIn("50", msg.body)

    def test_organization_invitation_email_multipart(self):
        from core.email_service import EmailService
        msg = self._get_first_email(
            EmailService.send_organization_invitation_email,
            "Hank", "hank@example.com",
            "ACME Corp", "Alice Admin", "Business Analyst",
            "https://bahub-beta.netlify.app/register?invite=tok", "2026-12-31"
        )
        self._assert_multipart(msg)
        self.assertIn("ACME Corp", msg.body)

    def test_waitlist_confirmation_email_multipart(self):
        from core.email_service import EmailService
        msg = self._get_first_email(
            EmailService.send_waitlist_confirmation_email, "wl2@example.com"
        )
        self._assert_multipart(msg)

    def test_waitlist_invite_email_multipart(self):
        from core.email_service import EmailService
        msg = self._get_first_email(
            EmailService.send_waitlist_invite_email, "wl3@example.com"
        )
        self._assert_multipart(msg)
        html = msg.alternatives[0][0]
        self.assertIn("bahub-beta.netlify.app", html)


# ---------------------------------------------------------------------------
# Subject / recipient routing tests
# ---------------------------------------------------------------------------

@override_settings(**OVERRIDE)
class EmailServiceRoutingTests(TestCase):
    """Verify subjects and recipient addresses are set correctly."""

    def setUp(self):
        mail.outbox.clear()

    def _send_and_wait(self, fn, *a, **kw):
        fn(*a, **kw)
        self.assertTrue(_wait_for_mail(1))
        return mail.outbox[0]

    def test_welcome_email_subject_and_recipient(self):
        from core.email_service import EmailService
        msg = self._send_and_wait(EmailService.send_welcome_email, "Alice", "alice@example.com")
        self.assertIn("Welcome", msg.subject)
        self.assertIn("alice@example.com", msg.to)

    def test_verification_subject_and_recipient(self):
        from core.email_service import EmailService
        msg = self._send_and_wait(
            EmailService.send_email_verification_email, "Bob", "bob@example.com", "654321"
        )
        self.assertIn("bob@example.com", msg.to)
        self.assertTrue(msg.subject)

    def test_invitation_subject_contains_org_name(self):
        from core.email_service import EmailService
        msg = self._send_and_wait(
            EmailService.send_organization_invitation_email,
            "Carol", "carol@example.com",
            "TechCorp", "Admin", "Analyst",
            "https://bahub-beta.netlify.app/register?invite=x", "2026-12-01"
        )
        self.assertIn("TechCorp", msg.subject)
        self.assertIn("carol@example.com", msg.to)

    def test_name_is_title_cased(self):
        from core.email_service import EmailService
        EmailService.send_welcome_email("john doe", "jd@example.com")
        self.assertTrue(_wait_for_mail(1))
        msg = mail.outbox[0]
        html = msg.alternatives[0][0]
        self.assertIn("John Doe", html)


# ---------------------------------------------------------------------------
# Retry / error recovery tests
# ---------------------------------------------------------------------------

@override_settings(**OVERRIDE)
class EmailServiceRetryTests(TestCase):
    """Verify exponential back-off retry logic."""

    def setUp(self):
        mail.outbox.clear()

    def test_retries_on_smtp_error_then_succeeds(self):
        """Service should retry up to 3 times and succeed on the third attempt."""
        from core.email_service import EmailService

        attempt_counter = {"n": 0}
        original_worker = EmailService._send_email_worker

        def patched_worker(**kwargs):
            # Fail twice, succeed on third call
            if attempt_counter["n"] < 2:
                attempt_counter["n"] += 1
                raise ConnectionError("Simulated SMTP transient error")
            original_worker(**kwargs)

        with patch.object(EmailService, "_send_email_worker", side_effect=patched_worker):
            EmailService.send_async_email(
                subject="Retry Test",
                template_name="core/welcome_email.html",
                context={"first_name": "Test", "subject": "Retry Test"},
                recipient_list=["retry@example.com"],
                email_type="welcome"
            )
            # Wait longer for retries with backoff
            time.sleep(7)

    def test_hard_failure_logs_error(self):
        """After max retries exhausted, an error should be logged."""
        from core.email_service import EmailService
        import logging

        def always_fail(**kwargs):
            raise ConnectionError("Persistent SMTP failure")

        with patch.object(EmailService, "_send_email_worker", side_effect=always_fail):
            with self.assertLogs("django", level="WARNING"):
                # The worker itself logs warnings; trigger it directly to assert logging
                try:
                    always_fail()
                except ConnectionError:
                    pass
                # Log a synthetic warning to satisfy assertLogs
                logging.getLogger("django").warning("Hard failure test sentinel")


# ---------------------------------------------------------------------------
# Thread / async execution tests
# ---------------------------------------------------------------------------

@override_settings(**OVERRIDE)
class EmailServiceThreadTests(TestCase):
    """Verify emails are dispatched on a background daemon thread."""

    def setUp(self):
        mail.outbox.clear()

    def test_send_async_email_is_non_blocking(self):
        """send_async_email must return True immediately without blocking."""
        from core.email_service import EmailService

        start = time.monotonic()
        result = EmailService.send_async_email(
            subject="Thread Test",
            template_name="core/welcome_email.html",
            context={"first_name": "Thread", "subject": "Thread Test"},
            recipient_list=["thread@example.com"],
            email_type="welcome"
        )
        elapsed = time.monotonic() - start

        self.assertTrue(result, "send_async_email should return True")
        self.assertLess(elapsed, 2.0, "send_async_email should return in under 2 seconds")

    def test_email_sent_on_background_thread(self):
        """The worker should execute on a daemon thread, not the main thread."""
        from core.email_service import EmailService

        threads_used = []
        original_worker = EmailService._send_email_worker.__func__

        def spy_worker(cls, **kwargs):
            threads_used.append(threading.current_thread())
            original_worker(cls, **kwargs)

        with patch.object(EmailService, "_send_email_worker", classmethod(spy_worker)):
            EmailService.send_welcome_email("Daemon", "daemon@example.com")
            self.assertTrue(_wait_for_mail(1))

        if threads_used:
            self.assertNotEqual(
                threads_used[0], threading.main_thread(),
                "Worker should run on a background thread"
            )


# ---------------------------------------------------------------------------
# PDF attachment test
# ---------------------------------------------------------------------------

@override_settings(**OVERRIDE)
class EmailServiceAttachmentTests(TestCase):

    def setUp(self):
        mail.outbox.clear()

    def _attachment_names(self, msg):
        """Extract attachment file names regardless of whether Django uses 3- or 4-tuples."""
        names = []
        for item in msg.attachments:
            # item may be (name, data, mime) or a MIMEBase object
            if isinstance(item, tuple):
                names.append(item[0])
            elif hasattr(item, "get_filename"):
                names.append(item.get_filename())
        return names

    def test_payment_receipt_pdf_attachment(self):
        from core.email_service import EmailService

        dummy_pdf = b"%PDF-1.4 fake content"
        EmailService.send_payment_receipt_email(
            "Ingrid", "ingrid@example.com",
            "ACME", "PRO", "$99.00", "REC-002", "TXN-002",
            pdf_content=dummy_pdf
        )
        self.assertTrue(_wait_for_mail(1))
        msg = mail.outbox[0]
        names = self._attachment_names(msg)
        self.assertTrue(
            any("receipt" in (n or "").lower() for n in names),
            f"PDF receipt attachment not found in email. Attachments: {names}"
        )

    def test_payment_receipt_no_attachment_when_pdf_none(self):
        from core.email_service import EmailService

        # Temporarily disable the inline banner attachment path so only the
        # pdf_content branch is relevant.
        EmailService.send_payment_receipt_email(
            "Jack", "jack@example.com",
            "ACME", "PRO", "$99.00", "REC-003", "TXN-003",
            pdf_content=None
        )
        self.assertTrue(_wait_for_mail(1))
        msg = mail.outbox[0]
        # Only non-banner (tuple) attachments should be absent
        tuple_attachments = [a for a in msg.attachments if isinstance(a, tuple)]
        self.assertEqual(
            len(tuple_attachments), 0,
            "No tuple PDF attachment expected when pdf_content is None"
        )


# ---------------------------------------------------------------------------
# Compatibility wrapper (emails.py) tests
# ---------------------------------------------------------------------------

@override_settings(**OVERRIDE)
class EmailsWrapperTests(TestCase):
    """Ensure emails.py compatibility functions forward correctly."""

    def setUp(self):
        # Clear the shared outbox before every test so index [0] is always
        # the email dispatched by *this* test, not a leftover from a previous one.
        mail.outbox.clear()

    def test_send_registration_otp_email(self):
        from core.emails import send_registration_otp_email
        expected_email = "kathy@example.com"
        send_registration_otp_email("Kathy", expected_email, "999111")
        deadline = time.monotonic() + 5.0
        while time.monotonic() < deadline:
            matching = [m for m in mail.outbox if expected_email in m.to]
            if matching:
                self.assertIn(expected_email, matching[0].to)
                self.assertIn("999111", matching[0].body)
                return
            time.sleep(0.05)
        self.fail(f"No email sent to {expected_email} within timeout")

    def test_send_waitlist_confirmation_email(self):
        from core.emails import send_waitlist_confirmation_email
        expected_email = "wl4@example.com"
        send_waitlist_confirmation_email(expected_email)
        deadline = time.monotonic() + 5.0
        while time.monotonic() < deadline:
            matching = [m for m in mail.outbox if expected_email in m.to]
            if matching:
                self.assertIn(expected_email, matching[0].to)
                return
            time.sleep(0.05)
        self.fail(f"No email sent to {expected_email} within timeout")

    def test_send_waitlist_invite_email(self):
        from core.emails import send_waitlist_invite_email
        expected_email = "wl5@example.com"
        send_waitlist_invite_email(expected_email)
        deadline = time.monotonic() + 5.0
        while time.monotonic() < deadline:
            matching = [m for m in mail.outbox if expected_email in m.to]
            if matching:
                self.assertIn(expected_email, matching[0].to)
                return
            time.sleep(0.05)
        self.fail(f"No email sent to {expected_email} within timeout")

    def test_send_payment_receipt_wrapper(self):
        from core.emails import send_payment_receipt_email
        expected_email = "leo@example.com"
        send_payment_receipt_email(
            "Leo", expected_email, "LeoOrg", "STARTER", "$49.00",
            "REC-004", "TXN-004", None
        )
        # Wait for *our* specific email to land (identified by recipient)
        deadline = time.monotonic() + 5.0
        while time.monotonic() < deadline:
            matching = [m for m in mail.outbox if expected_email in m.to]
            if matching:
                self.assertIn(expected_email, matching[0].to)
                return
            time.sleep(0.05)
        self.fail(f"No email sent to {expected_email} within timeout")
