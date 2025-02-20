# Exchange Rate Tracker
This project is an Exchange Rate Alert System that monitors currency 
exchange rates in real-time and sends email alerts when rates fall below a specified threshold. 
It uses a scheduling system to regularly check exchange rates from a specified API and sends notifications 
to designated recipients when the conditions are met.

## Features
- **Real-time exchange rate tracking**: Checks exchange rates periodically based on a configurable interval.
- **Email alerts**: Sends an email to users when an exchange rate drops below their specified threshold.
- **Configurable scheduling and retry mechanism**: The interval for checking exchange rates and the maximum retry attempts are configurable through environment variables.
- **Error handling**: Logs HTTP request errors and attempts retries with a limit on retries to prevent infinite loops.

## Requirements
To run this project, you need the following Python libraries:
- `requests`: For making HTTP requests to the exchange rate API.
- `smtplib`: To handle email sending via SMTP.
- `schedule`: For scheduling periodic tasks.
- `python-dotenv`: For loading configuration values from an `.env` file.


You can install these dependencies using pip:

```bash
pip install requests schedule python-dotenv
```

## Set Up
1. **Clone the repository:**

   ```plaintext
   git clone <repository-url>
   cd <repository-folder>
2. **Set up environment variables:**

   Create a `.env` file in the project directory with the following values:

   ```plaintext
   EMAIL_ADDRESS="your_email@gmail.com"
   EMAIL_PASSWORD="your_email_password"
   SCHEDULE_INTERVAL=10
   MAX_RETRIES=5

3. **Configure recipients and thresholds:**

   Edit the `recipients` dictionary in `main.py` to set the recipients and their preferred currencies and thresholds, for example:

   ```python
   recipients = {
       "example1@gmail.com": {
           "method": "email",
           "contact": "example1@gmail.com",
           "alerts": [
               {"currency": "AUD", "threshold": 4.75},
               {"currency": "USD", "threshold": 7.2}
           ]
       }
   }

 4. **Run the program**
    Start the program by running:
    ```bash
    python main.py

## Usage




fff
f


fffff

// TODO add usage here
    


   






