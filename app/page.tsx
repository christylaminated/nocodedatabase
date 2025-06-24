"use client"

import { useState, useEffect } from "react"
import { Plus, Database, Edit3, Eye, Sparkles, FileText } from "lucide-react"
import { getLlamaResponse } from "../lib/llamaApi"
import { getRelationalLlamaResponse } from "../lib/relationalLlama"
import { parseSqlSchema } from "../lib/sqlParser"
import JsonTreeView from "@/components/JsonTreeView"
import AddRowModal from "@/components/AddRowModal"

type Schema = {
  formId: string;
  name: string;
  description: string;
  category: string;
  fields: { name: string; type: string; required: boolean }[];
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
  const [relationalSchema, setRelationalSchema] = useState<string | object | null>(null)
  const [isGeneratingRelational, setIsGeneratingRelational] = useState(false)
  const [parsedRelationalSchema, setParsedRelationalSchema] = useState<any[] | null>(null);
  const [nonRelationalSchemas, setNonRelationalSchemas] = useState<object[] | null>(null)
  const [isLoadingNonRelational, setIsLoadingNonRelational] = useState(false)
  const [selectedTable, setSelectedTable] = useState<any | null>(null);

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

  // Handle creating new database structure
  const handleCreateDatabase = async () => {
    setRelationalSchema(null); // Clear relational schema
    setParsedRelationalSchema(null); // Also clear the parsed relational schema
    if (!naturalLanguageInput.trim()) {
      setMessage("Please describe what kind of data you want to store.")
      setMessageType("error")
      return
    }
    setIsGenerating(true);
    try {
      console.log("1. Calling LLM with:", naturalLanguageInput);
      const generatedSchema = await getLlamaResponse(naturalLanguageInput);
      console.log("2. LLM Response:", generatedSchema);
      
      // Try to extract JSON from code block first
      let rawJson = null;
      const codeBlockMatch = generatedSchema.match(/```json\s*([\s\S]+?)```/i);
      if (codeBlockMatch) {
        rawJson = codeBlockMatch[1].trim();
      } else {
        // If not a code block, try to parse as JSON or double-encoded JSON
        let tryContent = generatedSchema.trim();
        // Remove wrapping quotes if present
        if ((tryContent.startsWith('"') && tryContent.endsWith('"')) || (tryContent.startsWith("'") && tryContent.endsWith("'"))) {
          tryContent = tryContent.slice(1, -1);
        }
        // Unescape if it looks like double-encoded JSON
        try {
          rawJson = JSON.parse(tryContent);
        } catch (e) {
          rawJson = tryContent;
        }
      }
      
      // At this point, rawJson should be a JSON string or object/array
      let jsonObject;
      if (typeof rawJson === 'string') {
        try {
          // Try parsing as a single object or array
          jsonObject = JSON.parse(rawJson);
        } catch (e) {
          // Fallback: try to parse multiple objects separated by newlines
          const possibleObjects = rawJson
            .split(/\n(?=\s*\{)/) // split at newlines before a {
            .map(s => s.trim())
            .filter(Boolean);
          if (possibleObjects.length > 1) {
            try {
              jsonObject = possibleObjects.map(objStr => JSON.parse(objStr));
            } catch (e2) {
              throw new Error('Unable to parse multiple JSON objects');
            }
          } else {
            throw e; // rethrow original error
          }
        }
      } else {
        jsonObject = rawJson;
      }
      console.log("5. Parsed JSON Object:", jsonObject);
      setSchemaObject(jsonObject)
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

  // Handle showing all database structures
  const handleShowAllDatabases = async () => {
    setIsLoadingDatabases(true);
    try {
      // TODO: Implement API call to fetch all database structures
      // const response = await fetch('http://localhost:4441/no-code-db-api/form/schema');
      // const schemasData = await response.json();
      // setSchemas(schemasData);

      // TODO: Implement API call to fetch all database structures

      //when a user wants to see all existing database schemas, you need to fetch them from your backend API and display them
      const reponse = await fetch('http://localhost:4441/no-code-db-api/form/schema');
      const schemasData = await reponse.json();
      setSchemas(schemasData);

    } catch (error) {
      setMessage("Could not load your databases. Please try again.")
      setMessageType("error")
      setIsLoadingDatabases(false);
    }
  }

  // Handle updating existing database structure
  const handleUpdateDatabase = async () => {
    if (!updateDescription.trim() || !selectedSchemaForUpdate) {
      setMessage("Please select a database and describe what changes you want to make.")
      setMessageType("error")
      return
    }

    setIsUpdating(true);
    try {
      // TODO: Implement LLM call to convert natural language to database updates
      // TODO: Implement API call to update database structure
      const updateJson = await getLlamaResponse(updateDescription);

      const response = await fetch('http://localhost:4441/no-code-db-api/form/schema/${selectedSchemaForUpdate}', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify(updateJson),
      })

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

  const handleSchemaUpdate = (updatedSchema: object) => {
    setSchemaObject(updatedSchema);
    // You might want to auto-save or provide a save button here
    console.log("Schema updated in parent:", updatedSchema);
  };

  const examplePrompts = [
    {
      icon: <Database className="w-5 h-5 text-blue-600" />,
      text: "I need to store customer information with names, emails, and phone numbers",
      category: "Customer Management",
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

  const handleGenerateRelationalDatabase = async () => {
    setSchemaObject(null); // Clear NoSQL schema
    setParsedRelationalSchema(null); // Clear previous parsed schema
    if (!naturalLanguageInput.trim()) {
      setMessage("Please describe what kind of data you want to store.")
      setMessageType("error")
      return
    }
    setIsGeneratingRelational(true)
    try {
      const result = await getRelationalLlamaResponse(naturalLanguageInput)
      console.log("Raw SQL from Llama API:", result); 
      setRelationalSchema(result); // Store the full response as a fallback

      // First, extract only the SQL code from the response.
      let sqlOnly = '';
      const codeBlockMatch = result.match(/```sql\\s*([\\s\\S]+?)```/i);
      if (codeBlockMatch) {
        sqlOnly = codeBlockMatch[1].trim();
      } else {
        // If no code block is found, assume the whole result might be SQL
        sqlOnly = result;
      }

      // Now, parse only the extracted SQL.
      const parsedSchema = parseSqlSchema(sqlOnly);
      setParsedRelationalSchema(parsedSchema);

      setMessage("Your relational database schema has been generated below.")
      setMessageType("success")
    } catch (error) {
      setMessage("Something went wrong. Please try describing your data differently.")
      setMessageType("error")
    } finally {
      setIsGeneratingRelational(false)
    }
  }

  // Handler to load all relational database schemas and show as tables
  const handleLoadAllRelationalDatabases = async () => {
    setIsLoadingDatabases(true);
    try {
      const response = await fetch('http://localhost:4441/no-code-db-api/form/schema');
      const schemasData = await response.json();
      // If schemasData is an array of SQL strings, parse each; if it's objects, adapt as needed
      // If your backend returns SQL, use parseSqlSchema; otherwise, adapt this logic
      let parsed = [];
      if (Array.isArray(schemasData)) {
        // If schemasData is an array of objects with a .sql property
        if (schemasData.length > 0 && typeof schemasData[0] === 'object' && schemasData[0].sql) {
          parsed = schemasData.map((schema: any) => parseSqlSchema(schema.sql)).flat();
        } else if (schemasData.length > 0 && typeof schemasData[0] === 'string') {
          // If schemasData is an array of SQL strings
          parsed = schemasData.map((sql: string) => parseSqlSchema(sql)).flat();
        } else {
          // If schemasData is already in table format
          parsed = schemasData;
        }
      }
      setParsedRelationalSchema(parsed);
      setRelationalSchema(null); // Hide raw SQL if showing all
      setMessage("Relational database schemas loaded successfully!");
      setMessageType("success");
    } catch (error) {
      setMessage("Could not load relational databases. Please try again.");
      setMessageType("error");
    } finally {
      setIsLoadingDatabases(false);
    }
  };

  // Handler to load all non-relational (NoSQL) database schemas
  const handleLoadAllNonRelationalDatabases = async () => {
    setIsLoadingNonRelational(true);
    try {
      const response = await fetch('http://localhost:4441/no-code-db-api/form/schema');
      const schemasData = await response.json();
      setNonRelationalSchemas(schemasData);
      setSchemaObject(null); // Hide single schema view
      setRelationalSchema(null); // Hide relational view
      setParsedRelationalSchema(null);
      setMessage("Non-relational database schemas loaded successfully!");
      setMessageType("success");
    } catch (error) {
      setMessage("Could not load non-relational databases. Please try again.");
      setMessageType("error");
    } finally {
      setIsLoadingNonRelational(false);
    }
  };

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
              <div className="font-medium">{message}</div>
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
                    <span>Generating NoSQL Schema...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    <span>Generate NoSQL Schema (MongoDB)</span>
                  </>
                )}
              </button>
              <button
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-10 py-5 rounded-2xl font-medium text-lg hover:from-indigo-700 hover:to-indigo-800 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-4"
                onClick={handleGenerateRelationalDatabase}
                disabled={isGeneratingRelational}
              >
                {isGeneratingRelational ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    <span>Generating Relational Schema...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    <span>Generate Relational Database (PostgreSQL)</span>
                  </>
                )}
              </button>
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
                onClick={handleShowAllDatabases}
                disabled={isLoadingDatabases}
              >
                {isLoadingDatabases ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current"></div>
                    <span>Loading Relational Databases...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-6 h-6" />
                    <span>Load All Relational Databases</span>
                  </>
                )}
              </button>
              <button
                className="bg-white text-blue-600 border-2 border-blue-600 px-10 py-5 rounded-2xl font-medium text-lg hover:bg-blue-600 hover:text-white hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-4"
                onClick={handleLoadAllNonRelationalDatabases}
                disabled={isLoadingNonRelational}
              >
                <Database className="w-6 h-6" />
                <span>Load All Non Relational Databases</span>
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
            {/* Relational Generation: Show tables and SQL side by side */}
            {parsedRelationalSchema && parsedRelationalSchema.length > 0 && relationalSchema ? (
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1 space-y-4">
                  {parsedRelationalSchema.map((table, index) => (
                    <div key={index} className="bg-white/60 p-4 rounded-lg border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-semibold text-slate-800 font-mono">{table.tableName}</h4>
                        <button
                          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                          onClick={() => setSelectedTable(table)}
                        >
                          <Plus className="w-4 h-4" /> Add Row
                        </button>
                      </div>
                      <div className="mt-3 text-xs text-slate-500 font-mono bg-slate-100 p-2 rounded">
                        Columns: {table.columns.map((col: { name: string }) => col.name).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="md:w-1/2 w-full">
                  <h4 className="text-base font-semibold mb-2 text-slate-700">Generated SQL</h4>
                  <pre className="bg-gray-100 p-4 rounded-lg overflow-auto whitespace-pre-wrap text-xs">{typeof relationalSchema === 'string' ? relationalSchema : JSON.stringify(relationalSchema, null, 2)}</pre>
                </div>
              </div>
            ) : parsedRelationalSchema && parsedRelationalSchema.length > 0 ? (
              <div className="space-y-4">
                {parsedRelationalSchema.map((table, index) => (
                  <div key={index} className="bg-white/60 p-4 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-slate-800 font-mono">{table.tableName}</h4>
                      <button
                        className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                        onClick={() => setSelectedTable(table)}
                      >
                        <Plus className="w-4 h-4" /> Add Row
                      </button>
                    </div>
                    <div className="mt-3 text-xs text-slate-500 font-mono bg-slate-100 p-2 rounded">
                      Columns: {table.columns.map((col: { name: string }) => col.name).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            ) : schemaObject ? (
              <JsonTreeView data={schemaObject} onUpdate={handleSchemaUpdate} rootName="form" />
            ) : nonRelationalSchemas ? (
              <JsonTreeView data={nonRelationalSchemas} onUpdate={handleSchemaUpdate} rootName="form" />
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
      <AddRowModal
        table={selectedTable}
        open={!!selectedTable}
        onClose={() => setSelectedTable(null)}
      />
    </div>
  )
}
