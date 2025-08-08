"use client"

import { useState, useEffect } from "react"
import { Plus, Database, Edit3, Eye, Sparkles, FileText, Table, Code } from "lucide-react"
import { getLlamaResponse } from "../lib/llamaApi"
// Relational database imports removed
// SQL parser import removed
import JsonTreeView from "@/components/JsonTreeView"
import { getLlamaExplanation } from "../lib/llamaExplain"
import { marked } from "marked"

type Field = {
  name?: string;
  fieldId?: string;
  type?: string;
  fieldType?: string;
  required?: boolean;
  isRequired?: boolean;
};

type Schema = {
  formId: string;
  name: string;
  description: string;
  category: string;
  fields: Field[];
  createdDate: string;
  recordCount: number;
};

export default function NoCodeDatabase() {
  // State management
  const [naturalLanguageInput, setNaturalLanguageInput] = useState("")
  const [updateDescription, setUpdateDescription] = useState("")
  const [selectedSchemaForUpdate, setSelectedSchemaForUpdate] = useState("")
  const [schemas, setSchemas] = useState<Schema[]>([])
  const [schemaObject, setSchemaObject] = useState<object | null>(null)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("")
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingDatabases, setIsLoadingDatabases] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [databasesText, setDatabasesText] = useState("");
  // Relational database state variables removed
  const [nonRelationalSchemas, setNonRelationalSchemas] = useState<object[] | null>(null)
  const [isLoadingNonRelational, setIsLoadingNonRelational] = useState(false)
  const [schemaExplanation, setSchemaExplanation] = useState<string>("");
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [followUpAnswer, setFollowUpAnswer] = useState("");
  const [isLoadingFollowUp, setIsLoadingFollowUp] = useState(false);
  const [viewAsTable, setViewAsTable] = useState(false);
  const [tableMessages, setTableMessages] = useState<{[key: string]: {text: string, type: "success" | "error"}}>({});
  // Relational database explanation state variables removed

  // State for row modal
  const [rowModalOpen, setRowModalOpen] = useState(false);
  const [rowModalSchema, setRowModalSchema] = useState<any>(null);

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("")
        setMessageType("")
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  // Stack-based parser to extract all top-level JSON objects from a string
  function extractJsonObjects(str: string): string[] {
    const objects: string[] = [];
    let depth = 0;
    let start: number | null = null;
    for (let i = 0; i < str.length; i++) {
      if (str[i] === '{') {
        if (depth === 0) start = i;
        depth++;
      } else if (str[i] === '}') {
        depth--;
        if (depth === 0 && start !== null) {
          const objStr = str.slice(start, i + 1);
          objects.push(objStr);
          start = null;
        }
      }
    }
    return objects;
  }

  // Handle creating new database structure
  const handleCreateDatabase = async () => {
    if (!naturalLanguageInput.trim()) {
      setMessage("Please describe what kind of data you want to store.")
      setMessageType("error")
      return
    }
    setIsGenerating(true);
    try {
      console.log("1. Calling LLM with prompt:", naturalLanguageInput);
      const generatedSchema = await getLlamaResponse(naturalLanguageInput);
      console.log("2. LLM Response:", generatedSchema);
      // Extract all JSON code blocks (for multiple schemas)
      console.log('3. Extracting JSON code blocks from LLM response');
      const codeBlocks = [...generatedSchema.matchAll(/```json\s*([\s\S]+?)```/gi)];
      console.log(`4. Found ${codeBlocks.length} JSON code blocks`);
      
      let schemas = [];
      if (codeBlocks.length > 0) {
        for (let i = 0; i < codeBlocks.length; i++) {
          const match = codeBlocks[i];
          console.log(`5. Processing code block ${i+1}/${codeBlocks.length}`);
          let block = match[1].trim().replace(/^```|```$/g, '').trim();
          const objects = extractJsonObjects(block);
          console.log(`6. Extracted ${objects.length} JSON objects from code block ${i+1}`);
          
          for (let j = 0; j < objects.length; j++) {
            const objStr = objects[j];
            try {
              const parsedObj = JSON.parse(objStr);
              console.log(`7. Successfully parsed JSON object ${j+1}/${objects.length}:`, parsedObj);
              schemas.push(parsedObj);
            } catch (e) {
              console.error(`Error parsing JSON object ${j+1}/${objects.length}:`, e);
              console.error('Problematic JSON string:', objStr);
            }
          }
        }
      } else {
        // Fallback: try to parse as a single JSON object
        console.log('5. No code blocks found, trying to parse entire response as JSON');
        try {
          const parsedObj = JSON.parse(generatedSchema.trim());
          console.log('6. Successfully parsed entire response as JSON:', parsedObj);
          schemas.push(parsedObj);
        } catch (e) {
          console.error('Error parsing entire response as JSON:', e);
          setMessage("Unable to parse JSON. Please make sure your input is valid JSON.");
          setMessageType("error");
          setIsGenerating(false);
          return;
        }
      }
      
      console.log(`8. Final schemas array (${schemas.length} items):`, schemas);
      setSchemaObject(schemas.length === 1 ? schemas[0] : schemas);
      setSchemaExplanation(""); // Clear previous explanation
      setMessage("Your database structure has been created successfully. You can now edit it below.")
      setMessageType("success");
    } catch (error) {
      console.error("Error details:", error);
      setMessage("Something went wrong. Please try describing your data differently.")
      setMessageType("error");
    } finally {
      setIsGenerating(false);
    }
  }

  // handleShowAllDatabases function removed - using handleLoadAllDatabases instead

  // Handle updating existing database structure
  const handleUpdateDatabase = async () => {
    if (!updateDescription.trim() || !selectedSchemaForUpdate) {
      setMessage("Please select a database and describe what changes you want to make.")
      setMessageType("error")
      return
    }

    setIsUpdating(true);
    try {
      // Get LLM response for database updates
      const llamaResponse = await getLlamaResponse(updateDescription);
      
      // Parse the LLM response to extract the JSON schema
      // Remove code block markers and unescape quotes if present
      let cleanedResponse = llamaResponse;
      if (llamaResponse.includes('```json')) {
        cleanedResponse = llamaResponse.replace(/```json\n|```/g, '');
      }
      
      // Parse the JSON schema
      const updateJson = JSON.parse(cleanedResponse);
      
      const requestBody = {
        ...updateJson,
        formId: selectedSchemaForUpdate
      };
      console.log(`Sending POST request to http://localhost:4441/no-code-db-api/form/schema with body:`, requestBody);
      
      const response = await fetch(`http://localhost:4441/no-code-db-api/form/schema`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify(requestBody),
      });
      
      console.log(`Received response with status: ${response.status}`);
      if (response.ok) {
        console.log('Schema update successful');
      } else {
        console.error('Schema update failed');
      }
      setTimeout(() => {
        setMessage(`Your "${selectedSchemaForUpdate}" database has been updated successfully.`)
        setMessageType("success")
        setUpdateDescription("")
        setSelectedSchemaForUpdate("")
        setIsUpdating(false);
      }, 1500)
    } catch (error) {
      setMessage("Could not update your database. Please try again.")
      setMessageType("error")
      setIsUpdating(false);
    }
  }

  const handleSchemaUpdate = (updatedSchema: any) => {
    console.log('Schema updated:', updatedSchema);
    setSchemaObject(updatedSchema);
    setMessage("Schema updated successfully!");
  };

  const examplePrompts = [
    {
      icon: <Database className="w-5 h-5 text-blue-600" />,
      text: "I want to track students and their course enrollments. Each student should have a name, email, major, and GPA that is automatically calculated from their grades. Each course should have a name, code, and instructor. I also want to log each student's grades for different assignments, and only show a “makeup submission” field if the original grade is below 60.",
      category: "Student Management",
    },
    {
      icon: <FileText className="w-5 h-5 text-emerald-600" />,
      text: "Create a product catalog with prices, descriptions, and inventory status",
      category: "Inventory",
    },
    {
      icon: <Edit3 className="w-5 h-5 text-purple-600" />,
      text: "I want to track employee information including departments and hire dates",
      category: "HR Management",
    },
    {
      icon: <Eye className="w-5 h-5 text-indigo-600" />,
      text: "Set up event bookings with attendee details and ticket quantities",
      category: "Event Management",
    },
  ]

  // Handler to load all database schemas
  const handleLoadAllDatabases = async () => {
    console.log('Loading all databases...');
    setIsLoadingDatabases(true);
    setIsLoadingNonRelational(true);
    try {
      console.log('Sending GET request to http://localhost:4441/no-code-db-api/form/schema');
      const response = await fetch('http://localhost:4441/no-code-db-api/form/schema');
      console.log(`Received response with status: ${response.status}`);
      
      const schemasData = await response.json();
      console.log('Received schemas data:', schemasData);
      
      // Process schema data
      if (Array.isArray(schemasData)) {
        console.log(`Setting ${schemasData.length} schemas to state`);
        setSchemas(schemasData);
        setNonRelationalSchemas(schemasData);
      } else {
        console.warn('Received non-array schema data:', schemasData);
      }
      
      setMessage("Database schemas loaded successfully!");
      setMessageType("success");
    } catch (error) {
      console.error('Error loading databases:', error);
      setMessage("Could not load databases. Please try again.");
      setMessageType("error");
    } finally {
      console.log('Finished loading databases');
      setIsLoadingDatabases(false);
      setIsLoadingNonRelational(false);
    }
  };
  
  // Handler for explanation button
  const handleExplainSchema = async () => {
    if (!schemaObject) return;
    setIsLoadingExplanation(true);
    try {
      const explanation = await getLlamaExplanation(schemaObject, naturalLanguageInput);
      setSchemaExplanation(explanation);
    } catch (explainError) {
      setSchemaExplanation("Could not generate explanation.");
    } finally {
      setIsLoadingExplanation(false);
    }
  };

  // Handler for follow-up question
  const handleFollowUp = async () => {
    if (!schemaObject || !followUpQuestion.trim()) return;
    setIsLoadingFollowUp(true);
    setFollowUpAnswer("");
    try {
      // Custom prompt for follow-up
      const prompt = `Given this schema: ${JSON.stringify(schemaObject, null, 2)} and this user request: "${naturalLanguageInput}", answer this follow up question: "${followUpQuestion}"`;
      // Reuse getLlamaExplanation for the follow-up
      const answer = await getLlamaExplanation(schemaObject, prompt);
      setFollowUpAnswer(answer);
    } catch (err) {
      setFollowUpAnswer("Could not get an answer to your follow up question.");
    } finally {
      setIsLoadingFollowUp(false);
    }
  };

  // Relational explanation handlers removed

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 font-sans">
      {/* Subtle Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-40 left-40 w-80 h-80 bg-slate-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      {/* Header */}
      <header className="relative bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
        <div className="relative max-w-7xl mx-auto px-8 py-20 text-center">
          <div className="flex items-center justify-center mb-8">
            <div className="bg-white/10 p-5 rounded-3xl backdrop-blur-sm border border-white/20">
              <Database className="w-14 h-14 text-white" />
            </div>
          </div>
          <h1 className="text-6xl font-extralight mb-6 tracking-tight leading-tight">
            Intelligent Database
            <span className="block font-light text-blue-200">Management Platform</span>
          </h1>
          <p className="text-xl font-light opacity-90 max-w-3xl mx-auto leading-relaxed mb-8">
            Transform your data requirements into sophisticated database structures using natural language processing.
            No technical expertise required.
          </p>
          <div className="flex items-center justify-center space-x-3 text-sm font-medium">
            <Sparkles className="w-4 h-4 text-blue-300" />
            <span className="text-blue-200">Powered by Advanced AI</span>
            <Sparkles className="w-4 h-4 text-blue-300" />
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-8 py-16">
        {/* Message Display */}
        {message && (
          <div
            className={`mb-12 p-6 rounded-2xl border font-medium shadow-lg backdrop-blur-sm ${
              messageType === "success"
                ? "bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-800 border-emerald-200"
                : "bg-gradient-to-r from-red-50 to-rose-50 text-red-800 border-red-200"
            }`}
          >
            <div className="flex items-center space-x-4">
              <div
                className={`w-2 h-2 rounded-full ${messageType === "success" ? "bg-emerald-500" : "bg-red-500"}`}
              ></div>
          </div>
        </div>
      )}
      
      {/* Create New Database Section */}
      <section className="bg-white rounded-3xl shadow-2xl border border-slate-200/50 p-10 mb-16 backdrop-blur-sm">
        <div className="flex items-start space-x-6 mb-10">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl shadow-lg">
            <Plus className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-4xl font-extralight text-slate-900 mb-3 tracking-tight">Create Database Structure</h2>
            <p className="text-lg text-slate-600 font-light leading-relaxed">
              Describe your data requirements in plain English and we'll generate the optimal database structure for
              you.
            </p>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <label htmlFor="natural-language-input" className="block text-lg font-medium text-slate-800 mb-4">
              Describe your data requirements
            </label>
            <textarea
              id="natural-language-input"
              className="w-full p-6 border-2 border-slate-200 rounded-2xl text-base resize-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gradient-to-br from-slate-50 to-blue-50/30 placeholder-slate-400 font-light leading-relaxed"
              placeholder="Example: I want to keep track of my customers with their names, email addresses, phone numbers, and whether they're currently active. I also need to store their registration date and preferred contact method."
              value={naturalLanguageInput}
              onChange={(e) => setNaturalLanguageInput(e.target.value)}
              rows={4}
            />
          </div>

          {/* Example Prompts */}
          <div>
            <p className="text-sm font-medium text-slate-600 mb-4">Common use cases to get you started:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {examplePrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => setNaturalLanguageInput(prompt.text)}
                  className="text-left p-5 bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 group"
                >
                  <div className="flex items-start space-x-4">
                    <div className="mt-1 group-hover:scale-110 transition-transform duration-200">{prompt.icon}</div>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">
                        {prompt.category}
                      </div>
                      <div className="text-sm text-slate-700 group-hover:text-blue-700 transition-colors duration-200 font-light leading-relaxed">
                        {prompt.text}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <button
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-10 py-5 rounded-2xl font-medium text-lg hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-4"
              onClick={handleCreateDatabase}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  <span>Generating Schema/Table...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  <span>Generate Schema/Table</span>
                </>
              )}
            </button>
            {/* Relational database generation button removed */}
          </div>
        </div>
      </section>

      {/* Database Management Section */}
      <section className="bg-white rounded-3xl shadow-2xl border border-slate-200/50 p-10 mb-16 backdrop-blur-sm">
        <div className="flex items-start space-x-6 mb-10">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-4 rounded-2xl shadow-lg">
            <Eye className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-4xl font-extralight text-slate-900 mb-3 tracking-tight">Database Management</h2>
            <p className="text-lg text-slate-600 font-light leading-relaxed">
              View, modify, and manage your existing database structures with intelligent assistance.
            </p>
          </div>
        </div>

        {/* Show All Databases */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row gap-4">
            <button
              className="bg-white text-blue-600 border-2 border-blue-600 px-10 py-5 rounded-2xl font-medium text-lg hover:bg-blue-600 hover:text-white hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-4"
              onClick={handleLoadAllDatabases}
              disabled={isLoadingDatabases || isLoadingNonRelational}
            >
              {isLoadingDatabases || isLoadingNonRelational ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current"></div>
                  <span>Loading Databases...</span>
                </>
              ) : (
                <>
                  <Database className="w-6 h-6" />
                  <span>Load All Databases</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Update Existing Database */}
        <div className="border-t border-slate-200 pt-10">
          <div className="flex items-center space-x-4 mb-8">
            <Edit3 className="w-7 h-7 text-indigo-600" />
            <h3 className="text-3xl font-extralight text-slate-900 tracking-tight">Modify Database Structure</h3>
              <h2 className="text-4xl font-extralight text-slate-900 mb-3 tracking-tight">Create Database Structure</h2>
              <p className="text-lg text-slate-600 font-light leading-relaxed">
                Describe your data requirements in plain English and we'll generate the optimal database structure for
                you.
              </p>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <label htmlFor="natural-language-input" className="block text-lg font-medium text-slate-800 mb-4">
                Describe your data requirements
              </label>
              <textarea
                id="natural-language-input"
                className="w-full p-6 border-2 border-slate-200 rounded-2xl text-base resize-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gradient-to-br from-slate-50 to-blue-50/30 placeholder-slate-400 font-light leading-relaxed"
                placeholder="Example: I want to keep track of my customers with their names, email addresses, phone numbers, and whether they're currently active. I also need to store their registration date and preferred contact method."
                value={naturalLanguageInput}
                onChange={(e) => setNaturalLanguageInput(e.target.value)}
                rows={4}
              />
            </div>

            {/* Example Prompts */}
            <div>
              <p className="text-sm font-medium text-slate-600 mb-4">Common use cases to get you started:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {examplePrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => setNaturalLanguageInput(prompt.text)}
                    className="text-left p-5 bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 group"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="mt-1 group-hover:scale-110 transition-transform duration-200">{prompt.icon}</div>
                      <div className="flex-1">
                        <div className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">
                          {prompt.category}
                        </div>
                        <div className="text-sm text-slate-700 group-hover:text-blue-700 transition-colors duration-200 font-light leading-relaxed">
                          {prompt.text}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <button
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-10 py-5 rounded-2xl font-medium text-lg hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-4"
                onClick={handleCreateDatabase}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    <span>Generating Schema/Table...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    <span>Generate Schema/Table</span>
                  </>
                )}
              </button>
              {/* Relational database generation button removed */}
            </div>
          </div>
        </section>

        {/* Database Management Section */}
        <section className="bg-white rounded-3xl shadow-2xl border border-slate-200/50 p-10 mb-16 backdrop-blur-sm">
          <div className="flex items-start space-x-6 mb-10">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-4 rounded-2xl shadow-lg">
              <Eye className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-4xl font-extralight text-slate-900 mb-3 tracking-tight">Database Management</h2>
              <p className="text-lg text-slate-600 font-light leading-relaxed">
                View, modify, and manage your existing database structures with intelligent assistance.
              </p>
            </div>
          </div>

          {/* Show All Databases */}
          <div className="mb-10">
            <div className="flex flex-col md:flex-row gap-4">
              <button
                className="bg-white text-blue-600 border-2 border-blue-600 px-10 py-5 rounded-2xl font-medium text-lg hover:bg-blue-600 hover:text-white hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-4"
                onClick={handleLoadAllDatabases}
                disabled={isLoadingDatabases || isLoadingNonRelational}
              >
                {isLoadingDatabases || isLoadingNonRelational ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current"></div>
                    <span>Loading Databases...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-6 h-6" />
                    <span>Load All Databases</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Update Existing Database */}
          <div className="border-t border-slate-200 pt-10">
            <div className="flex items-center space-x-4 mb-8">
              <Edit3 className="w-7 h-7 text-indigo-600" />
              <h3 className="text-3xl font-extralight text-slate-900 tracking-tight">Modify Database Structure</h3>
            </div>

            <div className="space-y-8">
              {schemas.length > 0 && (
                <div>
                  <label className="block text-lg font-medium text-slate-800 mb-4">Select database to modify</label>
                  <select
                    className="w-full p-5 border-2 border-slate-200 rounded-2xl text-base focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gradient-to-br from-slate-50 to-blue-50/30 font-light"
                    value={selectedSchemaForUpdate}
                    onChange={(e) => setSelectedSchemaForUpdate(e.target.value)}
                  >
                    <option value="">Choose a database to modify...</option>
                    {schemas.map((schema) => (
                      <option key={schema.formId} value={schema.name}>
                        {schema.name} ({schema.recordCount} records)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-lg font-medium text-slate-800 mb-4">
                  Describe the changes you want to make
                </label>
                <textarea
                  className="w-full p-6 border-2 border-slate-200 rounded-2xl text-base resize-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-gradient-to-br from-slate-50 to-blue-50/30 placeholder-slate-400 font-light leading-relaxed"
                  placeholder="Example: Add a field for customer birthdays, remove the phone number field, or make the email field required for all entries."
                  value={updateDescription}
                  onChange={(e) => setUpdateDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <button
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-10 py-5 rounded-2xl font-medium text-lg hover:from-indigo-700 hover:to-indigo-800 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-4"
                onClick={handleUpdateDatabase}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    <span>Applying Changes...</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="w-6 h-6" />
                    <span>Apply Database Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Database Display Area */}
        <section className="bg-white rounded-3xl shadow-2xl border border-slate-200/50 p-10 backdrop-blur-sm">
          <div className="flex items-start space-x-6 mb-10">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 rounded-2xl shadow-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-4xl font-extralight text-slate-900 mb-3 tracking-tight">Database Overview</h2>
              <p className="text-lg text-slate-600 font-light leading-relaxed">
                Comprehensive view of all your database structures and their configurations.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-2xl p-8 border border-slate-200/50">
            {schemaObject ? (
              <div>
                <button
                  className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={handleExplainSchema}
                  disabled={!schemaObject || isLoadingExplanation}
                >
                  {isLoadingExplanation ? 'Generating Explanation...' : 'Explain this Schema'}
                </button>
                {schemaExplanation && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-base font-semibold mb-2 text-blue-800">Explanation</h4>
                    <div
                      className="prose prose-blue max-w-none"
                      dangerouslySetInnerHTML={{ __html: marked.parse(schemaExplanation || "") }}
                    />
                    {/* Follow-up question UI */}
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-blue-800 mb-2">Ask a follow up question</label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          className="flex-1 px-3 py-2 border border-blue-200 rounded"
                          value={followUpQuestion}
                          onChange={e => setFollowUpQuestion(e.target.value)}
                          placeholder="E.g. Can I add more fields?"
                          disabled={isLoadingFollowUp}
                        />
                        <button
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                          onClick={handleFollowUp}
                          disabled={!followUpQuestion.trim() || isLoadingFollowUp}
                        >
                          {isLoadingFollowUp ? 'Asking...' : 'Ask'}
                        </button>
                      </div>
                      {followUpAnswer && (
                        <div className="mt-2 p-3 bg-blue-100 border border-blue-200 rounded prose prose-blue" dangerouslySetInnerHTML={{ __html: marked.parse(followUpAnswer) }} />
                      )}
                    </div>
                  </div>
                )}
                
                {/* Toggle button for view switching */}
                <div className="flex justify-end mb-4">
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm"
                    onClick={() => setViewAsTable(!viewAsTable)}
                  >
                    {viewAsTable ? (
                      <>
                        <Code className="w-4 h-4" />
                        <span>View as JSON</span>
                      </>
                    ) : (
                      <>
                        <Table className="w-4 h-4" />
                        <span>View as Table</span>
                      </>
                    )}
                  </button>
                </div>
                
                {/* Conditional rendering based on view toggle */}
                {viewAsTable ? (
                  <div className="overflow-x-auto">
                    {(() => {
                      // Handle both single schema and array of schemas
                      const schemas = Array.isArray(schemaObject) ? schemaObject : [schemaObject];
                      
                      return schemas.map((schema, schemaIndex) => {
                        // Use type assertion to handle TypeScript errors
                        const schemaObj = schema as any;
                        
                        // Get fields from the appropriate location in the schema
                        let fields: any[] = [];
                        
                        // Based on the console output, fields are stored as an object, not an array
                        // Example: {name: {fieldId: "name", fieldType: "TEXT", isRequired: true}, ...}
                        let fieldsObj: Record<string, any> = {};
                        
                        if (schemaObj.form && schemaObj.form.fields) {
                          fieldsObj = schemaObj.form.fields;
                        } else if (schemaObj.fields) {
                          fieldsObj = schemaObj.fields;
                        }
                        
                        // Convert fields object to array for rendering
                        if (fieldsObj && typeof fieldsObj === 'object' && !Array.isArray(fieldsObj)) {
                          fields = Object.keys(fieldsObj).map(key => {
                            return fieldsObj[key];
                          });
                        }
                        
                        
                        return (
                          <div key={schemaIndex} className="mb-8">
                            <div className="flex justify-between items-center mb-3">
                              <h3 className="text-xl font-medium text-gray-700">
                                Table: {schemaObj?.formId || schemaObj?.name || `Schema ${schemaIndex + 1}`}
                              </h3>
                              <div className="flex">
                                <button 
                                  className="flex items-center gap-1 bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 mr-2"
                                  onClick={() => {
                                    try {
                                      console.log(`Sending POST request to add table to relational database for schema: ${schemaObj.formId || "unknown"}`);
                                      
                                      // Prepare the request body
                                      const requestBody = {
                                        formId: schemaObj.formId || "unknown",
                                        tables: [schemaObj] // Use the schema itself as a table definition
                                      };
                                      
                                      console.log('Request body for Add Table:', requestBody);
                                      
                                      // Send the schema to the relational database API endpoint
                                      fetch('http://localhost:4441/no-code-db-api/relational/form/schema', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(requestBody)
                                      })
                                      .then(response => {
                                        if (!response.ok) {
                                          return response.text().then(errorText => {
                                            console.error(`Error adding table: ${errorText}`);
                                            throw new Error('Failed to add table to relational database');
                                          });
                                        }
                                        return response.json();
                                      })
                                      .then(result => {
                                        console.log('Table added successfully');
                                        setTableMessages(prev => ({
                                          ...prev,
                                          [schemaObj.formId || "unknown"]: {
                                            text: "Table added successfully!",
                                            type: "success"
                                          }
                                        }));
                                        
                                        // Clear message after 3 seconds
                                        setTimeout(() => {
                                          setTableMessages(prev => {
                                            const newMessages = { ...prev };
                                            delete newMessages[schemaObj.formId || "unknown"];
                                            return newMessages;
                                          });
                                        }, 3000);
                                      })
                                      .catch(error => {
                                        console.error('Error adding table:', error);
                                        setTableMessages(prev => ({
                                          ...prev,
                                          [schemaObj.formId || "unknown"]: {
                                            text: `Error adding table: ${error.message}`,
                                            type: "error"
                                          }
                                        }));
                                      });
                                    } catch (error: any) {
                                      console.error('Error adding table:', error);
                                      setTableMessages(prev => ({
                                        ...prev,
                                        [schemaObj.formId || "unknown"]: {
                                          text: `Error adding table: ${error.message}`,
                                          type: "error"
                                        }
                                      }));
                                    }
                                  }}
                                >
                                  <Plus className="w-4 h-4" /> Add Table
                                </button>
                                <button 
                                  className="ml-2 flex items-center gap-1 bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
                                  onClick={() => {
                                    // Open a modal for user to input row data
                                    let schemaForModal = { ...schemaObj };
                                    if (schemaForModal.fields && !Array.isArray(schemaForModal.fields)) {
                                      schemaForModal.fields = Object.values(schemaForModal.fields);
                                    }
                                    setRowModalSchema(schemaForModal);
                                    setRowModalOpen(true);
                                  }}
                                >
                                  <Plus className="w-4 h-4" /> Add Row
                                </button>
                              </div>
                            </div>
                            
                            {/* Message feedback */}
                            {tableMessages[schemaObj.formId || "unknown"] && (
                              <div className={`mb-3 p-2 rounded ${tableMessages[schemaObj.formId || "unknown"].type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                {tableMessages[schemaObj.formId || "unknown"].text}
                              </div>
                            )}
                            
                            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Field Name</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Type</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Required</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {Array.isArray(fields) && fields.length > 0 ? (
                                  fields.map((field: any, index: number) => (
                                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r">
                                        {field.fieldId}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r">
                                        {field.fieldType}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {field.isRequired ? (
                                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Yes</span>
                                        ) : (
                                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">No</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">No fields available</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        );
                      });
                    })()}
                  </div>
                ) : (
                  <JsonTreeView data={schemaObject} onUpdate={handleSchemaUpdate} rootName="form" viewAsTable={viewAsTable} />
                )}
              </div>
            ) : nonRelationalSchemas ? (
              <div>
                {/* Toggle button for view switching */}
                <div className="flex justify-end mb-4">
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm"
                    onClick={() => setViewAsTable(!viewAsTable)}
                  >
                    {viewAsTable ? (
                      <>
                        <Code className="w-4 h-4" />
                        <span>View as JSON</span>
                      </>
                    ) : (
                      <>
                        <Table className="w-4 h-4" />
                        <span>View as Table</span>
                      </>
                    )}
                  </button>
                </div>
                
                {/* Conditional rendering based on view toggle */}
                {viewAsTable ? (
                  <div className="overflow-x-auto">
                    {Array.isArray(nonRelationalSchemas) && nonRelationalSchemas.map((schema, schemaIndex) => {
                      // Use type assertion to handle TypeScript errors
                      const schemaObj = schema as any;
                      
                      // Get fields from the appropriate location in the schema
                      let fields: any[] = [];
                      
                      // Based on the console output, fields are stored as an object, not an array
                      // Example: {name: {fieldId: "name", fieldType: "TEXT", isRequired: true}, ...}
                      let fieldsObj: Record<string, any> = {};
                      
                      if (schemaObj.form && schemaObj.form.fields) {
                        fieldsObj = schemaObj.form.fields;
                      } else if (schemaObj.fields) {
                        fieldsObj = schemaObj.fields;
                      }
                      
                      // Convert fields object to array for rendering
                      if (fieldsObj && typeof fieldsObj === 'object' && !Array.isArray(fieldsObj)) {
                        fields = Object.keys(fieldsObj).map(key => {
                          return fieldsObj[key];
                        });
                      }
                      
                      return (
                        <div key={schemaIndex} className="mb-8">
                          <h3 className="text-xl font-medium mb-3 text-gray-700">
                            Table: {schemaObj?.formId || schemaObj?.name || `Schema ${schemaIndex + 1}`}
                          </h3>
                          <table className="min-w-full bg-white border border-gray-200 rounded-lg mb-6">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Field Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Required</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {Array.isArray(fields) && fields.length > 0 ? (
                                fields.map((field: Field, index: number) => (
                                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r">
                                      {field.fieldId || field.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r">
                                      {field.fieldType || field.type}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {(field.isRequired || field.required) ? (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Yes</span>
                                      ) : (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">No</span>
                                      )}
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">No fields available</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      );
                    })}
                    {(!Array.isArray(nonRelationalSchemas) || nonRelationalSchemas.length === 0) && (
                      <div className="text-center py-10">
                        <p className="text-gray-500">No schemas available</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <JsonTreeView data={nonRelationalSchemas} onUpdate={handleSchemaUpdate} rootName="form" viewAsTable={viewAsTable} />
                )}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Database className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-2xl font-light text-slate-600 mb-3">No databases configured</h3>
                <p className="text-slate-500 font-light max-w-md mx-auto leading-relaxed">
                  Click "Load All Databases" to view your existing structures, or create a new database above to get
                  started.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
      
      {/* Row Modal */}
      {rowModalOpen && rowModalSchema && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4">Add Row to {rowModalSchema.formId || 'Table'}</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const rowData: Record<string, any> = {};
              
              // Get field values from form
              if (Array.isArray(rowModalSchema.fields)) {
                rowModalSchema.fields.forEach((field: any) => {
                  const fieldId = field.fieldId || field.name;
                  let value = formData.get(fieldId);
                  
                  // Convert value based on field type
                  if (field.fieldType === 'number' || field.fieldType === 'NUMBER') {
                    value = value ? Number(value) : 0;
                  } else if (field.fieldType === 'boolean' || field.fieldType === 'BOOLEAN') {
                    value = value === 'true';
                  }
                  
                  rowData[fieldId] = value;
                });
              }
              
              // Prepare the request body
              const requestBody = {
                formId: rowModalSchema.formId || "unknown",
                fields: rowData
              };
              
              console.log('Request body for Add Row:', requestBody);
              
              // Send the row data to the relational database API endpoint
              fetch('http://localhost:4441/no-code-db-api/relational/form/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
              })
              .then(response => {
                if (!response.ok) {
                  return response.text().then(errorText => {
                    console.error(`Error adding row: ${errorText}`);
                    throw new Error('Failed to add row to table');
                  });
                }
                return response.json();
              })
              .then(result => {
                console.log('Row added successfully');
                setTableMessages(prev => ({
                  ...prev,
                  [rowModalSchema.formId || "unknown"]: {
                    text: "Row added successfully!",
                    type: "success"
                  }
                }));
                
                // Clear message after 3 seconds
                setTimeout(() => {
                  setTableMessages(prev => {
                    const newMessages = { ...prev };
                    delete newMessages[rowModalSchema.formId || "unknown"];
                    return newMessages;
                  });
                }, 3000);
                
                // Close the modal
                setRowModalOpen(false);
                setRowModalSchema(null);
              })
              .catch(error => {
                console.error('Error adding row:', error);
                setTableMessages(prev => ({
                  ...prev,
                  [rowModalSchema.formId || "unknown"]: {
                    text: `Error adding row: ${error.message}`,
                    type: "error"
                  }
                }));
              });
            }}>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {Array.isArray(rowModalSchema.fields) && rowModalSchema.fields.map((field: any, idx: number) => {
                  const fieldId = field.fieldId || field.name;
                  const fieldType = field.fieldType || 'text';
                  
                  return (
                    <div key={idx} className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        {fieldId} {field.isRequired && <span className="text-red-500">*</span>}
                      </label>
                      {fieldType === 'boolean' || fieldType === 'BOOLEAN' ? (
                        <select 
                          name={fieldId} 
                          className="border border-gray-300 rounded px-3 py-2"
                          required={field.isRequired}
                        >
                          <option value="true">True</option>
                          <option value="false">False</option>
                        </select>
                      ) : fieldType === 'number' || fieldType === 'NUMBER' ? (
                        <input 
                          type="number" 
                          name={fieldId} 
                          className="border border-gray-300 rounded px-3 py-2"
                          required={field.isRequired}
                        />
                      ) : (
                        <input 
                          type="text" 
                          name={fieldId} 
                          className="border border-gray-300 rounded px-3 py-2"
                          required={field.isRequired}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="flex justify-end mt-6 space-x-2">
                <button 
                  type="button" 
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    setRowModalOpen(false);
                    setRowModalSchema(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Add Row
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
