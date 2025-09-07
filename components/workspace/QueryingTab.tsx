"use client"

import React, { useState, useEffect } from 'react'
import { Search, Database, Play, Download, Filter } from 'lucide-react'

interface App {
  _id: string
  appsId: string
  appsName: string
  description: string
}

interface Schema {
  _id: string
  appsId: string
  formId: string
  description: string
  fields: Record<string, any>
}

export default function QueryingTab() {
  const [apps, setApps] = useState<App[]>([])
  const [schemas, setSchemas] = useState<Schema[]>([])
  const [selectedApp, setSelectedApp] = useState('')
  const [selectedSchema, setSelectedSchema] = useState('')
  const [selectedField, setSelectedField] = useState('')
  const [operator, setOperator] = useState('EQUALS')
  const [queryValue, setQueryValue] = useState('')
  const [queryResults, setQueryResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingApps, setIsLoadingApps] = useState(false)
  const [isLoadingSchemas, setIsLoadingSchemas] = useState(false)

  // Load apps on component mount
  useEffect(() => {
    loadApps()
  }, [])

  // Load schemas when app is selected
  useEffect(() => {
    if (selectedApp) {
      loadSchemas(selectedApp)
    } else {
      setSchemas([])
      setSelectedSchema('')
      setSelectedField('')
    }
  }, [selectedApp])

  const loadApps = async () => {
    setIsLoadingApps(true)
    try {
      const response = await fetch('http://localhost:4441/no-code-db-api/apps')
      if (response.ok) {
        const data = await response.json()
        setApps(data)
      } else {
        console.error('Failed to load apps')
      }
    } catch (error) {
      console.error('Error loading apps:', error)
    } finally {
      setIsLoadingApps(false)
    }
  }

  const loadSchemas = async (appsId: string) => {
    setIsLoadingSchemas(true)
    try {
      const response = await fetch(`http://localhost:4441/no-code-db-api/apps/${appsId}/schemas`)
      if (response.ok) {
        const data = await response.json()
        setSchemas(data)
      } else {
        console.error('Failed to load schemas')
      }
    } catch (error) {
      console.error('Error loading schemas:', error)
    } finally {
      setIsLoadingSchemas(false)
    }
  }

  const getFieldsForSchema = () => {
    const schema = schemas.find(s => s.formId === selectedSchema)
    if (!schema) return []
    return Object.keys(schema.fields)
  }

  const handleRunQuery = async () => {
    if (!selectedApp || !selectedSchema || !selectedField || !queryValue) {
      alert('Please select app, schema, field and enter a value')
      return
    }

    setIsLoading(true)
    try {
      // Convert numeric values for proper comparison
      let processedValue: any = queryValue
      if (!isNaN(Number(queryValue)) && queryValue.trim() !== '') {
        processedValue = Number(queryValue)
      }

      const requestBody = {
        appsId: selectedApp,
        formId: selectedSchema,
        filter: {
          field: selectedField,
          operator: operator,
          value: processedValue
        }
      }

      console.log('Query request:', requestBody)

      const response = await fetch('http://localhost:4441/no-code-db-api/form/data/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Query response:', data)
        setQueryResults(Array.isArray(data) ? data : [data])
      } else {
        const errorText = await response.text()
        console.error('Query failed:', response.status, errorText)
        alert(`Query failed: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('Query failed:', error)
      alert('Query failed: ' + error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGetAllRecords = async () => {
    if (!selectedApp || !selectedSchema) {
      alert('Please select an app and schema first')
      return
    }

    setIsLoading(true)
    try {
      // Try POST method with JSON body as shown in README
      const requestBody = {
        appsId: selectedApp,
        formId: selectedSchema
      }

      console.log('Get all records request body:', requestBody)

      const response = await fetch('http://localhost:4441/no-code-db-api/form/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Get all records response:', data)
        setQueryResults(Array.isArray(data) ? data : [data])
      } else {
        const errorText = await response.text()
        console.error('Failed to get records:', response.status, errorText)
        alert(`Failed to get records: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('Error getting records:', error)
      alert('Error getting records: ' + error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCountRecords = async () => {
    if (!selectedApp || !selectedSchema) {
      alert('Please select an app and schema first')
      return
    }

    setIsLoading(true)
    try {
      const requestBody = {
        appsId: selectedApp,
        formId: selectedSchema,
        aggregation: {
          type: 'COUNT'
        }
      }

      console.log('Count records request:', requestBody)

      const response = await fetch('http://localhost:4441/no-code-db-api/form/data/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Count records response:', data)
        alert(`Total records: ${data.count || data}`)
      } else {
        const errorText = await response.text()
        console.error('Count failed:', response.status, errorText)
        alert(`Count failed: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('Count failed:', error)
      alert('Count failed: ' + error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportResults = () => {
    if (queryResults.length === 0) {
      alert('No results to export')
      return
    }
    
    // TODO: Implement CSV export
    console.log('Exporting results:', queryResults)
  }

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      {/* Header */}
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center space-x-3">
          <Search className="w-6 h-6 text-blue-400" />
          <div>
            <h2 className="text-xl font-semibold text-white">Database Querying</h2>
            <p className="text-sm text-zinc-400">Query your database records with filters and search</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Query Builder Sidebar */}
        <div className="w-80 border-r border-zinc-800 p-6 space-y-6">
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Query Builder</h3>
            
            {/* App Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-300">
                Select App
              </label>
              <select
                value={selectedApp}
                onChange={(e) => setSelectedApp(e.target.value)}
                className="w-full p-3 border border-zinc-600 rounded-lg bg-zinc-900 text-zinc-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                disabled={isLoadingApps}
              >
                <option value="">{isLoadingApps ? 'Loading apps...' : 'Choose an app...'}</option>
                {apps.map((app) => (
                  <option key={app._id} value={app.appsId}>
                    {app.appsName}
                  </option>
                ))}
              </select>
            </div>

            {/* Schema Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-300">
                Select Schema
              </label>
              <select
                value={selectedSchema}
                onChange={(e) => {
                  setSelectedSchema(e.target.value)
                  setSelectedField('')
                }}
                className="w-full p-3 border border-zinc-600 rounded-lg bg-zinc-900 text-zinc-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                disabled={!selectedApp || isLoadingSchemas}
              >
                <option value="">
                  {isLoadingSchemas ? 'Loading schemas...' : 'Choose a schema...'}
                </option>
                {schemas.map((schema) => (
                  <option key={schema._id} value={schema.formId}>
                    {schema.formId}
                  </option>
                ))}
              </select>
            </div>

            {/* Field Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-300">
                Select Field (Optional)
              </label>
              <select
                value={selectedField}
                onChange={(e) => setSelectedField(e.target.value)}
                className="w-full p-3 border border-zinc-600 rounded-lg bg-zinc-900 text-zinc-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                disabled={!selectedSchema}
              >
                <option value="">All fields</option>
                {getFieldsForSchema().map((field) => (
                  <option key={field} value={field}>
                    {field}
                  </option>
                ))}
              </select>
            </div>

            {/* Operator Selection */}
            {selectedField && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-300">
                  Operator
                </label>
                <select
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  className="w-full p-3 border border-zinc-600 rounded-lg bg-zinc-900 text-zinc-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="EQUALS">Equals</option>
                  <option value="NOT_EQUALS">Not Equals</option>
                  <option value="GREATER_THAN">Greater Than</option>
                  <option value="GREATER_THAN_OR_EQUAL">Greater Than or Equal</option>
                  <option value="LESS_THAN">Less Than</option>
                  <option value="LESS_THAN_OR_EQUAL">Less Than or Equal</option>
                  <option value="IN">In</option>
                  <option value="LIKE">Like</option>
                </select>
              </div>
            )}

            {/* Query Value */}
            {selectedField && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-300">
                  Value
                </label>
                <input
                  type="text"
                  value={queryValue}
                  onChange={(e) => setQueryValue(e.target.value)}
                  placeholder="Enter value to search for..."
                  className="w-full p-3 border border-zinc-600 rounded-lg bg-zinc-900 text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <p className="text-xs text-zinc-500 mt-1">
                  Tip: For numeric fields, enter numbers without quotes (e.g., 29 not "29")
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleRunQuery}
                disabled={isLoading || !selectedApp || !selectedSchema || !selectedField || !queryValue}
                className="w-full flex items-center justify-center space-x-2 p-3 bg-blue-600 rounded-lg text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>{isLoading ? 'Running...' : 'Run Filtered Query'}</span>
              </button>

              <button
                onClick={handleGetAllRecords}
                disabled={isLoading || !selectedApp || !selectedSchema}
                className="w-full flex items-center justify-center space-x-2 p-3 bg-green-600 rounded-lg text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Database className="w-4 h-4" />
                <span>{isLoading ? 'Loading...' : 'Get All Records'}</span>
              </button>

              <button
                onClick={handleCountRecords}
                disabled={isLoading || !selectedApp || !selectedSchema}
                className="w-full flex items-center justify-center space-x-2 p-3 bg-purple-600 rounded-lg text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span>{isLoading ? 'Counting...' : 'Count Records'}</span>
              </button>

              <button
                onClick={handleExportResults}
                disabled={queryResults.length === 0}
                className="w-full flex items-center justify-center space-x-2 p-3 border border-zinc-600 rounded-lg text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export Results</span>
              </button>
            </div>
          </div>

          {/* Query Info */}
          {selectedApp && selectedSchema && (
            <div>
              <h4 className="text-md font-medium text-white mb-3">Query Info</h4>
              <div className="space-y-2 text-sm text-zinc-400">
                <div>App: {apps.find(a => a.appsId === selectedApp)?.appsName}</div>
                <div>Schema: {selectedSchema}</div>
                {selectedField && <div>Field: {selectedField}</div>}
                {selectedField && operator && <div>Operator: {operator}</div>}
                {selectedField && queryValue && <div>Value: {queryValue}</div>}
              </div>
            </div>
          )}
        </div>

        {/* Results Area */}
        <div className="flex-1 p-6">
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Query Results</h3>
              {queryResults.length > 0 && (
                <span className="text-sm text-zinc-400">
                  {queryResults.length} record{queryResults.length !== 1 ? 's' : ''} found
                </span>
              )}
            </div>

            {/* Results Table */}
            <div className="flex-1 bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
              {queryResults.length === 0 ? (
                <div className="h-full flex items-center justify-center text-zinc-500">
                  <div className="text-center">
                    <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No query results yet</p>
                    <p className="text-sm mt-2">Select an app and schema, then run a query to see results</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-auto h-full">
                  <table className="w-full">
                    <thead className="bg-zinc-800 sticky top-0">
                      <tr>
                        {Object.keys(queryResults[0] || {}).map((key) => (
                          <th key={key} className="text-left p-4 text-sm font-medium text-zinc-300 border-b border-zinc-700">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queryResults.map((row, index) => (
                        <tr key={index} className="hover:bg-zinc-800/50 border-b border-zinc-800/50">
                          {Object.values(row).map((value: any, cellIndex) => (
                            <td key={cellIndex} className="p-4 text-sm text-zinc-300">
                              {String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
