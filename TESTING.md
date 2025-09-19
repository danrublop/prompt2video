# Testing Prompt2Video Without API Keys

This guide shows you how to test the Prompt2Video app without setting up real API keys or external services.

## Quick Start (Demo Mode)

### Option 1: Use the Demo Page
1. Start the development server:
   ```bash
   npm run dev:demo
   ```

2. Open your browser and go to:
   ```
   http://localhost:3000/demo
   ```

3. Enter a prompt and click "Generate Demo Video" to see how the app works with mock data.

### Option 2: Test the Main App (Limited)
1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser and go to:
   ```
   http://localhost:3000
   ```

3. The app will start but video generation will fail without real API keys.

## What Works in Demo Mode

✅ **UI/UX Testing**: All forms, buttons, and user interactions work perfectly
✅ **Script Generation**: Mock script generation based on your prompt
✅ **API Structure**: All API endpoints respond correctly
✅ **Error Handling**: Proper error messages and loading states
✅ **Form Validation**: Input validation and user feedback
✅ **Responsive Design**: Mobile and desktop layouts

## What's Simulated

🔄 **OpenAI API**: Mock responses for script generation and image creation
🔄 **HeyGen API**: Mock responses for text-to-speech generation
🔄 **Video Processing**: Simulated video composition (no real video output)
🔄 **Database**: No database required for demo mode
🔄 **File Storage**: Mock file handling

## Testing Different Scenarios

### 1. Basic Functionality
- Enter different prompts to see how the script generation adapts
- Test different aspect ratios (16:9, 9:16, 1:1)
- Try different durations (2, 2.5, 3 minutes)
- Test different languages

### 2. Error Handling
- Submit empty prompts to test validation
- Test with very long prompts
- Test with special characters

### 3. UI/UX Testing
- Test on different screen sizes
- Test form interactions
- Test loading states and progress indicators

## Files Created for Testing

- `src/app/demo/page.tsx` - Demo page that works without API keys
- `src/app/api/demo/route.ts` - Mock API endpoint
- `src/lib/mock-openai.ts` - Mock OpenAI implementation
- `src/lib/mock-heygen.ts` - Mock HeyGen implementation

## Next Steps for Real Implementation

When you're ready to use real API keys:

1. **Set up environment variables**:
   ```bash
   cp env.sample .env.local
   # Edit .env.local with your real API keys
   ```

2. **Required services**:
   - OpenAI API key for script and image generation
   - HeyGen API key for text-to-speech
   - FFmpeg installed on your system for video processing
   - **No database, Redis, or S3 required!**

3. **Install FFmpeg**:
   ```bash
   # macOS
   brew install ffmpeg
   
   # Ubuntu/Debian
   sudo apt update && sudo apt install ffmpeg
   
   # Windows
   # Download from https://ffmpeg.org/download.html
   ```

4. **Start the app**:
   ```bash
   npm run dev
   ```

## Troubleshooting

### Demo Mode Not Working
- Make sure you're using `npm run dev:demo` or visiting `/demo`
- Check the browser console for any errors
- Ensure all dependencies are installed: `npm install`

### API Errors
- The demo mode uses mock implementations, so API errors should be minimal
- If you see errors, check that the mock files are properly created

### Database Errors
- Demo mode doesn't require a database
- If you see database errors, make sure you're using the demo page

## Development Tips

1. **Test the UI first**: Use demo mode to perfect the user experience
2. **Iterate quickly**: Make changes and see them immediately in demo mode
3. **Test edge cases**: Try unusual inputs to ensure robust error handling
4. **Mobile testing**: Test on different devices and screen sizes

This testing approach lets you develop and refine the app without the complexity of setting up external services first!
