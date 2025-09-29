import os
import json
import sys
from dotenv import load_dotenv
from storyboard import build_storyboard
from video import render_video
from examples import get_example, list_examples

load_dotenv()

def main():
    # Check if custom narration or example name was provided
    if len(sys.argv) > 1:
        arg = sys.argv[1]
        
        # Check if it's an example name (starts with a letter and no spaces)
        if arg.isalpha() and len(arg.split()) == 1:
            example_name = arg
            narration = get_example(example_name)
            output_file = f"scene_{example_name}.mp4"
            duration = 8.0  # Default duration for examples
        else:
            # Treat as custom narration
            narration = arg
            output_file = "scene_custom.mp4"
            # Check if duration was provided as second argument
            duration = float(sys.argv[2]) if len(sys.argv) > 2 else 8.0
    else:
        # Default health example
        narration = get_example("health")
        output_file = "scene.mp4"
        duration = 8.0
    
    print(f"Using narration: {narration.strip()}")
    print(f"Target duration: {duration}s")
    print("Building storyboard...")
    
    try:
        sb = build_storyboard(narration, duration)
        print("Storyboard:", json.dumps(sb, indent=2))
        
        print("Rendering video...")
        render_video(sb, output_path=output_file, fps=30, audio_path=None, target_duration=duration)
        print(f"Done! Check {output_file}")
        
    except Exception as e:
        print(f"Error: {e}")
        print("\nTroubleshooting:")
        print("1. Make sure you have set your OPENAI_API_KEY in .env")
        print("2. Run 'python test_setup.py' to check your setup")
        print("3. Try running with an example: 'python main.py health'")
        print("4. Or use custom narration: 'python main.py \"Your custom narration here\"'")
        print("\nAvailable examples:")
        list_examples()

if __name__ == "__main__":
    main()
