// Simple test script to debug the API
const testPrompt = "Explain how photosynthesis works in plants";

async function testAPI() {
  try {
    console.log('Testing whiteboard API...');
    
    const response = await fetch('http://localhost:3000/api/generate-whiteboard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: testPrompt,
        voice: 'alloy',
        aspectRatio: '16:9',
        duration: 60,
        language: 'English'
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }

    const data = await response.json();
    console.log('Success! Video size:', data.video ? data.video.length : 'No video');
    console.log('Script scenes:', data.script?.scenes?.length || 0);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAPI();
