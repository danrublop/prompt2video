#!/bin/bash

# White-Canvas Video Generator - Quick Start Script

echo "🎬 White-Canvas Video Generator - Quick Start"
echo "=============================================="

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source .venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit .env and add your OPENAI_API_KEY"
    echo "   Get your API key from: https://platform.openai.com/api-keys"
    exit 1
fi

# Run setup test
echo "Running setup test..."
python test_setup.py

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Setup complete! You can now run:"
    echo "   python main.py                    # Default health example"
    echo "   python main.py business           # Business example"
    echo "   python main.py education          # Education example"
    echo "   python main.py tech               # Technology example"
    echo "   python main.py marketing          # Marketing example"
    echo ""
    echo "Or run the test to see all examples:"
    echo "   python examples.py"
else
    echo "❌ Setup test failed. Please check the errors above."
fi
