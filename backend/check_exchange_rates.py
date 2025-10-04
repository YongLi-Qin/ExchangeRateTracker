import requests
import smtplib
import json
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Flask, jsonify, request
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore, auth
from functools import wraps

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])  # 允许React开发服务器访问

# Initialize Firebase Admin SDK
try:
    # Check if service account key file exists
    service_account_path = 'firebase-service-account.json'
    if os.path.exists(service_account_path):
        cred = credentials.Certificate(service_account_path)
        firebase_admin.initialize_app(cred)
        print("Firebase Admin SDK initialized with service account")
    else:
        # For production deployment, use default credentials
        firebase_admin.initialize_app()
        print("Firebase Admin SDK initialized with default credentials")

    # Get Firestore database instance
    db = firestore.client()
except Exception as e:
    print(f"Failed to initialize Firebase Admin SDK: {e}")
    db = None

# Email Setting
EMAIL = "codeding7@gmail.com"
PASSWORD = "stnx sjjl oucn akku"
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587

# Api Request
API_URL = "https://fx.cmbchina.com/api/v1/fx/rate"

# File to store user alert settings (fallback when Firebase is not available)
USER_ALERTS_FILE = "user_alerts.json"

# Firestore collection name
ALERTS_COLLECTION = 'userAlerts'

# Authentication middleware
def verify_firebase_token(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Get the authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'success': False, 'error': 'No authorization token provided'}), 401

        try:
            # Extract the token from "Bearer <token>"
            token = auth_header.split(' ')[1] if ' ' in auth_header else auth_header

            # Verify the Firebase ID token
            decoded_token = auth.verify_id_token(token)

            # Add user info to request context
            request.current_user = {
                'uid': decoded_token['uid'],
                'email': decoded_token.get('email', ''),
                'name': decoded_token.get('name', '')
            }

            return f(*args, **kwargs)
        except Exception as e:
            print(f"Token verification failed: {e}")
            return jsonify({'success': False, 'error': 'Invalid authorization token'}), 401

    return decorated_function

# Default recipients (kept for backward compatibility)
default_recipients = {
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

# Firestore-based alert management functions
def get_user_alerts_from_firestore(user_id):
    """Get all alerts for a specific user from Firestore"""
    if not db:
        return []

    try:
        alerts_ref = db.collection(ALERTS_COLLECTION)
        query = alerts_ref.where('userId', '==', user_id).where('isActive', '==', True)
        docs = query.stream()

        alerts = []
        for doc in docs:
            alert_data = doc.to_dict()
            alert_data['id'] = doc.id
            alerts.append(alert_data)

        return alerts
    except Exception as e:
        print(f"Error getting user alerts from Firestore: {e}")
        return []

def add_user_alert_to_firestore(user_id, user_email, currency, threshold):
    """Add a new alert to Firestore"""
    if not db:
        return None

    try:
        alert_data = {
            'userId': user_id,
            'userEmail': user_email,
            'currency': currency,
            'threshold': float(threshold),
            'createdAt': firestore.SERVER_TIMESTAMP,
            'updatedAt': firestore.SERVER_TIMESTAMP,
            'isActive': True
        }

        doc_ref = db.collection(ALERTS_COLLECTION).add(alert_data)
        return {
            'id': doc_ref[1].id,
            **alert_data
        }
    except Exception as e:
        print(f"Error adding alert to Firestore: {e}")
        return None

def delete_user_alert_from_firestore(alert_id):
    """Delete an alert from Firestore"""
    if not db:
        return False

    try:
        db.collection(ALERTS_COLLECTION).document(alert_id).delete()
        return True
    except Exception as e:
        print(f"Error deleting alert from Firestore: {e}")
        return False

def get_all_active_alerts_from_firestore():
    """Get all active alerts from Firestore for email checking"""
    if not db:
        return []

    try:
        alerts_ref = db.collection(ALERTS_COLLECTION)
        query = alerts_ref.where('isActive', '==', True)
        docs = query.stream()

        alerts = []
        for doc in docs:
            alert_data = doc.to_dict()
            alert_data['id'] = doc.id
            alerts.append(alert_data)

        return alerts
    except Exception as e:
        print(f"Error getting all alerts from Firestore: {e}")
        return []

# Legacy functions for JSON file-based alert management (fallback)
def load_user_alerts():
    """Load user alerts from JSON file"""
    if os.path.exists(USER_ALERTS_FILE):
        try:
            with open(USER_ALERTS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading user alerts: {e}")
            return default_recipients
    else:
        return default_recipients

def save_user_alerts(alerts):
    """Save user alerts to JSON file"""
    try:
        with open(USER_ALERTS_FILE, 'w', encoding='utf-8') as f:
            json.dump(alerts, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"Error saving user alerts: {e}")
        return False

def get_recipients():
    """Get current recipients (loads from file)"""
    return load_user_alerts()

#
def check_exchange_rates():
    try:
        response = requests.get(API_URL)
        data = response.json()

        # Get all active alerts from Firestore first, fallback to JSON file
        if db:
            alerts = get_all_active_alerts_from_firestore()
            print(f"Retrieved {len(alerts)} alerts from Firestore")
        else:
            # Fallback to JSON file method
            current_recipients = get_recipients()
            alerts = []
            for email, currencies in current_recipients.items():
                for settings in currencies:
                    alerts.append({
                        'userEmail': email,
                        'currency': settings["currency"],
                        'threshold': settings["threshold"]
                    })
            print(f"Retrieved {len(alerts)} alerts from JSON file (fallback)")

        # Check each alert
        for alert in alerts:
            currency_name = alert["currency"]
            threshold = alert["threshold"]
            user_email = alert["userEmail"]

            # Check rate
            for currency in data['body']:
                if currency['ccyNbrEng'] == currency_name:
                    # Apply correct conversion using ccyExc (exchange unit)
                    ccy_exc = float(currency.get('ccyExc', '1'))
                    rate = float(currency['rtbBid']) / (ccy_exc * 10)
                    print(f"Current {currency_name} to RMB rate: {rate}")

                    if rate < threshold:
                        send_email(user_email, currency_name, rate, threshold)
                        print(f"Alert email sent to {user_email} for {currency_name}.")
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

            # Process exchange rate data - CMB returns rates in different units
            # ccyExc indicates the unit (e.g., "10" means per 10 units of foreign currency)
            ccy_exc = float(currency.get('ccyExc', '1'))  # Default to 1 if not present

            # Get raw rates and convert to per-unit rates
            buy_rate_raw = float(currency['rtbBid'])
            sell_rate_raw = float(currency.get('rthOfr', currency['rtbBid']))

            # Convert to rate per 1 unit of foreign currency
            # CMB returns rates in format: X CNY for ccyExc units of foreign currency
            # Need to divide by ccyExc and then by 10 to get correct rate
            buy_rate = buy_rate_raw / (ccy_exc * 10)
            sell_rate = sell_rate_raw / (ccy_exc * 10)
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

# User Alert Management API endpoints
@app.route('/api/alerts', methods=['GET'])
@verify_firebase_token
def get_user_alerts():
    """Get user-specific alert settings"""
    try:
        user_id = request.current_user['uid']

        # Get alerts from Firestore if available, otherwise fallback to JSON
        if db:
            alerts = get_user_alerts_from_firestore(user_id)
        else:
            # Fallback to JSON file (filter by user email)
            user_email = request.current_user['email']
            all_alerts = load_user_alerts()
            alerts = all_alerts.get(user_email, [])

        return jsonify({'success': True, 'data': alerts})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/alerts', methods=['POST'])
@verify_firebase_token
def add_user_alert():
    """Add or update user alert settings"""
    try:
        data = request.get_json()
        user_id = request.current_user['uid']
        user_email = request.current_user['email']

        # Validate required fields
        currency = data.get('currency', '').strip()
        threshold = data.get('threshold')

        if not currency or threshold is None:
            return jsonify({'success': False, 'error': 'Currency and threshold are required'})

        try:
            threshold = float(threshold)
        except ValueError:
            return jsonify({'success': False, 'error': 'Threshold must be a valid number'})

        if threshold <= 0:
            return jsonify({'success': False, 'error': 'Threshold must be greater than 0'})

        # Use Firestore if available, otherwise fallback to JSON
        if db:
            # Check if alert already exists for this currency
            existing_alerts = get_user_alerts_from_firestore(user_id)
            for alert in existing_alerts:
                if alert['currency'] == currency:
                    # Update existing alert
                    alert_ref = db.collection(ALERTS_COLLECTION).document(alert['id'])
                    alert_ref.update({
                        'threshold': threshold,
                        'updatedAt': firestore.SERVER_TIMESTAMP
                    })
                    return jsonify({
                        'success': True,
                        'message': 'Alert updated successfully',
                        'data': {'currency': currency, 'threshold': threshold}
                    })

            # Add new alert
            result = add_user_alert_to_firestore(user_id, user_email, currency, threshold)
            if result:
                return jsonify({
                    'success': True,
                    'message': 'Alert added successfully',
                    'data': result
                })
            else:
                return jsonify({'success': False, 'error': 'Failed to add alert'})
        else:
            # Fallback to JSON file method
            alerts = load_user_alerts()

            if user_email not in alerts:
                alerts[user_email] = []

            # Check if alert for this currency already exists
            existing_alert = None
            for i, alert in enumerate(alerts[user_email]):
                if alert['currency'] == currency:
                    existing_alert = i
                    break

            # Create new alert object
            new_alert = {'currency': currency, 'threshold': threshold}

            # Update or add alert
            if existing_alert is not None:
                alerts[user_email][existing_alert] = new_alert
                action = 'updated'
            else:
                alerts[user_email].append(new_alert)
                action = 'added'

            # Save to file
            if save_user_alerts(alerts):
                return jsonify({
                    'success': True,
                    'message': f'Alert {action} successfully',
                    'data': {'currency': currency, 'threshold': threshold}
                })
            else:
                return jsonify({'success': False, 'error': 'Failed to save alert settings'})

    except Exception as e:
        return jsonify({'success': False, 'error': f'Server error: {str(e)}'})

@app.route('/api/alerts/<alert_id>', methods=['DELETE'])
@verify_firebase_token
def delete_user_alert(alert_id):
    """Delete a specific user alert"""
    try:
        user_id = request.current_user['uid']

        # Use Firestore if available, otherwise fallback to JSON
        if db:
            # Verify the alert belongs to the current user
            alert_ref = db.collection(ALERTS_COLLECTION).document(alert_id)
            alert_doc = alert_ref.get()

            if not alert_doc.exists:
                return jsonify({'success': False, 'error': 'Alert not found'})

            alert_data = alert_doc.to_dict()
            if alert_data.get('userId') != user_id:
                return jsonify({'success': False, 'error': 'Unauthorized to delete this alert'})

            # Delete the alert
            if delete_user_alert_from_firestore(alert_id):
                return jsonify({'success': True, 'message': 'Alert deleted successfully'})
            else:
                return jsonify({'success': False, 'error': 'Failed to delete alert'})
        else:
            # Fallback to JSON file method - need currency parameter
            currency = request.args.get('currency')
            if not currency:
                return jsonify({'success': False, 'error': 'Currency parameter required for JSON fallback'})

            user_email = request.current_user['email']
            alerts = load_user_alerts()

            if user_email not in alerts:
                return jsonify({'success': False, 'error': 'No alerts found for this user'})

            # Find and remove the alert
            original_count = len(alerts[user_email])
            alerts[user_email] = [alert for alert in alerts[user_email] if alert['currency'] != currency]

            if len(alerts[user_email]) == original_count:
                return jsonify({'success': False, 'error': 'Alert not found'})

            # Remove email entry if no alerts left
            if not alerts[user_email]:
                del alerts[user_email]

            # Save to file
            if save_user_alerts(alerts):
                return jsonify({'success': True, 'message': 'Alert deleted successfully'})
            else:
                return jsonify({'success': False, 'error': 'Failed to save alert settings'})

    except Exception as e:
        return jsonify({'success': False, 'error': f'Server error: {str(e)}'})

@app.route('/api/alerts/check', methods=['POST'])
@verify_firebase_token
def trigger_alert_check():
    """Manually trigger exchange rate check"""
    try:
        check_exchange_rates()
        return jsonify({'success': True, 'message': 'Exchange rate check completed'})
    except Exception as e:
        return jsonify({'success': False, 'error': f'Check failed: {str(e)}'})

if __name__ == "__main__":
    print("Starting exchange rate service...")
    print(f"API URL: {API_URL}")
    app.run(debug=True, host='0.0.0.0', port=5000)
