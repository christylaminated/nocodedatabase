"use client"

import { useState, useEffect } from "react"
import "./App.css"

function App() {
  // State management
  const [naturalLanguageInput, setNaturalLanguageInput] = useState("")
  const [jsonUpdateInput, setJsonUpdateInput] = useState("")
  const [schemas, setSchemas] = useState([])
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("") // 'success' or 'error'
  const [isLoading, setIsLoading] = useState(false)

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

  // Handle adding new schema from natural language
  const handleAddSchema = async () => {
    if (!naturalLanguageInput.trim()) {
      setMessage("Please enter a description for your schema.")
      setMessageType("error")
      return
    }

    setIsLoading(true)
    try {
      // TODO: Implement LLM call to convert natural language to JSON schema
      // const llmResponse = await callLlamaModel(naturalLanguageInput);
      // const generatedSchema = llmResponse.schema;

      // TODO: Implement API call to add schema
      // const response = await fetch('http://localhost:4441/no-code-db-api/form/schema', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(generatedSchema)
      // });

      // Simulate success for now
      setTimeout(() => {
        setMessage("Schema added successfully!")
        setMessageType("success")
        setNaturalLanguageInput("")
        setIsLoading(false)
      }, 1000)
    } catch (error) {
      setMessage("Error adding schema. Please try again.")
      setMessageType("error")
      setIsLoading(false)
    }
  }

  // Handle showing all schemas
  const handleShowAllSchemas = async () => {
    setIsLoading(true)
    try {
      // TODO: Implement API call to fetch all schemas
      // const response = await fetch('http://localhost:4441/no-code-db-api/form/schema');
      // const schemasData = await response.json();
      // setSchemas(schemasData);

      // Simulate API response for now
      setTimeout(() => {
        const mockSchemas = [
          {
            formId: "customer-form-001",
            name: "Customer Details",
            fields: [
              { name: "name", type: "string", required: true },
              { name: "email", type: "string", required: true },
              { name: "active", type: "boolean", required: false },
            ],
          },
          {
            formId: "product-form-002",
            name: "Product Information",
            fields: [
              { name: "title", type: "string", required: true },
              { name: "price", type: "number", required: true },
              { name: "description", type: "string", required: false },
            ],
          },
        ]
        setSchemas(mockSchemas)
        setMessage("Schemas loaded successfully!")
        setMessageType("success")
        setIsLoading(false)
      }, 800)
    } catch (error) {
      setMessage("Error fetching schemas. Please try again.")
      setMessageType("error")
      setIsLoading(false)
    }
  }

  // Handle updating existing schema
  const handleUpdateSchema = async () => {
    if (!jsonUpdateInput.trim()) {
      setMessage("Please enter JSON schema data to update.")
      setMessageType("error")
      return
    }

    try {
      const schemaData = JSON.parse(jsonUpdateInput)

      if (!schemaData.formId) {
        setMessage("Schema JSON must include a formId field.")
        setMessageType("error")
        return
      }

      setIsLoading(true)

      // TODO: Implement API call to update schema
      // const response = await fetch(`http://localhost:4441/no-code-db-api/form/schema/${schemaData.formId}`, {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(schemaData)
      // });

      // Simulate success for now
      setTimeout(() => {
        setMessage(`Schema ${schemaData.formId} updated successfully!`)
        setMessageType("success")
        setJsonUpdateInput("")
        setIsLoading(false)
      }, 1000)
    } catch (error) {
      if (error instanceof SyntaxError) {
        setMessage("Invalid JSON format. Please check your input.")
      } else {
        setMessage("Error updating schema. Please try again.")
      }
      setMessageType("error")
      setIsLoading(false)
    }
  }

  return (
    <div className="App">
      <header className="app-header">
        <h1>Schema Management System</h1>
        <p>Manage your database schemas with ease</p>
      </header>

      <main className="main-content">
        {/* Message Display */}
        {message && <div className={`message ${messageType}`}>{message}</div>}

        {/* New Schema Definition Area */}
        <section className="schema-section">
          <h2>Create New Schema</h2>
          <div className="input-group">
            <label htmlFor="natural-language-input">Describe Your New Schema in Plain English</label>
            <textarea
              id="natural-language-input"
              className="large-textarea"
              placeholder="Example: I need a form for customer details with name, email, and a boolean for active status."
              value={naturalLanguageInput}
              onChange={(e) => setNaturalLanguageInput(e.target.value)}
              rows={4}
            />
            <button className="primary-button" onClick={handleAddSchema} disabled={isLoading}>
              {isLoading ? "Adding Schema..." : "Add Schema"}
            </button>
          </div>
        </section>

        {/* Schema Actions */}
        <section className="schema-section">
          <h2>Schema Actions</h2>

          {/* Show All Schemas */}
          <div className="action-group">
            <button className="secondary-button" onClick={handleShowAllSchemas} disabled={isLoading}>
              {isLoading ? "Loading..." : "Show All Schemas"}
            </button>
          </div>

          {/* Update Existing Schema */}
          <div className="update-section">
            <h3>Update Existing Schema</h3>
            <div className="input-group">
              <label htmlFor="json-update-input">Paste JSON to Update Schema</label>
              <textarea
                id="json-update-input"
                className="large-textarea json-textarea"
                placeholder='{"formId": "customer-form-001", "name": "Updated Customer Form", "fields": [...]}'
                value={jsonUpdateInput}
                onChange={(e) => setJsonUpdateInput(e.target.value)}
                rows={6}
              />
              <button className="primary-button" onClick={handleUpdateSchema} disabled={isLoading}>
                {isLoading ? "Updating Schema..." : "Update Schema"}
              </button>
            </div>
          </div>
        </section>

        {/* Schema Display Area */}
        <section className="schema-section">
          <h2>Current Schemas</h2>
          <div className="schema-display">
            {schemas.length === 0 ? (
              <p className="no-schemas">No schemas to display. Click "Show All Schemas" to load existing schemas.</p>
            ) : (
              <div className="schemas-list">
                {schemas.map((schema, index) => (
                  <div key={index} className="schema-item">
                    <h4>
                      {schema.name} (ID: {schema.formId})
                    </h4>
                    <pre className="schema-json">{JSON.stringify(schema, null, 2)}</pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
