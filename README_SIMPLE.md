# Prompt2Video - Simplified Version

Transform your ideas into professional explainer videos with AI. This simplified version requires **no database, Redis, or S3** - just API keys and FFmpeg!

## ✨ Features

- **AI-Powered Script Generation**: OpenAI GPT-4 creates structured video scripts
- **Dynamic Visual Content**: DALL-E 3 generates consistent images for each scene
- **Professional Narration**: HeyGen TTS creates high-quality voiceovers
- **Automatic Video Composition**: FFmpeg assembles everything into a polished MP4
- **No External Dependencies**: Works with just API keys and local file storage
- **Real-time Processing**: Jobs process immediately without queuing systems

## 🚀 Quick Start

### Prerequisites

1. **Node.js 18+** and npm
2. **FFmpeg** installed on your system
3. **OpenAI API key** for script and image generation
4. **HeyGen API key** for text-to-speech

### Installation

1. **Clone and install**:
   ```bash
   git clone <repository-url>
   cd prompt2video
   npm install
   ```

2. **Install FFmpeg**:
   
   **macOS (with Homebrew):**
   ```bash
   brew install ffmpeg
   ```
   
   **Ubuntu/Debian:**
   ```bash
   sudo apt update
   sudo apt install ffmpeg
   ```
   
   **Windows:**
   Download from [FFmpeg official site](https://ffmpeg.org/download.html)

3. **Set up environment variables**:
   ```bash
   cp env.sample .env.local
   ```
   
   Edit `.env.local` with your API keys:
   ```env
   OPENAI_API_KEY="your_openai_api_key_here"
   HEYGEN_API_KEY="your_heygen_api_key_here"
   NODE_ENV="development"
   ```

4. **Start the application**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   Navigate to `http://localhost:3000`

## 🎯 Testing Without API Keys

Want to test the app first? Use demo mode:

```bash
npm run dev:demo
```

Then visit `http://localhost:3000/demo` to see the interface and workflow with mock data.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── jobs/          # Job management
│   │   ├── health/        # Health checks
│   │   └── demo/          # Demo mode
│   ├── demo/              # Demo page
│   └── page.tsx           # Main UI
├── lib/                   # Core utilities
│   ├── memory-storage.ts  # In-memory data storage
│   ├── simple-processor.ts # Job processing
│   ├── openai.ts          # OpenAI integration
│   ├── heygen.ts          # HeyGen integration
│   ├── video-composer.ts  # FFmpeg operations
│   ├── mock-openai.ts     # Mock OpenAI for demo
│   └── mock-heygen.ts     # Mock HeyGen for demo
└── types/                 # TypeScript definitions
    └── index.ts
```

## 🔧 How It Works

### Video Generation Pipeline

1. **Script Generation**: OpenAI GPT-4 creates a structured script with 4-6 scenes
2. **Image Generation**: DALL-E 3 generates consistent visual assets for each scene
3. **Audio Synthesis**: HeyGen TTS creates professional narration
4. **Video Composition**: FFmpeg assembles everything into a final MP4

### Data Storage

- **In-Memory Storage**: Jobs, steps, and assets stored in memory during processing
- **Local File System**: Generated files stored in `./temp/storage/` directory
- **Automatic Cleanup**: Temporary files cleaned up after job completion

## 🛠️ API Endpoints

### POST `/api/jobs`
Create a new video generation job.

**Request Body:**
```json
{
  "prompt": "Explain how photosynthesis works",
  "aspectRatio": "16:9",
  "duration": 150,
  "language": "English",
  "voiceId": "optional_voice_id"
}
```

**Response:**
```json
{
  "id": "job_1234567890_abc123",
  "status": "QUEUED",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### GET `/api/jobs/:id`
Get job status and results.

**Response:**
```json
{
  "id": "job_1234567890_abc123",
  "status": "DONE",
  "resultUrl": "file:///path/to/video.mp4",
  "steps": [...],
  "assets": [...]
}
```

### GET `/api/health`
Check system health.

**Response:**
```json
{
  "status": "healthy",
  "services": {
    "memory_storage": "healthy",
    "processor": "healthy"
  },
  "stats": {
    "jobs": 5,
    "steps": 20,
    "assets": 15,
    "processing": 1
  }
}
```

## 🎨 Customization

### Video Settings
- **Aspect Ratios**: 16:9 (landscape), 9:16 (portrait), 1:1 (square)
- **Durations**: 2-3 minutes (120-180 seconds)
- **Languages**: English, Spanish, French, German
- **Voice Selection**: Use HeyGen voice IDs for custom voices

### Style Profiles
Modify the default style in `src/lib/openai.ts`:
```typescript
const STYLE_PROFILE = "Your custom style description here"
```

## 🐛 Troubleshooting

### Common Issues

1. **FFmpeg not found**:
   - Ensure FFmpeg is installed and in your PATH
   - Test with `ffmpeg -version`

2. **API key errors**:
   - Verify your OpenAI and HeyGen API keys are valid
   - Check your `.env.local` file

3. **Memory issues**:
   - Large videos may consume significant memory
   - Consider processing shorter videos for testing

4. **File permissions**:
   - Ensure the app can write to the `./temp` directory
   - Check file permissions on your system

### Logs

- **API logs**: Check Next.js development server output
- **Processing logs**: Monitor console output for job processing
- **File logs**: Check `./temp/storage/` for generated files

## 🚀 Production Considerations

### Scaling
- **Memory Usage**: Each job uses memory for processing - monitor usage
- **File Storage**: Consider moving to cloud storage for production
- **Processing Time**: Video generation can take several minutes

### Security
- **API Keys**: Store securely in environment variables
- **File Cleanup**: Implement regular cleanup of temporary files
- **Rate Limiting**: Consider implementing rate limiting for API endpoints

## 📝 Development

### Adding Features
1. **New AI Providers**: Add integrations in `src/lib/`
2. **Video Effects**: Extend `video-composer.ts`
3. **UI Components**: Add to `src/app/`
4. **API Endpoints**: Add to `src/app/api/`

### Testing
- Use demo mode for UI/UX testing
- Test with real API keys for full functionality
- Monitor memory usage during development

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Ready to create amazing videos?** Start with demo mode, then add your API keys for real video generation!


