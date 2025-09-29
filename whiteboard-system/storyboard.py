import json
from pathlib import Path
from openai import OpenAI

def check_collision(el1: dict, el2: dict) -> bool:
    """Check if two elements overlap."""
    # Get bounding boxes
    x1, y1, w1, h1 = el1["x"], el1["y"], el1["w"], el1["h"]
    x2, y2, w2, h2 = el2["x"], el2["y"], el2["w"], el2["h"]
    
    # Convert to actual coordinates (elements are centered)
    left1 = x1 - w1/2
    right1 = x1 + w1/2
    top1 = y1 - h1/2
    bottom1 = y1 + h1/2
    
    left2 = x2 - w2/2
    right2 = x2 + w2/2
    top2 = y2 - h2/2
    bottom2 = y2 + h2/2
    
    # Check for overlap with minimum spacing
    min_spacing = 0.1  # Minimum spacing between elements
    return not (right1 + min_spacing < left2 or 
                left1 - min_spacing > right2 or 
                bottom1 + min_spacing < top2 or 
                top1 - min_spacing > bottom2)

def calculate_reading_time(text: str) -> float:
    """Estimate reading time for text in seconds."""
    # Average reading speed: 200-250 words per minute
    # Use 220 WPM for comfortable reading
    words = len(text.split())
    return (words / 220) * 60

def fix_layout_conflicts(elements: list, narration: str = "", target_duration: float = None) -> list:
    """Fix overlapping elements by repositioning them with proper spacing."""
    fixed_elements = elements.copy()
    
    # Separate text and image elements
    text_elements = [el for el in fixed_elements if el["type"] == "text"]
    image_elements = [el for el in fixed_elements if el["type"] == "image"]
    
    # Use target duration if provided, otherwise calculate from narration
    if target_duration is not None:
        total_duration = target_duration
    else:
        total_duration = 10.0  # Default
        if narration:
            reading_time = calculate_reading_time(narration)
            total_duration = max(8.0, min(15.0, reading_time + 2.0))  # 8-15 seconds
    
    # Elements should disappear slightly before narration ends (0.5s before)
    visual_end_time = max(1.0, total_duration - 0.5)
    
    # Text should always be at the top
    if text_elements:
        text_elements[0]["x"] = 0.5
        text_elements[0]["y"] = 0.1
        text_elements[0]["w"] = 0.8
        text_elements[0]["h"] = 0.25
        text_elements[0]["start"] = 0.0
        text_elements[0]["end"] = visual_end_time
    
    # Organize images with better spacing and sequential timing
    if len(image_elements) == 1:
        image_elements[0]["x"] = 0.5
        image_elements[0]["y"] = 0.6
        image_elements[0]["w"] = 0.3
        image_elements[0]["h"] = 0.3
        image_elements[0]["start"] = 1.0
        image_elements[0]["end"] = visual_end_time
    elif len(image_elements) == 2:
        image_elements[0]["x"] = 0.25
        image_elements[0]["y"] = 0.6
        image_elements[0]["w"] = 0.3
        image_elements[0]["h"] = 0.3
        image_elements[0]["start"] = 1.0
        image_elements[0]["end"] = visual_end_time
        
        image_elements[1]["x"] = 0.75
        image_elements[1]["y"] = 0.6
        image_elements[1]["w"] = 0.3
        image_elements[1]["h"] = 0.3
        image_elements[1]["start"] = 2.0
        image_elements[1]["end"] = visual_end_time
    elif len(image_elements) == 3:
        image_elements[0]["x"] = 0.2
        image_elements[0]["y"] = 0.5
        image_elements[0]["w"] = 0.25
        image_elements[0]["h"] = 0.25
        image_elements[0]["start"] = 1.0
        image_elements[0]["end"] = visual_end_time
        
        image_elements[1]["x"] = 0.5
        image_elements[1]["y"] = 0.5
        image_elements[1]["w"] = 0.25
        image_elements[1]["h"] = 0.25
        image_elements[1]["start"] = 2.0
        image_elements[1]["end"] = visual_end_time
        
        image_elements[2]["x"] = 0.8
        image_elements[2]["y"] = 0.5
        image_elements[2]["w"] = 0.25
        image_elements[2]["h"] = 0.25
        image_elements[2]["start"] = 3.0
        image_elements[2]["end"] = visual_end_time
    elif len(image_elements) == 4:
        # 2x2 grid with sequential timing
        image_elements[0]["x"] = 0.25
        image_elements[0]["y"] = 0.4
        image_elements[0]["w"] = 0.25
        image_elements[0]["h"] = 0.25
        image_elements[0]["start"] = 1.0
        image_elements[0]["end"] = visual_end_time
        
        image_elements[1]["x"] = 0.75
        image_elements[1]["y"] = 0.4
        image_elements[1]["w"] = 0.25
        image_elements[1]["h"] = 0.25
        image_elements[1]["start"] = 2.0
        image_elements[1]["end"] = visual_end_time
        
        image_elements[2]["x"] = 0.25
        image_elements[2]["y"] = 0.7
        image_elements[2]["w"] = 0.25
        image_elements[2]["h"] = 0.25
        image_elements[2]["start"] = 3.0
        image_elements[2]["end"] = visual_end_time
        
        image_elements[3]["x"] = 0.75
        image_elements[3]["y"] = 0.7
        image_elements[3]["w"] = 0.25
        image_elements[3]["h"] = 0.25
        image_elements[3]["start"] = 4.0
        image_elements[3]["end"] = visual_end_time
    else:
        # For 5+ images, use a more complex grid with sequential timing
        cols = min(3, len(image_elements))
        rows = (len(image_elements) + cols - 1) // cols
        
        for i, img in enumerate(image_elements):
            col = i % cols
            row = i // cols
            
            # Better spacing to prevent overlaps
            x = 0.15 + (col * 0.35)  # 0.15, 0.5, 0.85
            y = 0.4 + (row * 0.25)   # 0.4, 0.65, 0.9
            
            img["x"] = x
            img["y"] = y
            img["w"] = 0.25
            img["h"] = 0.25
            img["start"] = 1.0 + (i * 0.8)  # Stagger appearance
            img["end"] = visual_end_time
    
    return text_elements + image_elements

def build_storyboard(narration: str, target_duration: float = None, model: str = "gpt-4o-mini") -> dict:
    sys_prompt = Path("prompts/storyboard_system.txt").read_text()
    client = OpenAI()
    
    # Use chat completions instead of responses API for broader compatibility
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": narration}
        ],
        temperature=0.3
    )
    
    text = response.choices[0].message.content
    
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        # Best-effort fix: extract JSON fence if present
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1:
            data = json.loads(text[start:end+1])
        else:
            raise ValueError("Could not extract valid JSON from response")
    
    # Basic sanity checks
    assert "scene_duration" in data and "elements" in data
    
    # Fix layout conflicts with narration timing
    data["elements"] = fix_layout_conflicts(data["elements"], narration, target_duration)
    
    # Use target duration if provided, otherwise keep the AI-generated duration
    if target_duration is not None:
        data["scene_duration"] = target_duration
    
    return data
