// Test script for whiteboard animation functionality
const fetch = require('node-fetch');

async function testWhiteboardAnimation() {
  console.log('Testing whiteboard animation generation...');
  
  try {
    const response = await fetch('http://localhost:3000/api/generate-whiteboard-animation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'A simple house with a tree next to it',
        aspectRatio: '16:9',
        duration: 10,
        strokeStyle: '#000000',
        lineWidth: 3,
        animationSpeed: 30
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Whiteboard animation generated successfully!');
      console.log(`Video size: ${result.video ? result.video.length : 0} characters (base64)`);
      console.log(`Image size: ${result.image ? result.image.length : 0} characters (base64)`);
      console.log(`Paths extracted: ${result.paths ? result.paths.length : 0}`);
      console.log(`Duration: ${result.duration}s`);
    } else {
      console.log('❌ Whiteboard animation generation failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test the job creation with whiteboard mode
async function testJobCreation() {
  console.log('\nTesting job creation with whiteboard mode...');
  
  try {
    const response = await fetch('http://localhost:3000/api/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'Explain how photosynthesis works',
        aspectRatio: '16:9',
        duration: 60,
        languages: ['en'],
        generationMode: 'whiteboard',
        useAvatar: false,
        ttsProvider: 'openai',
        openaiVoice: 'alloy'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    
    console.log('✅ Job created successfully!');
    console.log(`Job ID: ${result.id}`);
    console.log(`Status: ${result.status}`);
    console.log(`Generation Mode: ${result.generationMode}`);
    
    return result.id;
  } catch (error) {
    console.error('❌ Job creation test failed:', error.message);
    return null;
  }
}

// Run tests
async function runTests() {
  console.log('🧪 Starting whiteboard animation tests...\n');
  
  // Test 1: Direct whiteboard animation API
  await testWhiteboardAnimation();
  
  // Test 2: Job creation with whiteboard mode
  const jobId = await testJobCreation();
  
  if (jobId) {
    console.log(`\n📋 Job created with ID: ${jobId}`);
    console.log('You can monitor the job status at: http://localhost:3000/?jobId=' + jobId);
  }
  
  console.log('\n✨ Tests completed!');
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/api/health');
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Main execution
async function main() {
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ Server is not running. Please start the development server first:');
    console.log('   npm run dev');
    process.exit(1);
  }
  
  await runTests();
}

main().catch(console.error);

