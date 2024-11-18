# email_sender.py
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv
from sender import Sender

# Load environment variables from .env file
load_dotenv()



class EmailSender(Sender):
    def __init__(self):
        # Initialize instance attributes for configuration
        self.email = os.getenv("EMAIL_ADDRESS")
        self.password = os.getenv("EMAIL_PASSWORD")
        self.smtp_server = "smtp.gmail.com"
        self.smtp_port = 587
        self._smtp_connection: smtplib.SMTP = None  # Optional, for persistent connection if needed

        # Check if email or password is missing
        if not self.email or not self.password:
            print("Email or password is not set in the environment variables.")
            raise ValueError("Email and password must be set.")

    def connect(self):
        """Establishes and returns an SMTP connection."""
        if not self._smtp_connection:
            self._smtp_connection = smtplib.SMTP(self.smtp_server, self.smtp_port)
            self._smtp_connection.starttls()
            self._smtp_connection.login(self.email, self.password)
        return self._smtp_connection

    def send_notification(self, recipient: str, subject: str, message: str):
        try:
            msg = MIMEMultipart()
            msg['From'] = self.email
            msg['To'] = recipient
            msg['Subject'] = subject
            msg.attach(MIMEText(message, 'plain'))

            # Use an SMTP connection to send the email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.email, self.password)
                server.sendmail(self.email, recipient, msg.as_string())
            print(f"Email sent to {recipient}.")
        except Exception as e:
            print(f"Failed to send email to {recipient}: {e}")

    def close_connection(self):
        """Closes the SMTP connection if one was established."""
        if self._smtp_connection:
            self._smtp_connection.quit()
            self._smtp_connection = None
