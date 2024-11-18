# sender.py
from abc import ABC, abstractmethod

class Sender(ABC):
    @abstractmethod
    def send_notification(self, recipient: str, subject: str, message: str):
        pass
