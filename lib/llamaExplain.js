export async function getLlamaExplanation(schema, userPrompt) {
  const apiUrl = 'https://api.llama.com/v1/chat/completions';
  const apiKey = "LLM|1715966545708126|k13PL1i6ESgH3UAjuti9jGrVeCU";

  const payload = {
    model: "Llama-4-Maverick-17B-128E-Instruct-FP8",
    messages: [
      {
        role: "system",
        content: `You are an expert database consultant explaining database schemas to non-technical business founders. Your goal is to help them understand what their database structure does and why it's useful for their business.

Please explain this database schema in simple, business-friendly language:

${JSON.stringify(schema, null, 2)}

Guidelines for your explanation:
- Use simple, non-technical language that a business owner would understand
- Explain what this database will help them organize and track
- Break down the different parts (fields) and explain why each is important
- Use real-world analogies (like "filing cabinet", "form", "folder")
- Focus on business benefits, not technical implementation
- Avoid technical jargon like "fieldId", "refPickListId", API details, etc.
- Keep explanations practical and actionable
- Use clear structure for readability
- DO NOT use markdown formatting like ** or __ - write in plain text only
- Use simple headings and bullet points with plain text formatting
- Include specific guidance on whether this works better as a relational database (PostgreSQL) or MongoDB document structure
- Explain the pros and cons of each approach for this specific use case
- Recommend which database type would be best and why

Start with what this database will help them organize, then explain the different parts and why each field matters for their business.`
      },
      {
        role: "user",
        content: `The user asked for: "${userPrompt}"

Here's what was created for them. Explain in simple terms what this database structure does, why each part is important for their business, and how they can use it:

${JSON.stringify(schema, null, 2)}

Focus on helping them understand:
1. What this database will help them organize
2. Why each type of information (field) is important
3. How the different parts work together
4. What they can do with this structure`
      }
    ],
    max_tokens: 512
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