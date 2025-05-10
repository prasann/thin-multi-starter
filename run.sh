#!/bin/bash

# Run the FastAPI application with uvicorn
echo "Starting the demo application..."
uvicorn main:app --reload --port 8000

# If uvicorn fails to start
if [ $? -ne 0 ]; then
    echo "Failed to start the application."
    echo "Make sure you have installed the required dependencies:"
    echo "pip install -r requirements.txt"
    exit 1
fi
