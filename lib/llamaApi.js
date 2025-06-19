// llamaAPI.js

export async function getLlamaResponse(userPrompt) {
    const apiUrl = 'https://api.llama.com/v1/chat/completions';
    const apiKey = "LLM|1715966545708126|k13PL1i6ESgH3UAjuti9jGrVeCU";
  
    const payload = {
      model: "Llama-4-Maverick-17B-128E-Instruct-FP8",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that generates JSON schemas for MongoDB based on the user's description. Give a 'formID' and Ensure each field includes 'fieldId', 'fieldType', and/or (depending on user request) other attributes like 'decimalPlaces', 'length', 'refFormId', 'refPickListId', 'isAllowMultiple', and 'embeddedFormSchema'. The 'fieldType' must be one of: TEXT, NUMERIC, BOOLEAN, CURRENCY, DATE_TIME, IMAGE, DATE, TIME, EMAIL, URL, REF_FORM, REF_PICK_LIST, EMBED."        },
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
      return data.completion_message.content.text; // Adjusted to match the response structure
    } catch (error) {
      console.error('Error contacting Llama API:', error);
      throw error;
    }
  }
  