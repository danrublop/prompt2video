import numpy as np
from moviepy.editor import ImageSequenceClip, AudioFileClip
from renderer import composite_frame

def render_video(storyboard: dict, output_path="scene.mp4", fps=30, audio_path=None, target_duration=None):
    # Use target_duration if provided, otherwise use storyboard duration
    if target_duration is not None:
        T = float(target_duration)
        # Update storyboard duration to match target
        storyboard["scene_duration"] = T
    else:
        T = float(storyboard["scene_duration"])
    
    # No extra fade time - animation should end exactly when narration ends
    # Only add a small buffer (0.1s) to ensure smooth ending
    fade_time = 0.1
    total_duration = T + fade_time
    
    frames = []
    total = int(total_duration * fps)
    
    print(f"Rendering {total} frames at {fps} FPS...")
    
    for i in range(total):
        t = i / fps
        frame = composite_frame(t, storyboard)
        frames.append(np.array(frame))
        
        if i % 10 == 0:  # Progress indicator
            print(f"Frame {i+1}/{total}")
    
    clip = ImageSequenceClip(frames, fps=fps)

    if audio_path:
        vo = AudioFileClip(audio_path).subclip(0, total_duration)
        clip = clip.set_audio(vo)

    clip.write_videofile(
        output_path, 
        codec="libx264", 
        audio_codec="aac" if audio_path else None, 
        fps=fps, 
        bitrate="6M",
        verbose=False,
        logger=None
    )
    
    print(f"Video saved to {output_path}")
