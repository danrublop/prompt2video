@echo off
REM White-Canvas Video Generator - Quick Start Script for Windows

echo 🎬 White-Canvas Video Generator - Quick Start
echo ==============================================

REM Check if virtual environment exists
if not exist ".venv" (
    echo Creating virtual environment...
    python -m venv .venv
)

REM Activate virtual environment
echo Activating virtual environment...
call .venv\Scripts\activate.bat

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt

REM Check if .env exists
if not exist ".env" (
    echo Creating .env file from template...
    copy env.example .env
    echo ⚠️  Please edit .env and add your OPENAI_API_KEY
    echo    Get your API key from: https://platform.openai.com/api-keys
    pause
    exit /b 1
)

REM Run setup test
echo Running setup test...
python test_setup.py

if %errorlevel% equ 0 (
    echo.
    echo ✅ Setup complete! You can now run:
    echo    python main.py                    # Default health example
    echo    python main.py business           # Business example
    echo    python main.py education          # Education example
    echo    python main.py tech               # Technology example
    echo    python main.py marketing          # Marketing example
    echo.
    echo Or run the test to see all examples:
    echo    python examples.py
) else (
    echo ❌ Setup test failed. Please check the errors above.
)

pause
