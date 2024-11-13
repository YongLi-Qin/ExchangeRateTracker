import requests
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Email Setting
EMAIL = "codeding7@gmail.com"
PASSWORD = "stnx sjjl oucn akku"
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587

# Api Request
API_URL = "https://fx.cmbchina.com/api/v1/fx/rate"

# Receiver
recipients = {
    "elokuuu0321@gmail.com": [
        {"currency": "澳大利亚元 AUD", "threshold": 4.7},
        {"currency": "美元 USD", "threshold": 7.2},
    ],
    "harryqin1999@gmail.com": [
        {"currency": "澳大利亚元 AUD", "threshold": 4.7},
        {"currency": "日元 JPY", "threshold": 0.05},
        {"currency": "美元 USD", "threshold": 7.2},
    ],
}

# 
def check_exchange_rates():
    try:
        response = requests.get(API_URL)
        data = response.json()

        for email, currencies in recipients.items():
            for settings in currencies:
                currency_name = settings["currency"]
                threshold = settings["threshold"]

                # Check rate
                for currency in data['body']:
                    if currency['ccyNbrEng'] == currency_name:
                        rate = float(currency['rtbBid']) / 100
                        print(f"Current {currency_name} to RMB rate: {rate}")

                        
                        if rate < threshold:
                            send_email(email, currency_name, rate, threshold)
                            print(f"Alert email sent to {email} for {currency_name}.")
                        break
    except Exception as e:
        print("Error fetching exchange rates:", e)

# Send email
def send_email(to_email, currency_name, rate, threshold):
    try:
        # Content of email
        subject = f"{currency_name} to RMB Exchange Rate Alert"
        body = f"The current {currency_name} to RMB rate is {rate}, which is below the threshold of {threshold}."
        msg = MIMEMultipart()
        msg['From'] = EMAIL
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        # Use SMTP send email
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(EMAIL, PASSWORD)
        server.sendmail(EMAIL, to_email, msg.as_string())
        server.quit()
        print(f"Email sent to {to_email} for {currency_name}.")
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")


if __name__ == "__main__":
    print("Starting exchange rate check...")
    check_exchange_rates()
