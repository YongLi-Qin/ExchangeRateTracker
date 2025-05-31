import requests
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])  # 允许React开发服务器访问

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

# API endpoint for exchange rates
@app.route('/api/rates')
def get_exchange_rates():
    try:
        response = requests.get(API_URL)
        response.raise_for_status()  # Check for HTTP errors
        data = response.json()
        
        # Check API return status
        if data.get('returnCode') != 'SUC0000':
            return jsonify({'success': False, 'error': data.get('errorMsg', 'API returned error')})
        
        rates = []
        for currency in data['body']:
            # Extract currency code (extract "USD" from "美元 USD")
            currency_eng = currency['ccyNbrEng']
            currency_code = currency_eng.split()[-1] if ' ' in currency_eng else currency_eng
            
            # Process exchange rate data (already in correct format, no need to divide by 100)
            buy_rate = float(currency['rtbBid'])
            sell_rate = float(currency.get('rthOfr', currency['rtbBid']))  # Use cash selling rate
            mid_rate = (buy_rate + sell_rate) / 2
            
            rates.append({
                'currency': currency_code,
                # Remove Chinese name from API response
                'rate': mid_rate,
                'buyRate': buy_rate,
                'sellRate': sell_rate,
                'updateTime': currency.get('ratTim', ''),
                'updateDate': currency.get('ratDat', '')
            })
        
        return jsonify({'success': True, 'data': rates})
        
    except requests.exceptions.RequestException as e:
        return jsonify({'success': False, 'error': f'Network request failed: {str(e)}'})
    except Exception as e:
        return jsonify({'success': False, 'error': f'Data processing failed: {str(e)}'})

@app.route('/api/test')
def test_api():
    """Test endpoint that returns raw API data"""
    try:
        response = requests.get(API_URL)
        return response.json()
    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == "__main__":
    print("Starting exchange rate service...")
    print(f"API URL: {API_URL}")
    app.run(debug=True, host='0.0.0.0', port=5000)
