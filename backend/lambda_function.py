import os
import sys

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(__file__))

from mangum import Mangum
from check_exchange_rates import app

# Create the Lambda handler using Mangum
handler = Mangum(app, lifespan="off")

def lambda_handler(event, context):
    """
    AWS Lambda handler for Flask application using Mangum
    """
    return handler(event, context)