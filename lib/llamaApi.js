// llamaAPI.js

export async function getLlamaResponse(userPrompt) {
    const apiUrl = 'https://api.llama.com/v1/chat/completions';
    const apiKey = "LLM|1715966545708126|k13PL1i6ESgH3UAjuti9jGrVeCU";
  
    const payload = {
      model: "Llama-4-Maverick-17B-128E-Instruct-FP8",
      messages: [
        {
          role: "system",
          content: `You are an expert database architect that designs schemas for a no-code platform. Generate ALL necessary form schemas for the user's project in one response.

CRITICAL: Always include "appsId" field. Never use "name" field.

If multiple schemas are needed, return them as a JSON array. If only one schema is needed, return a single JSON object. All schemas must use the same appsId.

Format for single schema:
{
  "appsId": "CamelCaseAppName",
  "formId": "FormName",
  "description": "Brief description of what this form represents",
  "fields": { ... }
}

Format for multiple schemas:
[
  {
    "appsId": "CamelCaseAppName",
    "formId": "FormName1",
    "description": "Brief description",
    "fields": { ... }
  },
  {
    "appsId": "CamelCaseAppName", 
    "formId": "FormName2",
    "description": "Brief description",
    "fields": { ... }
  }
]

Field structure:
"fieldName": {
  "fieldId": "fieldName",
  "fieldType": "one of: TEXT, NUMERIC, BOOLEAN, MONEY, DATE, REF_PICK_LIST, EMBED",
  "required": true or false (optional),
  "unique": true or false (optional),
  "default": "default value (optional)",
  "allowMultiple": true or false (optional, for arrays)",
  "refPickListId": "FormName.fieldId (only for REF_PICK_LIST)",
  "fractionDigits": 2 (only required for MONEY fields),
  "currencyCode": "USD" (onlyrequired for MONEY fields),
  "embeddedFormSchema": {
    "fields": {
      "nestedField": {
        "fieldId": "nestedField",
        "fieldType": "..."
      }
    }
  }
}

Rules:
- ALWAYS include "appsId" field in CamelCase (e.g., "SchoolManagement", "EcommercePlatform")
- NEVER use "name" field - use "appsId" instead
- Valid fieldType values: TEXT, NUMERIC, BOOLEAN, MONEY, DATE, REF_PICK_LIST, EMBED
- For REF_PICK_LIST: include "refPickListId" as "FormName.fieldId"
- For MONEY: MUST include "fractionDigits" (typically 2) and "currencyCode" (e.g., "USD")
- For EMBED: include "embeddedFormSchema" with nested fields
- Use "required" not "isRequired"
- ALL schemas in response must have the SAME appsId
- Each field key in fields must match its fieldId
- Return ONLY the JSON (object or array), with NO explanation or extra text.
`
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      max_tokens: 1024
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
  