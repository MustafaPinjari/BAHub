import smtplib, sys

try:
    s = smtplib.SMTP('smtp.gmail.com', 587, timeout=10)
    s.ehlo()
    s.starttls()
    s.ehlo()
    code, msg = s.login('bahubofficial@gmail.com', 'bihtopuglbijihlr')
    print(f"LOGIN OK: {code} {msg}")
    s.quit()
except smtplib.SMTPAuthenticationError as e:
    print(f"AUTH FAIL: {e.smtp_code} {e.smtp_error}")
except Exception as e:
    print(f"ERROR: {type(e).__name__}: {e}")
