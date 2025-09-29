#!/usr/bin/env python3
"""
Custom video generation script.
Use this to create videos from any narration script.
"""

import os
import json
from dotenv import load_dotenv
from storyboard import build_storyboard
from video import render_video

load_dotenv()

def create_video_from_narration(narration: str, output_file: str = "custom_video.mp4"):
    """
    Create a whiteboard video from any narration script.
    
    Args:
        narration: Your custom narration text
        output_file: Output video filename (default: custom_video.mp4)
    """
    print(f"Creating video from narration: {narration.strip()}")
    print("Building storyboard...")
    
    try:
        # Generate storyboard from narration
        sb = build_storyboard(narration)
        print("Storyboard:", json.dumps(sb, indent=2))
        
        print("Rendering video...")
        render_video(sb, output_path=output_file, fps=30, audio_path=None)
        print(f"✅ Done! Check {output_file}")
        
        return output_file
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\nTroubleshooting:")
        print("1. Make sure you have set your OPENAI_API_KEY in .env")
        print("2. Run 'python test_setup.py' to check your setup")
        return None

def main():
    """Example usage with custom narrations."""
    
    # Example 1: Simple business pitch
    business_narration = """
    A confident entrepreneur presents our revolutionary product.
    A sleek smartphone appears showing the main app interface.
    The title 'Innovation at Your Fingertips' appears at the top.
    A simple graph shows impressive growth statistics.
    """
    
    # Example 2: Educational content
    science_narration = """
    A friendly scientist explains photosynthesis to students.
    A simple plant diagram appears with sunlight and leaves.
    The title 'How Plants Make Food' is displayed.
    An arrow shows energy flowing from sun to plant.
    """
    
    # Example 3: Health and wellness
    wellness_narration = """
    A calm yoga instructor demonstrates meditation benefits.
    A peaceful lotus flower appears in the center.
    The title 'Mindfulness for Better Health' appears above.
    A simple brain diagram shows reduced stress levels.
    """
    
    print("🎬 Custom Video Generator")
    print("=" * 50)
    
    # Create videos from examples
    examples = [
        ("Business Pitch", business_narration, "business_pitch.mp4"),
        ("Science Education", science_narration, "science_lesson.mp4"),
        ("Wellness Guide", wellness_narration, "wellness_guide.mp4")
    ]
    
    for title, narration, filename in examples:
        print(f"\n📹 Creating: {title}")
        print("-" * 30)
        create_video_from_narration(narration, filename)
    
    print("\n🎉 All videos created successfully!")
    print("\nTo create your own custom video:")
    print("1. Edit this script and add your narration")
    print("2. Or use: python main.py \"Your custom narration here\"")
    print("3. Or import this module and call create_video_from_narration()")

if __name__ == "__main__":
    main()
