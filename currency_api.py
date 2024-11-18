# currency_api.py
import requests
import time
import os
from typing import List, Optional
from requests.exceptions import RequestException
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

API_URL = "https://fx.cmbchina.com/api/v1/fx/rate"
MAX_RETRIES = int(os.getenv("MAX_RETRIES", 5))  # Load max retries from .env or default to 5

# Define Currency class
class Currency:
    def __init__(self, name: str, rate: float):
        self.name = name
        self.rate = rate

    def __repr__(self):
        return f"Currency(name={self.name}, rate={self.rate})"

# Convert JSON data to list of Currency objects with max retry attempts
def fetch_currency_data(max_retries: int = MAX_RETRIES) -> Optional[List[Currency]]:
    attempt = 0
    while attempt < max_retries:
        try:
            print(f"Fetching currency data from the API (Attempt {attempt + 1}/{max_retries})...")
            response = requests.get(API_URL, timeout=10)
            response.raise_for_status()  # Raise an exception for HTTP errors


            data = response.json()
            print("Data fetched successfully. Converting to Currency objects...")

            # Convert each currency in the JSON body to a Currency object
            currencies = [
                Currency(name=currency['ccyNbrEng'][-3:], rate=float(currency['rthOfr']) / 100)
                for currency in data['body']
            ]

            print("Conversion complete. Retrieved the following currencies:")
            for currency in currencies:
                print(currency)  # Print each Currency object for verification

            return currencies

        except RequestException as e:
            attempt += 1
            print(f"Error fetching exchange rates: {e}. Retrying in 5 seconds...")
            time.sleep(5)

    print("Max retries reached. Could not fetch exchange rate data.")
    return None  # Return None if all attempts fail
