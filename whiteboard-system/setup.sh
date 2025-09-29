#!/bin/bash

# Setup script for whiteboard video generation system
echo "Setting up whiteboard video generation system..."

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed or not in PATH"
    exit 1
fi

# Check if pip3 is available
if ! command -v pip3 &> /dev/null; then
    echo "Error: pip3 is not installed or not in PATH"
    exit 1
fi

# Install Python dependencies
echo "Installing Python dependencies..."
pip3 install -r requirements.txt

# Check if .env file exists, if not create from example
if [ ! -f .env ]; then
    if [ -f env.example ]; then
        echo "Creating .env file from env.example..."
        cp env.example .env
        echo "Please edit .env file and add your OpenAI API key"
    else
        echo "Creating .env file..."
        echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
        echo "Please edit .env file and add your OpenAI API key"
    fi
fi

echo "Setup completed!"
echo "Make sure to set your OPENAI_API_KEY in the .env file"
