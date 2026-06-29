export async function embedText(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not configured. Embedding will be bypassed.');
    return null;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: {
          parts: [{ text }]
        },
        outputDimensionality: 768
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini embed API returned status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    if (data.embedding && data.embedding.values) {
      return data.embedding.values;
    } else {
      throw new Error('Invalid embedding response format from Gemini');
    }
  } catch (err) {
    console.error('Gemini embedding failed:', err);
    throw err;
  }
}
