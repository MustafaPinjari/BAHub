import smtplib

EMAIL = "bahubofficial@gmail.com"
PASSWORD = "bihtopuglbijihlr"

server = smtplib.SMTP("smtp.gmail.com", 587)
server.starttls()
server.login(EMAIL, PASSWORD)
print("Login successful!")
server.quit()