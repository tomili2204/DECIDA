async function testGemini() {
  const apiKey = 'AQ.Ab8RN6JAz1rCjF3iTT3iU8L74g8lTVcLyMcyQzqDArMGdEL4Ag'
  console.log('Testing Gemini API...')
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: "Hello, what model are you?" }]
          }
        ]
      })
    })

    const data = await res.json()
    console.log('Status:', res.status)
    if (!res.ok) {
      console.log('Error Details:', JSON.stringify(data, null, 2))
    } else {
      console.log('Success! Response:', data.candidates?.[0]?.content?.parts?.[0]?.text)
    }
  } catch (err) {
    console.log('Exception:', err.message)
  }
}

testGemini()
