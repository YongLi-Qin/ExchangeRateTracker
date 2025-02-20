import schedule
import time
from email_sender import EmailSender
from currency_api import fetch_currency_data  # Importing the fetch_currency_data function
import os


SCHEDULE_INTERVAL = int(os.getenv("SCHEDULE_INTERVAL", 10))


# Define recipients and their preferred notification methods
recipients = {
    "elokuuu0321@gmail.com": {
        "method": "email",
        "contact": "elokuuu0321@gmail.com",
        "alerts": [
            {"currency": "AUD", "threshold": 4.75},
            {"currency": "USD", "threshold": 7.2}
        ]
    },
    "harryqin1999@gmail.com": {
        "method": "email",
        "contact": "harryqin1999@gmail.com",
        "alerts": [
            {"currency": "USD", "threshold": 7.2},
            {"currency": "JPY", "threshold": 0.05}
        ]
    }
}

def send_alert(notification_method, recipient, subject, message):
    notification_method.send_notification(recipient, subject, message)

def check_exchange_rates():
    print("Checking exchange rates...")  # Print statement to show the function is running
    currencies = fetch_currency_data()  # Now properly defined and imported
    if currencies is None:
        print("Skipping exchange rate check due to data fetch failure.")
        return  # Exit if data could not be fetched
    for recipient_info in recipients.values():
        contact = recipient_info['contact']
        method = recipient_info['method']

        # Choose the notification method
        if method == "email":
            notification_method = EmailSender()
        else:
            print(f"Unknown method {method} for {contact}")
            continue

        for alert in recipient_info['alerts']:
            currency_name = alert['currency']
            threshold = alert['threshold']
            currency = next((c for c in currencies if c.name == currency_name), None)

            if currency and currency.rate < threshold:
                subject = f"{currency_name} to RMB Exchange Rate Alert"
                message = f"The current {currency_name} to RMB rate is {currency.rate}, which is below the threshold of {threshold}."
                send_alert(notification_method, contact, subject, message)
                print(f"Alert sent to {contact} for {currency_name} at threshold {threshold}.")
        print("")

# Schedule the check_exchange_rates function to run every 10 minutes
schedule.every(10).minutes.do(check_exchange_rates)

# Run scheduled tasks
# Initial test run of check_exchange_rates
if __name__ == "__main__":
    print("Testing exchange rate check directly...")
    check_exchange_rates()  # Run once immediately for testing

    # Schedule the check_exchange_rates function every 10 seconds for testing
    schedule.every(10).seconds.do(check_exchange_rates)

    # Run scheduled tasks
    print("\n" + "="*40 + "\n")
    print("Starting scheduled exchange rate checks...")
    while True:
        schedule.run_pending()
        time.sleep(1)