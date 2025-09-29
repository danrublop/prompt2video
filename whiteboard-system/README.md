# Whiteboard Video Generation System

This directory contains the integrated whiteboard video generation system that powers the scene generator feature in the prompt2video application.

## Overview

The whiteboard system generates animated whiteboard videos using:
- **DALL-E 3** for generating educational stickers and diagrams
- **Pillow** for image processing and transparency handling
- **MoviePy** for video composition and animation
- **OpenAI** for storyboard generation and content creation

## Features

- **AI-Generated Stickers**: Creates educational diagrams and illustrations using DALL-E 3
- **Transparent Backgrounds**: Automatically removes backgrounds for clean compositing
- **Smooth Animations**: Generates frame-by-frame animations with proper timing
- **Educational Content**: Optimized for creating explainer videos and tutorials
- **Caching System**: Reuses generated stickers to improve performance

## Setup

1. **Install Dependencies**:
   ```bash
   ./setup.sh
   ```

2. **Configure API Keys**:
   Edit the `.env` file and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

## Usage

### Direct Usage
```bash
python3 main.py "Your narration text here"
```

### Integration with Scene Generator
The system is automatically called by the scene generator when using `generationMode: "scene_generator"` in the prompt2video application.

## File Structure

- `main.py` - Main entry point for the whiteboard system
- `storyboard.py` - Generates structured storyboards from narration
- `video.py` - Handles video rendering and composition
- `renderer.py` - Core rendering logic and DALL-E integration
- `stickers.py` - Manages sticker generation and caching
- `examples.py` - Sample content and examples
- `assets/` - Fonts and static assets
- `.cache_stickers/` - Cached generated stickers (auto-created)

## Dependencies

- `openai>=1.0.0` - For DALL-E 3 and storyboard generation
- `pillow>=9.0.0` - For image processing
- `moviepy>=1.0.3` - For video composition
- `numpy>=1.21.0` - For numerical operations
- `python-dotenv>=0.19.0` - For environment variable management

## Output

The system generates:
- `scene_custom.mp4` - The final whiteboard animation video
- Cached stickers in `.cache_stickers/` directory
- Temporary files (automatically cleaned up)

## Integration Notes

This system is designed to work seamlessly with the prompt2video application's scene generator. When a scene generator job is created, the system:

1. Receives individual scene narrations
2. Generates storyboards for each scene
3. Creates whiteboard animations with DALL-E stickers
4. Returns video buffers for compilation into the final video

The system handles all the complex video generation logic, allowing the main application to focus on orchestration and user interface.