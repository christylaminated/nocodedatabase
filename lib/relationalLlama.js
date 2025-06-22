export async function getRelationalLlamaResponse(userPrompt) {
  const apiUrl = 'https://api.llama.com/v1/chat/completions';
  const apiKey = "LLM|1715966545708126|k13PL1i6ESgH3UAjuti9jGrVeCU";

  const payload = {
    model: "Llama-4-Maverick-17B-128E-Instruct-FP8",
    messages: [
      {
        role: "system",
        content: `You are an expert database architect. I want to create a relational database using PostgreSQL. Based on the description below, generate the appropriate SQL \`CREATE TABLE\` statements.\n\nPlease:\n- Use proper SQL syntax for PostgreSQL.\n- Infer logical table separations (normalize data where needed).\n- Add appropriate primary keys, foreign keys, and constraints.\n- Use data types like \`TEXT\`, \`INTEGER\`, \`BOOLEAN\`, \`DATE\`, etc.\n- Ensure important fields like IDs and emails are unique.\n- Include \`NOT NULL\` constraints where applicable.\n- Use \`REFERENCES\` to establish relationships between tables.\n\nHere is the database description:`
      },
      {
        role: "user",
        content: userPrompt
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