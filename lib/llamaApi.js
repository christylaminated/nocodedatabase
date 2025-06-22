// llamaAPI.js

export async function getLlamaResponse(userPrompt) {
    const apiUrl = 'https://api.llama.com/v1/chat/completions';
    const apiKey = "LLM|1715966545708126|k13PL1i6ESgH3UAjuti9jGrVeCU";
  
    const payload = {
      model: "Llama-4-Maverick-17B-128E-Instruct-FP8",
      messages: [
        {
          role: "system",
          content: "Please organize the following information in the best way possible. Use multiple separate data structures (like different forms, tables, or collections) if the data naturally belongs in different groups. Each structure should: Include only closely related fields Be returned as its own top-level schema (no nesting) Have a name and a list of fields with clear types Indicate which fields are required (i.e., NOT NULL) Include constraints such as min, max, patterns, or uniqueness where appropriate Output the result as a JSON array of schemas. You are an expert database architect. Your task is to generate one or more JSON schemas for MongoDB based on a user's description. For complex requests, break down the data into multiple, related schemas. Use the 'REF_FORM' FieldType to create relationships between schemas. Always return a JSON array of schemas, even if there's only one.\n\nFor example, if a user asks for 'customers and orders', you should create a 'Customers' schema and an 'Orders' schema. In this setup, the 'Orders' schema should include a 'customerId' field with fieldType: REF_FORM and refFormId: 'customers_form_id'. Ensure each field has a fieldId and a valid fieldType from the following list: TEXT, NUMERIC, BOOLEAN, CURRENCY, DATE_TIME, IMAGE, DATE, TIME, EMAIL, URL, REF_FORM, REF_PICK_LIST, EMBED.\n\nAdditional attributes such as decimalPlaces, length, and isAllowMultiple should be included where applicable to accurately represent the constraints and specifications of each field."
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
  