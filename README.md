# Prompt2Video 🎬

**Transform text prompts into professional videos with AI-powered storyboarding and real-time editing.**

A Next.js application that generates videos from text descriptions using OpenAI for script generation, HeyGen for voice synthesis, and FFmpeg for video composition. Features an interactive storyboard workflow where users can review, edit, and regenerate content before final video generation.

## 🚀 How It Works - Complete Workflow

### Step 1: Prompt Input
- **Enter your video concept** - Describe what you want to create (e.g., "Create a 2-3 minute video on Anaphylaxis adverse events following vaccination in Africa")
- **Set parameters** - Choose aspect ratio (16:9, 9:16, 1:1), duration, language, and optional voice ID
- **Submit for storyboard generation**

### Step 2: AI Script Generation
- **OpenAI GPT-4** analyzes your prompt and generates a structured video script
- **Creates multiple scenes** with:
  - Scene goals and objectives
  - Detailed narration text
  - Image descriptions for visual content
  - Timing and duration for each scene
- **Returns estimated costs** and total video duration

### Step 3: Interactive Storyboard Review
- **Review the generated script** scene by scene
- **Edit any content** directly in the interface:
  - Modify narration text
  - Adjust image descriptions
  - Change scene timing
  - Reorder or remove scenes
- **Regenerate script** if needed with updated requirements
- **Preview the complete storyboard** before proceeding

### Step 4: Content Generation
Once you confirm the storyboard, the system generates all assets:

#### 4a. Image Generation
- **OpenAI DALL-E** creates custom images for each scene
- **High-resolution visuals** matching your descriptions
- **Consistent style** across all scenes

#### 4b. Voice Synthesis
- **HeyGen API** converts narration text to natural speech
- **Professional voice quality** with proper pacing
- **Synchronized timing** with scene durations

#### 4c. Video Composition
- **FFmpeg** combines images and audio into final MP4
- **Ken Burns effect** on images for visual interest
- **Text overlays** with scene captions
- **Smooth transitions** between scenes
- **Professional video output** ready for sharing

### Step 5. Real-time Progress Monitoring
- **Live job status** updates as each step completes
- **Progress indicators** for Script → Images → Narration → Composition
- **Error handling** with detailed feedback
- **Cost tracking** throughout the process

### Step 6. Final Video Delivery
- **Downloadable MP4** file with your complete video
- **Professional quality** suitable for presentations, social media, or training
- **Custom branding** and styling options
- **Multiple format support** (16:9, 9:16, 1:1)

## 🌍 Multi-Language Workflow

### Step 1: Multi-Language Setup
- **Select primary language** - Choose the main language for script generation
- **Choose target languages** - Pick from 100+ supported languages
- **Organized selection** - Browse by region (European, Asian, Middle Eastern, etc.)
- **Popular languages** - Quick access to most commonly used languages

### Step 2: Content Generation
- **Single script generation** - Create script in primary language
- **Shared visual assets** - Same images and composition for all languages
- **Parallel audio processing** - Generate narration for each target language simultaneously
- **Language-specific voices** - Use appropriate voice characteristics for each language

### Step 3: Video Composition
- **Individual video files** - Separate MP4 for each language
- **Consistent visual quality** - Identical composition across all versions
- **Localized audio tracks** - Native language narration for each version
- **Batch processing** - Efficient generation of multiple language versions

### Step 4. Multi-Language Results
- **Download all versions** - Individual download links for each language
- **Progress tracking** - Real-time status for each language generation
- **Error handling** - Graceful handling of failed language generations
- **Cost optimization** - Shared visual generation reduces overall costs

## 🎯 Key Features

### Interactive Storyboard Workflow
- **Edit before generating** - Review and modify content before expensive API calls
- **Real-time preview** - See exactly what your video will contain
- **Cost control** - Avoid regenerating entire videos for small changes
- **Quality assurance** - Ensure content meets your requirements

### Multi-Language Video Generation 🌍
- **100+ supported languages** - Generate videos in any HeyGen-supported language
- **Same visual content** - All language versions use identical images and composition
- **Localized audio** - Native language narration with appropriate voice characteristics
- **Batch processing** - Generate multiple language versions simultaneously
- **Organized language groups** - Easy selection by region (European, Asian, etc.)
- **Progress tracking** - Real-time status for each language version

### AI-Powered Content Creation
- **Intelligent script generation** - Context-aware video planning
- **Visual storytelling** - AI creates compelling image descriptions
- **Natural voice synthesis** - Professional-quality narration
- **Smart timing** - Automatic pacing and duration optimization

### Professional Video Output
- **High-quality composition** - FFmpeg-powered video processing
- **Multiple aspect ratios** - Support for different platforms
- **Custom styling** - Text overlays, transitions, and effects
- **Scalable processing** - Handle videos of any length

## 🛠️ Technical Architecture

### Frontend
- **Next.js 15** with App Router
- **React 19** with modern hooks
- **Tailwind CSS** for styling
- **Real-time updates** with polling

### Backend Services
- **OpenAI API** - Script generation and image creation
- **HeyGen API** - Voice synthesis and audio generation
- **FFmpeg** - Video composition and processing
- **In-memory storage** - No database required

### Processing Pipeline
1. **Script Generation** → OpenAI GPT-4
2. **Image Creation** → OpenAI DALL-E
3. **Audio Synthesis** → HeyGen API
4. **Video Composition** → FFmpeg
5. **File Storage** → Local filesystem

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- FFmpeg installed
- OpenAI API key
- HeyGen API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/danrublop/prompt2video.git
   cd prompt2video
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.sample .env
   # Edit .env with your API keys
   ```

4. **Install FFmpeg** (see [FFMPEG_SETUP.md](./FFMPEG_SETUP.md))

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   ```
   http://localhost:3000
   ```

### Demo Mode
Test the app without API keys:
```bash
npm run dev:demo
```
Visit `http://localhost:3000/demo` for a fully functional demo with mock data.

## 📁 Project Structure

```
prompt2video/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API routes
│   │   ├── demo/           # Demo page
│   │   ├── storyboard/     # Storyboard editor
│   │   └── page.tsx        # Main page
│   ├── lib/                # Core libraries
│   │   ├── openai.ts       # OpenAI integration
│   │   ├── heygen.ts       # HeyGen integration
│   │   ├── video-composer.ts # FFmpeg video processing
│   │   ├── memory-storage.ts # In-memory data storage
│   │   └── simple-processor.ts # Job processing
│   └── types/              # TypeScript definitions
├── temp/                   # Temporary file storage
├── FFMPEG_SETUP.md         # FFmpeg installation guide
├── TESTING.md              # Testing documentation
└── README.md               # This file
```

## 🔧 Configuration

### Environment Variables
```bash
# Required
OPENAI_API_KEY=your_openai_api_key_here
HEYGEN_API_KEY=your_heygen_api_key_here

# Optional
TEMP_DIR=./temp
```

### FFmpeg Setup
See [FFMPEG_SETUP.md](./FFMPEG_SETUP.md) for detailed installation instructions.

## 🎨 Customization

### Video Styles
- **Aspect ratios**: 16:9, 9:16, 1:1
- **Durations**: 30 seconds to 10+ minutes
- **Languages**: English, Spanish, French, German
- **Voice options**: Multiple HeyGen voice IDs

### Visual Effects
- **Ken Burns effect** on images
- **Text overlays** with custom styling
- **Smooth transitions** between scenes
- **Professional color grading**

## 🚨 Troubleshooting

### Common Issues
- **FFmpeg not found**: Install FFmpeg and restart the server
- **API key errors**: Verify your keys in `.env`
- **Video generation fails**: Check FFmpeg installation and file permissions
- **Memory issues**: Large videos may require more RAM

### Debug Mode
Enable detailed logging by setting `NODE_ENV=development` and check the console for error details.

## 📊 Performance

### Processing Times
- **Script generation**: 2-5 seconds
- **Image creation**: 10-30 seconds per image
- **Audio synthesis**: 5-15 seconds per scene
- **Video composition**: 30-60 seconds for 2-minute video

### Cost Estimates
- **OpenAI**: ~$0.05-0.20 per video
- **HeyGen**: ~$0.24 per scene
- **Total**: ~$1-3 per 2-minute video

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **OpenAI** for GPT-4 and DALL-E APIs
- **HeyGen** for voice synthesis
- **FFmpeg** for video processing
- **Next.js** for the React framework
- **Tailwind CSS** for styling

---

**Ready to create amazing videos from text?** Start with the demo mode to explore the workflow, then add your API keys for real video generation! 🎬✨