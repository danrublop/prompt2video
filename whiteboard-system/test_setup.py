#!/usr/bin/env python3
"""
Quick test script to verify the setup works correctly.
Run this before running main.py to check dependencies and API connectivity.
"""

import os
import sys
from pathlib import Path

def test_imports():
    """Test that all required modules can be imported."""
    print("Testing imports...")
    try:
        import openai
        print("✓ OpenAI imported successfully")
    except ImportError as e:
        print(f"✗ OpenAI import failed: {e}")
        return False
    
    try:
        from PIL import Image, ImageDraw, ImageFont
        print("✓ Pillow imported successfully")
    except ImportError as e:
        print(f"✗ Pillow import failed: {e}")
        return False
    
    try:
        import moviepy.editor
        print("✓ MoviePy imported successfully")
    except ImportError as e:
        print(f"✗ MoviePy import failed: {e}")
        return False
    
    try:
        import numpy as np
        print("✓ NumPy imported successfully")
    except ImportError as e:
        print(f"✗ NumPy import failed: {e}")
        return False
    
    try:
        from dotenv import load_dotenv
        print("✓ python-dotenv imported successfully")
    except ImportError as e:
        print(f"✗ python-dotenv import failed: {e}")
        return False
    
    return True

def test_files():
    """Test that all required files exist."""
    print("\nTesting file structure...")
    
    required_files = [
        "storyboard.py",
        "renderer.py", 
        "video.py",
        "main.py",
        "requirements.txt",
        "env.example",
        "prompts/storyboard_system.txt",
        "assets/fonts/DejaVuSans-Bold.ttf"
    ]
    
    all_exist = True
    for file_path in required_files:
        if Path(file_path).exists():
            print(f"✓ {file_path}")
        else:
            print(f"✗ {file_path} - MISSING")
            all_exist = False
    
    return all_exist

def test_api_key():
    """Test that OpenAI API key is configured."""
    print("\nTesting API configuration...")
    
    from dotenv import load_dotenv
    load_dotenv()
    
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key and api_key != "sk-...":
        print("✓ OpenAI API key found")
        return True
    else:
        print("✗ OpenAI API key not configured")
        print("  Please copy env.example to .env and add your API key")
        return False

def main():
    print("White-Canvas Video Generator - Setup Test")
    print("=" * 50)
    
    success = True
    
    # Test imports
    if not test_imports():
        success = False
    
    # Test files
    if not test_files():
        success = False
    
    # Test API key
    if not test_api_key():
        success = False
    
    print("\n" + "=" * 50)
    if success:
        print("✓ All tests passed! You're ready to run main.py")
    else:
        print("✗ Some tests failed. Please fix the issues above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
