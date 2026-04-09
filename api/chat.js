export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // 1. Ensure we have a body to work with
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { system, messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is missing' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    
    // 2. Call Google Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { 
            parts: [{ text: system || "You are a helpful assistant." }] 
          },
          contents: messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          }))
        })
      }
    );

    const data = await response.json();

    // 3. Check for Google-specific errors
    if (!response.ok) {
      console.error('Google API says:', data);
      return res.status(response.status).json({ error: data.error?.message || 'Google API Error' });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      return res.status(500).json({ error: 'No response from AI', debug: data });
    }

    res.status(200).json({ text });
  } catch (e) {
    console.error('Function Error:', e.message);
    res.status(500).json({ error: 'Server Error', details: e.message });
  }
}
