export async function getLlamaExplanation(schema, userPrompt) {
  const apiUrl = 'https://api.llama.com/v1/chat/completions';
  const apiKey = "LLM|1715966545708126|k13PL1i6ESgH3UAjuti9jGrVeCU";

  const payload = {
    model: "Llama-4-Maverick-17B-128E-Instruct-FP8",
    messages: [
      {
        role: "system",
        content: `You are an expert database educator.`
      },
      {
        role: "user",
        content: `Explain the following database schema in the context of this user request like you are a teacher explaining to a student: "${userPrompt}".\n\nSchema:\n${JSON.stringify(schema, null, 2)}`
      }
    ],
    max_tokens: 256
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Llama API Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    let content;
    if (data.choices && data.choices[0] && data.choices[0].message) {
      content = data.choices[0].message.content;
    } else if (data.completion_message && data.completion_message.content) {
      content = data.completion_message.content.text || data.completion_message.content;
    } else if (data.content) {
      content = data.content;
    } else {
      throw new Error('Unexpected API response structure');
    }
    return content;
  } catch (error) {
    console.error('Error contacting Llama API:', error);
    throw error;
  }
} 