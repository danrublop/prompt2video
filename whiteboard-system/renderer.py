import base64
import io
import hashlib
from PIL import Image, ImageDraw, ImageFont
from openai import OpenAI
from pathlib import Path

W, H = 1920, 1080

# Grid system for layout management
GRID_COLS = 12  # 12-column grid system
GRID_ROWS = 8   # 8-row grid system
GRID_CELL_W = W // GRID_COLS  # 160px per column
GRID_CELL_H = H // GRID_ROWS  # 135px per row

client = OpenAI()
CACHE_DIR = Path(".cache_images")
CACHE_DIR.mkdir(exist_ok=True)

def _cache_path(prompt: str) -> Path:
    key = hashlib.sha256(prompt.encode("utf-8")).hexdigest()[:32]
    return CACHE_DIR / f"{key}.png"

def gen_clipart(prompt: str, size: str = "1024x1024") -> Image.Image:
    """
    Generates a true transparent PNG sticker using OpenAI Images API.
    """
    from stickers import generate_sticker
    return generate_sticker(prompt, size)

def new_canvas() -> Image.Image:
    return Image.new("RGBA", (W, H), "white")

def grid_to_pixels(col: int, row: int, width: int = 1, height: int = 1) -> tuple:
    """
    Convert grid coordinates to pixel coordinates.
    
    Args:
        col: Grid column (0-11)
        row: Grid row (0-7) 
        width: Width in grid cells
        height: Height in grid cells
    
    Returns:
        (x, y, w, h) in pixels
    """
    x = col * GRID_CELL_W
    y = row * GRID_CELL_H
    w = width * GRID_CELL_W
    h = height * GRID_CELL_H
    return (x, y, w, h)

def calculate_text_size(text: str, max_width: int, max_height: int) -> int:
    """
    Calculate optimal font size for text to fit within given dimensions.
    
    Args:
        text: Text to measure
        max_width: Maximum width in pixels
        max_height: Maximum height in pixels
    
    Returns:
        Optimal font size
    """
    # Start with a reasonable font size
    font_size = 100
    
    try:
        # Try common system fonts first
        font_paths = [
            "/System/Library/Fonts/Helvetica.ttc",  # macOS
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",  # Linux
            "C:/Windows/Fonts/arial.ttf",  # Windows
            "assets/fonts/DejaVuSans-Bold.ttf"  # Local fallback
        ]
        font = None
        for path in font_paths:
            try:
                font = ImageFont.truetype(path, font_size)
                break
            except (OSError, IOError):
                continue
        
        if font is None:
            font = ImageFont.load_default()
    except:
        font = ImageFont.load_default()
    
    # Binary search for optimal font size
    min_size = 50
    max_size = 500
    
    while min_size < max_size:
        mid_size = (min_size + max_size + 1) // 2
        try:
            # Try common system fonts first
            test_font = None
            for path in font_paths:
                try:
                    test_font = ImageFont.truetype(path, mid_size)
                    break
                except (OSError, IOError):
                    continue
            
            if test_font is None:
                test_font = ImageFont.load_default()
        except:
            test_font = ImageFont.load_default()
        
        # Get text bounding box
        bbox = test_font.getbbox(text)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        if text_width <= max_width and text_height <= max_height:
            min_size = mid_size
        else:
            max_size = mid_size - 1
    
    return min_size

def calculate_image_size(prompt: str, max_width: int, max_height: int) -> tuple:
    """
    Calculate optimal image size based on content and available space.
    
    Args:
        prompt: Image description
        max_width: Maximum width in pixels
        max_height: Maximum height in pixels
    
    Returns:
        (width, height) in pixels
    """
    # For images, we'll use a square aspect ratio that fits within the bounds
    size = min(max_width, max_height)
    
    # Ensure minimum size
    size = max(size, 200)
    
    return (size, size)

def draw_text(img: Image.Image, text: str, x: int, y: int, w: int, h: int, color=(0,0,0,255), font_path=None, font_size=120, typing_progress=1.0):
    """
    Draw text with optional typewriter effect.
    
    Args:
        typing_progress: 0.0 to 1.0, where 1.0 shows full text
    """
    draw = ImageDraw.Draw(img)
    
    # Try common system fonts first
    font_paths = [
        "/System/Library/Fonts/Helvetica.ttc",  # macOS
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",  # Linux
        "C:/Windows/Fonts/arial.ttf",  # Windows
        "assets/fonts/DejaVuSans-Bold.ttf"  # Local fallback
    ]
    
    if font_path:
        font_paths.insert(0, font_path)
    
    font = None
    for path in font_paths:
        try:
            font = ImageFont.truetype(path, font_size)
            break
        except (OSError, IOError):
            continue
    
    if font is None:
        font = ImageFont.load_default()
    
    # Calculate how many characters to show for typewriter effect
    chars_to_show = int(len(text) * typing_progress)
    display_text = text[:chars_to_show]
    
    # Add cursor if not fully typed
    if typing_progress < 1.0:
        display_text += "|"
    
    # Get text bounding box for centering
    bbox = font.getbbox(display_text)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    # For typewriter effect: start from left, then center when complete
    if typing_progress < 1.0:
        # While typing: align to left edge of allocated area
        text_x = x
    else:
        # When complete: center the text within the allocated area
        text_x = x + (w - text_width) // 2
        # Debug: print(f"Centering text: x={x}, w={w}, text_width={text_width}, centered_x={text_x}")
    
    # Always center vertically within the allocated area
    text_y = y + (h - text_height) // 2
    
    draw.text((text_x, text_y), display_text, font=font, fill=color)

def _ease_in_out(t):  # 0..1
    return 3*t*t - 2*t*t*t

def composite_frame(t: float, storyboard: dict) -> Image.Image:
    """
    Render one RGB frame at time t (seconds) using grid-based layout.
    Supports element.fx in {"fade","slide_up","none"}.
    """
    canvas = new_canvas()
    
    for el in storyboard["elements"]:
        if not (el["start"] <= t <= el["end"]):
            continue

        # Convert fractional coordinates to grid coordinates
        # For centering: x=0.5 means center of element should be at 50% of canvas
        grid_width = max(1, int(el["w"] * GRID_COLS))
        grid_height = max(1, int(el["h"] * GRID_ROWS))
        
        # Calculate center position and convert to left edge
        center_col = el["x"] * GRID_COLS
        grid_col = int(center_col - grid_width / 2)
        grid_row = int(el["y"] * GRID_ROWS)
        
        # Convert to pixel coordinates
        x, y, w, h = grid_to_pixels(grid_col, grid_row, grid_width, grid_height)
        
        # Debug: print(f"Element '{el['content'][:20]}...': grid({grid_col},{grid_row}) size({grid_width}x{grid_height}) -> pixels({x},{y},{w},{h})")

        # compute fade in/out alpha over 0.5s edges (clamped)
        alpha = 1.0
        edge = min(0.5, el["end"] - el["start"])
        if t < el["start"] + edge:
            alpha = (t - el["start"]) / edge
        if t > el["end"] - edge:
            alpha = min(alpha, (el["end"] - t) / edge)
        alpha = max(0.0, min(1.0, alpha))

        if el["type"] == "text":
            # Calculate optimal font size for the allocated space
            font_size = calculate_text_size(el["content"], w, h)
            # Debug: print(f"  Text font size: {font_size}px for '{el['content']}' in {w}x{h}px area")
            
            # Calculate typing progress for typewriter effect
            typing_duration = min(2.0, el["end"] - el["start"])  # Max 2 seconds for typing
            if t < el["start"] + typing_duration:
                typing_progress = (t - el["start"]) / typing_duration
            else:
                typing_progress = 1.0  # Fully typed
            
            # Apply alpha to typing progress
            typing_progress *= alpha
            
            draw_text(canvas, el["content"], x, y, w, h,
                     color=(0,0,0,int(255*alpha)), 
                     font_size=font_size, 
                     typing_progress=typing_progress)
        else:
            # image
            prompt = el["content"]
            
            # Calculate optimal image size for the allocated space
            img_w, img_h = calculate_image_size(prompt, w, h)
            # Debug: print(f"  Image size: {img_w}x{img_h}px for '{prompt}' in {w}x{h}px area")
            
            img = gen_clipart(prompt)
            img = img.resize((img_w, img_h), Image.LANCZOS)

            if el["fx"] == "slide_up":
                amt = int(40 * (1 - _ease_in_out(min(1.0, (t - el["start"]) / 0.6))))
                y += amt

            if alpha < 1:
                a = img.getchannel("A").point(lambda p: int(p * alpha))
                img.putalpha(a)

            canvas.alpha_composite(img, (x, y))
    
    return canvas.convert("RGB")
