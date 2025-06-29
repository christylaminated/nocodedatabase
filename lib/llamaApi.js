// llamaAPI.js

export async function getLlamaResponse(userPrompt) {
    const apiUrl = 'https://api.llama.com/v1/chat/completions';
    const apiKey = "LLM|1715966545708126|k13PL1i6ESgH3UAjuti9jGrVeCU";
  
    const payload = {
      model: "Llama-4-Maverick-17B-128E-Instruct-FP8",
      messages: [
        {
          role: "system",
          content: `You are an expert database architect that is designing two or more schemas based on user need. Your task is to generate one or more MongoDB-compatible schemas for a no-code platform based on a user's description.\n\nReturn the schema in this exact JSON format:\n{\n  "formId": "yourSchemaName",\n  "fields": {\n    "fieldName1": {\n      "fieldId": "fieldName1",\n      "fieldType": "one of: TEXT, NUMERIC, BOOLEAN, REF_FORM (if REF_FORM, include refFormId) ",\n      "isPrimary": true or false (optional),\n "isRequired": true or false (optional),\n    },\n    "fieldName2": {\n      "fieldId": "fieldName2",\n      "fieldType": "..."\n    }\n  }\n}\n\nRules:\n- Only use valid fieldType values: TEXT, NUMERIC, BOOLEAN, REF_FORM "\n- Set "formId" to a lowercase plural noun that describes the entity\n- Each field key in fields must match its fieldId\n- Return ONLY the JSON object, with NO explanation or extra text.`
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
      console.log("API Response:", data); // Log the entire response
      
      // Handle different possible response structures
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
  