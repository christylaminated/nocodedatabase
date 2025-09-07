"use client"

import { useState, useRef } from "react"
import { Sparkles, Database, Upload, X, AlertCircle, CheckCircle, Loader2, FileText, Edit3, Eye } from "lucide-react"
import GenerateActions from "@/components/prompt/GenerateActions"
import { getLlamaResponse } from "@/lib/llamaApi"

interface AiPromptTabProps {
  prompt: string
  onPromptChange: (prompt: string) => void
  onSchemaGenerated: (schema: any, projectName: string) => void
  isGenerating: boolean
  setIsGenerating: (generating: boolean) => void
  setMessage?: (message: string) => void
  setMessageType?: (type: string) => void
}

// Predefined booking schema for preview
const bookingSchema = {
  "formId": "bookings",
  "fields": {
    "eventName": {
      "fieldId": "eventName",
      "fieldType": "TEXT",
      "isRequired": true
    },
    "eventDate": {
      "fieldId": "eventDate",
      "fieldType": "TEXT",
      "isRequired": true
    },
    "attendeeName": {
      "fieldId": "attendeeName",
      "fieldType": "TEXT",
      "isRequired": true
    },
    "attendeeEmail": {
      "fieldId": "attendeeEmail",
      "fieldType": "TEXT",
      "isRequired": true
    },
    "ticketQuantity": {
      "fieldId": "ticketQuantity",
      "fieldType": "NUMERIC",
      "isRequired": true
    },
    "specialRequirements": {
      "fieldId": "specialRequirements",
      "fieldType": "TEXT",
      "isRequired": false
    }
  }
}

export default function AiPromptTab({
  prompt,
  onPromptChange,
  onSchemaGenerated,
  isGenerating,
  setIsGenerating,
  setMessage,
  setMessageType
}: AiPromptTabProps) {
  const [showBookingPreview, setShowBookingPreview] = useState(false)
  const [previewMessage, setPreviewMessage] = useState("")
  const examplePrompts = [
    {
      icon: <Database className="w-4 h-4 text-blue-600" />,
      text: "I want to track students and their course enrollments. Each student should have a name, email, major, and GPA that is automatically calculated from their grades. Each course should have a name, code, and instructor. I also want to log each student's grades for different assignments, and only show a 'makeup submission' field if the original grade is below 60.",
      category: "Student Management",
      action: "generate"
    },
    {
      icon: <Edit3 className="w-4 h-4 text-purple-600" />,
      text: "I want to track employee information including departments and hire dates",
      category: "HR Management",
      action: "generate"
    },
    {
      icon: <Eye className="w-4 h-4 text-indigo-600" />,
      text: "Set up event bookings with attendee details and ticket quantities",
      category: "Event Management",
      action: "preview"
    },
  ]

  // Enhanced parser to extract all top-level JSON objects from a string
  function extractJsonObjects(str: string): string[] {
    const objects: string[] = []
    let depth = 0
    let start: number | null = null
    let inString = false
    let escapeNext = false
    
    for (let i = 0; i < str.length; i++) {
      const char = str[i]
      
      // Handle string literals and escape characters
      if (char === '"' && !escapeNext) {
        inString = !inString
      } else if (char === '\\' && inString) {
        escapeNext = true
        continue
      }
      
      escapeNext = false
      
      // Only process braces when not inside a string
      if (!inString) {
        if (char === '{') {
          if (depth === 0) start = i
          depth++
        } else if (char === '}') {
          depth--
          if (depth === 0 && start !== null) {
            const objStr = str.slice(start, i + 1)
            objects.push(objStr)
            start = null
          }
        }
      }
    }
    return objects
  }
  
  // Try to sanitize and fix common JSON issues
  function sanitizeJsonString(str: string): string {
    // Remove markdown code block markers
    let result = str.replace(/```(json|javascript|js)?|```/gi, '')
    
    // Trim whitespace
    result = result.trim()
    
    // Ensure the string starts with { and ends with }
    const firstBrace = result.indexOf('{')
    const lastBrace = result.lastIndexOf('}')
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      result = result.substring(firstBrace, lastBrace + 1)
    }
    
    return result
  }

  const handleCreateDatabase = async () => {
    if (!prompt.trim()) {
      return
    }
    
    setIsGenerating(true)
    try {
      console.log("1. Calling LLM with prompt:", prompt)
      const generatedSchema = await getLlamaResponse(prompt)
      
      // Log the full LLM response for debugging
      console.log("%c--- FULL LLM RESPONSE START ---", "color: green; font-weight: bold")
      console.log(generatedSchema)
      console.log("%c--- FULL LLM RESPONSE END ---", "color: green; font-weight: bold")
      
      console.log("2. LLM Response summary:", generatedSchema.substring(0, 100) + "...")
      
      let schemas = []
      
      // First approach: Try to extract JSON code blocks
      console.log('3. Extracting JSON code blocks from LLM response')
      const codeBlocks = [...generatedSchema.matchAll(/```(?:json|javascript|js)?\s*([\s\S]+?)```/gi)]
      console.log(`4. Found ${codeBlocks.length} JSON code blocks`)
      
      if (codeBlocks.length > 0) {
        // Process each code block
        for (let i = 0; i < codeBlocks.length; i++) {
          const match = codeBlocks[i]
          console.log(`5. Processing code block ${i+1}/${codeBlocks.length}`)
          console.log(`Raw code block ${i+1}:`, match[1])
          
          const sanitizedBlock = sanitizeJsonString(match[1])
          console.log(`Sanitized code block ${i+1}:`, sanitizedBlock)
          
          const objects = extractJsonObjects(sanitizedBlock)
          console.log(`Extracted JSON objects from block ${i+1}:`, objects)
          
          if (objects.length > 0) {
            console.log(`6. Extracted ${objects.length} JSON objects from code block ${i+1}`)
            
            for (let j = 0; j < objects.length; j++) {
              try {
                const parsedObj = JSON.parse(objects[j])
                console.log(`7. Successfully parsed JSON object ${j+1}/${objects.length}`)
                schemas.push(parsedObj)
              } catch (e) {
                console.error(`Error parsing JSON object ${j+1}/${objects.length}:`, e)
                // Try to fix common JSON issues and try again
                try {
                  // Replace single quotes with double quotes
                  const fixedStr = objects[j].replace(/'/g, '"')
                  const parsedObj = JSON.parse(fixedStr)
                  console.log(`7b. Successfully parsed fixed JSON object ${j+1}/${objects.length}`)
                  schemas.push(parsedObj)
                } catch (e2) {
                  console.error('Failed to fix JSON object:', e2)
                }
              }
            }
          }
        }
      }
      
      // If no schemas found from code blocks, try the entire response
      if (schemas.length === 0) {
        console.log('8. No schemas found in code blocks, trying alternative approaches')
        
        // Try to extract JSON objects from the entire response
        const sanitizedResponse = sanitizeJsonString(generatedSchema)
        console.log('9. Sanitized full response:', sanitizedResponse.substring(0, 200) + '...')
        
        const objects = extractJsonObjects(sanitizedResponse)
        console.log('10. Extracted objects from full response:', objects)
        
        if (objects.length > 0) {
          console.log(`11. Extracted ${objects.length} JSON objects from entire response`)
          
          for (let i = 0; i < objects.length; i++) {
            try {
              const parsedObj = JSON.parse(objects[i])
              console.log(`10. Successfully parsed JSON object ${i+1}/${objects.length}`)
              schemas.push(parsedObj)
            } catch (e) {
              console.error(`Error parsing JSON object ${i+1}/${objects.length}:`, e)
              // Try with single quote replacement
              try {
                const fixedStr = objects[i].replace(/'/g, '"')
                const parsedObj = JSON.parse(fixedStr)
                console.log(`10b. Successfully parsed fixed JSON object ${i+1}/${objects.length}`)
                schemas.push(parsedObj)
              } catch (e2) {
                console.error('Failed to fix JSON object:', e2)
              }
            }
          }
        } else {
          // Last resort: try to parse the entire response as a single JSON object
          try {
            console.log('11. Trying to parse entire sanitized response as JSON')
            const parsedObj = JSON.parse(sanitizedResponse)
            console.log('12. Successfully parsed entire response as JSON')
            schemas.push(parsedObj)
          } catch (e) {
            console.error('Error parsing entire sanitized response as JSON:', e)
            throw new Error("Unable to parse JSON from the response. Please try again with a clearer prompt.")
          }
        }
      }
      
      console.log(`13. Final schemas array (${schemas.length} items):`, schemas)
      
      if (schemas.length === 0) {
        throw new Error("No valid schemas could be extracted from the response. Please try again.")
      }
      
      // Process schemas to ensure they have the correct structure
      const processedSchemas = schemas.map(schema => {
        // Ensure schema has a formId
        if (!schema.formId) {
          schema.formId = `schema_${Date.now()}`
        }
        
        // Ensure schema has fields property
        if (!schema.fields) {
          schema.fields = {}
        }
        
        return schema
      })
      
      console.log('14. Processed schemas:', processedSchemas)
      
      // Get appsId from the first schema (all schemas should have the same appsId)
      const appsId = processedSchemas[0]?.appsId || `Project_${Date.now()}`
      console.log('15. Using appsId from schema:', appsId)
      
      // Always send the array of schemas to properly handle multiple related schemas
      console.log(`14. Sending all ${processedSchemas.length} schemas to be processed`)
      onSchemaGenerated(processedSchemas, appsId)
    } catch (error: unknown) {
      console.error("Error details:", error)
      // Use setMessage and setMessageType if available, otherwise use local state
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate schema';
      
      if (setMessage && setMessageType) {
        setMessage(`Error: ${errorMessage}`)
        setMessageType("error")
      } else {
        // Fallback to local state
        setPreviewMessage(`Error: ${errorMessage}`)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  
  // Handle confirmation of booking schema
  const handleConfirmBookingSchema = async () => {
    setIsGenerating(true)
    try {
      // First make POST request to /no-code-db-api/form/schema
      console.log("Sending booking schema to API:", bookingSchema)
      
      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      try {
        const schemaResponse = await fetch('http://localhost:4441/no-code-db-api/form/schema', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookingSchema),
          signal: controller.signal
        }).catch(err => {
          if (err.name === 'AbortError') {
            throw new Error('API request timed out. Is the server running?');
          }
          throw err;
        });
        
        clearTimeout(timeoutId);
        
        if (!schemaResponse.ok) {
          const errorText = await schemaResponse.text().catch(() => 'No error details available');
          console.error(`Error creating schema (${schemaResponse.status}): ${errorText}`);
          throw new Error(`Failed to create schema: ${schemaResponse.status} ${schemaResponse.statusText}`);
        }
        
        // Then create a form using the same schema data
        const formResponse = await fetch('http://localhost:4441/no-code-db-api/form', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookingSchema)
        }).catch(err => {
          throw new Error(`Failed to connect to form API: ${err.message}`);
        });
        
        if (!formResponse.ok) {
          const errorText = await formResponse.text().catch(() => 'No error details available');
          console.error(`Error creating form (${formResponse.status}): ${errorText}`);
          throw new Error(`Failed to create form: ${formResponse.status} ${formResponse.statusText}`);
        }
        
        // Success - hide preview and notify user
        setPreviewMessage("Booking schema and form created successfully!");
        setTimeout(() => {
          setShowBookingPreview(false);
        }, 3000);
        
        // Also update the global message if available
        if (setMessage && setMessageType) {
          setMessage("Booking schema and form created successfully!");
          setMessageType("success");
        }
      } catch (fetchError) {
        throw fetchError; // Re-throw to be caught by the outer catch block
      }
    } catch (error: unknown) {
      console.error("Error creating booking schema:", error);
      let errorMessage = 'Failed to create booking schema';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Provide more specific error messages based on error type
        if (error.message.includes('Failed to fetch') || error.message.includes('timed out')) {
          errorMessage = "Could not connect to the database server. Please ensure it's running at http://localhost:4441";
        }
      }
      
      // Set local preview message
      setPreviewMessage(`Error: ${errorMessage}`);
      
      // Also update the global message if available
      if (setMessage && setMessageType) {
        setMessage(`Error: ${errorMessage}`);
        setMessageType("error");
      }
    } finally {
      setIsGenerating(false);
    }
  }

  
  // Handle example prompt click
  const handleExamplePromptClick = (promptExample: any) => {
    onPromptChange(promptExample.text)
    
    // If it's the booking example, show the preview
    if (promptExample.action === "preview") {
      setShowBookingPreview(true)
    }
  }

  return (
    <div className="space-y-6">
      {/* Title and Breadcrumb */}
      <div className="border-b border-zinc-800 pb-4">
        <h2 className="text-2xl font-extralight text-zinc-100 mb-2">AI Prompt — NoCode</h2>
        <p className="text-zinc-400 text-sm">Describe your data requirements in plain English and we'll generate the optimal database structure for you.</p>
      </div>

      {/* Prompt Input */}
      <div>
        <label htmlFor="natural-language-input" className="block text-base font-medium text-zinc-200 mb-3">
          Describe your data requirements
        </label>
        <textarea
          id="natural-language-input"
          className="w-full p-4 border-2 border-zinc-700 rounded-xl text-sm resize-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 bg-zinc-900 text-zinc-100 placeholder-zinc-500 font-light leading-relaxed"
          placeholder="Example: I want to keep track of my customers with their names, email addresses, phone numbers, and whether they're currently active. I also need to store their registration date and preferred contact method."
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          rows={3}
        />
      </div>

      {/* Example Prompts */}
      <div>
        <p className="text-sm font-medium text-zinc-400 mb-3">Common use cases to get you started:</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {examplePrompts.map((promptExample, index) => (
            <button
              key={index}
              onClick={() => handleExamplePromptClick(promptExample)}
              className="text-left p-4 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-lg border border-zinc-700 hover:border-blue-500 hover:shadow-md transition-all duration-300 group"
            >
              <div className="flex items-start space-x-3">
                <div className="mt-1 group-hover:scale-110 transition-transform duration-200">{promptExample.icon}</div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-zinc-500 mb-1 uppercase tracking-wide">
                    {promptExample.category}
                  </div>
                  <div className="text-xs text-zinc-300 group-hover:text-blue-300 transition-colors duration-200 font-light leading-relaxed">
                    {promptExample.text}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Generate Actions */}
      <GenerateActions
        prompt={prompt}
        onGenerateSchema={handleCreateDatabase}
        isGenerating={isGenerating}
      />
      
      {/* Booking Schema Preview */}
      {showBookingPreview && (
        <div className="mt-8 border border-zinc-700 rounded-xl p-6 bg-zinc-900">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-medium text-zinc-100">Booking Schema Preview</h3>
            <button 
              onClick={() => setShowBookingPreview(false)}
              className="p-1 rounded-full hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
          
          <div className="bg-zinc-800 p-4 rounded-lg mb-4 overflow-auto max-h-80">
            <pre className="text-xs text-zinc-300">
              {JSON.stringify(bookingSchema, null, 2)}
            </pre>
          </div>
          
          {previewMessage && (
            <div className={`mb-4 p-3 rounded-lg ${previewMessage.includes("Error") ? "bg-red-900/30 text-red-200" : "bg-green-900/30 text-green-200"}`}>
              {previewMessage.includes("Error") ? (
                <div className="flex items-center space-x-2">
                  <X className="w-4 h-4" />
                  <span>{previewMessage}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>{previewMessage}</span>
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowBookingPreview(false)}
              className="px-4 py-2 border border-zinc-600 rounded-lg text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmBookingSchema}
              disabled={isGenerating}
              className="px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Confirm & Create</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
