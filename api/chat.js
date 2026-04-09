export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { system, messages, password, action } = body;

    // Password verification action
    if (action === 'verify') {
      const correct = process.env.APP_PASSWORD;
      if (password === correct) return res.status(200).json({ success: true });
      return res.status(401).json({ success: false });
    }

    // Block unauthenticated AI requests
    const correct = process.env.APP_PASSWORD;
    if (password !== correct) return res.status(401).json({ error: 'Unauthorized' });

    const apiKey = process.env.GEMINI_API_KEY;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system || 'You are Radd, a professional strategic assistant.' }] },
        contents: messages.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }))
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'AI service error' });

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return res.status(500).json({ error: 'AI returned empty response' });

    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: 'Server Error', message: e.message });
  }
}
