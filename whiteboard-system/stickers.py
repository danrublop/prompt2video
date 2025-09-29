#!/usr/bin/env python3
"""
True transparent sticker generation using OpenAI Images API.
Generates PNG stickers with proper alpha channels for white-canvas videos.
"""

import base64
import io
from PIL import Image
from openai import OpenAI
import os
from pathlib import Path

client = OpenAI()

def remove_white_background(img: Image.Image, tolerance: int = 16) -> Image.Image:
    """
    Remove white background by making near-white pixels transparent.
    
    Args:
        img: PIL Image in RGBA mode
        tolerance: How close to white (255,255,255) to consider as background
    
    Returns:
        PIL Image with white background made transparent
    """
    img = img.convert("RGBA")
    px = img.load()
    W, H = img.size
    
    # Count pixels that will be made transparent for logging
    transparent_count = 0
    
    for y in range(H):
        for x in range(W):
            r, g, b, a = px[x, y]
            # Check if pixel is close to white
            if (abs(r - 255) <= tolerance and 
                abs(g - 255) <= tolerance and 
                abs(b - 255) <= tolerance):
                px[x, y] = (r, g, b, 0)  # Make transparent
                transparent_count += 1
    
    print(f"🎯 Made {transparent_count} pixels transparent (tolerance: {tolerance})")
    return img

def detect_and_remove_background(img: Image.Image) -> Image.Image:
    """
    Intelligently detect and remove background color (not just white).
    Uses corner pixel analysis to determine the most likely background color.
    
    Args:
        img: PIL Image in RGBA mode
    
    Returns:
        PIL Image with detected background made transparent
    """
    img = img.convert("RGBA")
    W, H = img.size
    
    # Sample corner pixels to detect background color
    corner_pixels = [
        img.getpixel((0, 0)),           # Top-left
        img.getpixel((W-1, 0)),         # Top-right
        img.getpixel((0, H-1)),         # Bottom-left
        img.getpixel((W-1, H-1)),       # Bottom-right
        img.getpixel((W//2, 0)),        # Top-center
        img.getpixel((W//2, H-1)),      # Bottom-center
        img.getpixel((0, H//2)),        # Left-center
        img.getpixel((W-1, H//2)),      # Right-center
    ]
    
    # Find the most common color in corners (likely background)
    from collections import Counter
    corner_colors = Counter(corner_pixels)
    background_color = corner_colors.most_common(1)[0][0]
    
    print(f"🔍 Detected background color: RGB{background_color[:3]}")
    
    # Remove background with adaptive tolerance
    px = img.load()
    transparent_count = 0
    
    # Calculate tolerance based on background color brightness
    bg_r, bg_g, bg_b = background_color[:3]
    avg_brightness = (bg_r + bg_g + bg_b) / 3
    
    # Adaptive tolerance: higher for darker backgrounds, lower for lighter
    if avg_brightness > 200:  # Very light background
        tolerance = 20
    elif avg_brightness > 150:  # Light background
        tolerance = 30
    else:  # Darker background
        tolerance = 40
    
    print(f"🎯 Using adaptive tolerance: {tolerance}")
    
    for y in range(H):
        for x in range(W):
            r, g, b, a = px[x, y]
            # Check if pixel is close to detected background color
            if (abs(r - bg_r) <= tolerance and 
                abs(g - bg_g) <= tolerance and 
                abs(b - bg_b) <= tolerance):
                px[x, y] = (r, g, b, 0)  # Make transparent
                transparent_count += 1
    
    print(f"🎯 Made {transparent_count} pixels transparent (background: RGB{bg_r},{bg_g},{bg_b})")
    return img

def generate_sticker(prompt: str, size: str = "1024x1024", cache_dir: str = ".cache_stickers") -> Image.Image:
    """
    Generate a true transparent PNG sticker using OpenAI Images API.
    
    Args:
        prompt: Description of what to draw (e.g., "cute cartoon cat")
        size: Image size (default: "1024x1024")
        cache_dir: Directory to cache generated stickers
    
    Returns:
        PIL Image with RGBA mode and transparent background
    """
    cache_path = Path(cache_dir)
    cache_path.mkdir(exist_ok=True)
    
    # Create cache filename based on prompt
    import hashlib
    cache_key = hashlib.sha256(f"{prompt}_{size}".encode()).hexdigest()[:16]
    cache_file = cache_path / f"{cache_key}.png"
    
    if cache_file.exists():
        print(f"📁 Using cached sticker: {prompt}")
        return Image.open(cache_file).convert("RGBA")
    
    # Choose style prefix from env or default
    style_prefix = os.getenv("STICKER_STYLE", "cute cartoon").strip().lower()
    # Special case for the custom whiteboard illustration prompt
    if style_prefix == "whiteboard illustration":
        sticker_prompt = (
            f"A hand-drawn black and white illustration of a {prompt}, "
            "whiteboard style, bold marker lines, simple and clean design, "
            "blank white background, no shadows, no extra text."
        )
    else:
        # Normalize to supported simple prefixes
        if style_prefix not in ["cute cartoon", "clip art"]:
            style_prefix = "cute cartoon"

        sticker_prompt = (
            f"A {style_prefix} {prompt}, sticker-style. "
            "Pure white background, no shadow, no glow, no vignette, no text. "
            "Bold clean outline, no white border."
        )
    
    print(f"🎨 Generating sticker: {prompt}")
    
    try:
        # Use DALL-E 3 with optimized transparency prompt
        # Note: gpt-image-1 requires organization verification
        # When available, use: model="gpt-image-1", background="transparent", output_format="png"
        print("🎨 Using DALL-E 3 with optimized transparency prompt")
        response = client.images.generate(
            model="dall-e-3",
            prompt=sticker_prompt,
            size=size,
            response_format="b64_json",
            n=1
        )
        
        # Decode and load image
        b64_data = response.data[0].b64_json
        img_data = base64.b64decode(b64_data)
        img = Image.open(io.BytesIO(img_data)).convert("RGBA")
        
        # Post-process: Intelligently detect and remove background
        print("🔧 Post-processing: Detecting and removing background...")
        img = detect_and_remove_background(img)
        
        # Verify transparency after post-processing
        try:
            alpha_channel = img.getchannel("A")
            min_alpha, max_alpha = alpha_channel.getextrema()
            if min_alpha < 255:
                print(f"✓ Generated transparent sticker (alpha: {min_alpha}-{max_alpha})")
            else:
                print(f"⚠️  Warning: Image may not be fully transparent")
        except Exception as e:
            print(f"⚠️  Could not verify transparency: {e}")
        
        # Save to cache
        img.save(cache_file, format="PNG")
        print(f"💾 Cached sticker: {cache_file}")
        
        return img
        
    except Exception as e:
        print(f"❌ Error generating sticker '{prompt}': {e}")
        # Return a transparent placeholder
        placeholder = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
        return placeholder

def test_sticker_generation():
    """Test function to verify sticker generation works."""
    print("🧪 Testing sticker generation...")
    
    test_prompts = [
        "cute cartoon cat sitting with big eyes",
        "simple doctor with stethoscope", 
        "vaccine vial with medical cross"
    ]
    
    for prompt in test_prompts:
        sticker = generate_sticker(prompt)
        print(f"Generated: {sticker.size} {sticker.mode} - {prompt}")
    
    print("✅ Sticker generation test complete!")

if __name__ == "__main__":
    test_sticker_generation()
