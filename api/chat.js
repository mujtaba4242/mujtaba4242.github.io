export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { system, messages } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    
    // Updated for 2026: Using the v1beta endpoint with the 2.5 series
    // Note: The "models/" prefix is required inside the path for this version
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { 
          parts: [{ text: system || "You are Radd, a professional assistant." }] 
        },
        contents: messages.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }))
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Google API Error:', JSON.stringify(data));
      // If 429 persists, it's a project-level cooling period
      return res.status(response.status).json({ 
        error: data.error?.message || 'AI Service is currently restricted',
        code: data.error?.code 
      });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return res.status(500).json({ error: 'AI returned an empty response' });

    return res.status(200).json({ text });

  } catch (e) {
    console.error('Vercel Handler Error:', e.message);
    return res.status(500).json({ error: 'Server Error', message: e.message });
  }
}
