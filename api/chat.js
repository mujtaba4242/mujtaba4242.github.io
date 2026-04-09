export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const { system, messages } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // Log 1: Check if API key is actually loading
    console.log("API Key exists:", !!apiKey);

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system || "" }] },
        contents: messages.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }))
      })
    });

    const data = await response.json();

    // Log 2: Catch the exact error from Google
    if (!response.ok) {
      console.error("Google Error:", JSON.stringify(data));
      return res.status(response.status).json(data);
    }

    res.status(200).json({ text: data.candidates[0].content.parts[0].text });

  } catch (error) {
    // Log 3: Catch code crashes
    console.error("Crash Details:", error.message);
    res.status(500).json({ error: "Server Crash", message: error.message });
  }
}
