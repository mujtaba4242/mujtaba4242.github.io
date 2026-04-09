export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { system, messages } = body;
    const apiKey = process.env.GEMINI_API_KEY;

    // Use gemini-2.5-flash which is the current 2026 stable workhorse
    // Models MUST have the 'models/' prefix inside the URL path now
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { 
          parts: [{ text: system || "You are Radd, a professional strategic assistant." }] 
        },
        contents: messages.map(m => ({
          // Google API is strict: role must be 'model' (for AI) or 'user' (for person)
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }))
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Google API Error:', JSON.stringify(data));
      return res.status(response.status).json({ 
        error: data.error?.message || 'The AI service is currently resetting.',
        code: data.error?.code 
      });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return res.status(500).json({ error: 'AI returned an empty response' });

    return res.status(200).json({ text });

  } catch (e) {
    console.error('Vercel Handler Crash:', e.message);
    return res.status(500).json({ error: 'Server Error', message: e.message });
  }
}
