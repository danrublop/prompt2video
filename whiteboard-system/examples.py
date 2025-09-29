#!/usr/bin/env python3
"""
Example narrations for testing the White-Canvas Video Generator.
Each example demonstrates different use cases and complexity levels.
"""

# Simple health example (default)
HEALTH_EXAMPLE = """
A calm doctor appears and says vaccines protect communities.
A simple vaccine vial appears next to them.
The title 'How vaccines protect us' appears above.
"""

# Business/product explanation
BUSINESS_EXAMPLE = """
A friendly business person explains our new app features.
A smartphone appears showing the main interface.
The title 'Introducing Our New App' appears at the top.
A simple chart shows user growth over time.
"""

# Educational content
EDUCATION_EXAMPLE = """
A teacher explains the water cycle to students.
A simple diagram of clouds and rain appears.
The title 'Understanding the Water Cycle' is displayed.
An arrow shows water flowing from ocean to sky.
"""

# Technology explanation
TECH_EXAMPLE = """
A developer explains how machine learning works.
A simple computer chip appears on screen.
The title 'Machine Learning Basics' appears above.
A flowchart shows data flowing through the system.
"""

# Marketing/sales
MARKETING_EXAMPLE = """
A salesperson presents our premium service benefits.
A simple trophy appears representing success.
The title 'Why Choose Our Service?' is shown.
A price tag appears with special offer details.
"""

# All examples in a dictionary for easy access
EXAMPLES = {
    "health": HEALTH_EXAMPLE,
    "business": BUSINESS_EXAMPLE, 
    "education": EDUCATION_EXAMPLE,
    "tech": TECH_EXAMPLE,
    "marketing": MARKETING_EXAMPLE
}

def get_example(name: str) -> str:
    """Get an example narration by name."""
    return EXAMPLES.get(name.lower(), HEALTH_EXAMPLE)

def list_examples():
    """Print all available examples."""
    print("Available examples:")
    for name, description in EXAMPLES.items():
        print(f"  {name}: {description.strip()[:50]}...")

if __name__ == "__main__":
    list_examples()
