"use client"

import { useState, useRef } from "react"
import { FileText, Database, Loader2, Upload, X } from "lucide-react"

interface FormRecord {
  id: string
  name: string
  schemaName: string
  data?: any
}

interface CsvImportTabProps {
  onSchemaGenerated: (schemas: any[], projectName: string, formEntries?: string[] | FormRecord[]) => void
  isGenerating: boolean
  setIsGenerating: (generating: boolean) => void
  setMessage?: (message: string) => void
  setMessageType?: (type: 'success' | 'error' | 'info') => void
}

export default function CsvImportTab({
  onSchemaGenerated,
  isGenerating,
  setIsGenerating,
  setMessage,
  setMessageType
}: CsvImportTabProps) {
  const csvFileInputRef = useRef<HTMLInputElement>(null)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<string[][]>([])

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'text/csv') {
      setCsvFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        parseCsvContent(content)
      }
      reader.readAsText(file)
    }
  }

  const parseCsvContent = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim())
    const data = lines.map(line => line.split(',').map(cell => cell.trim().replace(/"/g, '')))
    setCsvData(data)
  }

  const generateSchemaFromCsv = async (dbType: 'mongodb' | 'postgresql') => {
    if (csvData.length === 0) return

    setIsGenerating(true)
    
    try {
      const headers = csvData[0]
      const sampleRow = csvData[1] || []
      const dataRows = csvData.slice(1) // All data rows (excluding header)
      
      // Extract app info from filename
      const fileName = csvFile?.name.replace('.csv', '') || 'imported_data'
      const appsId = fileName.replace(/\s+/g, '') // Remove spaces for appsId
      const appsName = fileName.replace(/([A-Z])/g, ' $1').trim() // Add spaces before capitals
      
      // Step 1: Create App first
      console.log('=== CSV IMPORT: APP CREATION ===')
      console.log('POST /no-code-db-api/apps')
      
      const appPayload = {
        appsId: appsId,
        appsName: appsName,
        description: `Auto-generated app from CSV import: ${fileName}`
      }
      
      console.log('JSON Body:', JSON.stringify(appPayload, null, 2))
      
      if (setMessage && setMessageType) {
        setMessage('Creating app...')
        setMessageType('info')
      }
      
      const appResponse = await fetch('http://localhost:4441/no-code-db-api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appPayload)
      })
      
      if (!appResponse.ok) {
        const errorText = await appResponse.text().catch(() => 'No error details available')
        console.error(`Error creating app (${appResponse.status}): ${errorText}`)
        throw new Error(`Failed to create app: ${appResponse.status} ${appResponse.statusText}`)
      }
      
      console.log('✅ App created successfully')
      
      // Step 2: Infer field types from sample data
      const fields: Record<string, any> = {}
      
      headers.forEach((header, index) => {
        const sampleValue = sampleRow[index] || ''
        let fieldType = 'TEXT'
        
        // Simple type inference
        if (!isNaN(Number(sampleValue)) && sampleValue !== '') {
          fieldType = 'NUMERIC'
        } else if (sampleValue.toLowerCase() === 'true' || sampleValue.toLowerCase() === 'false') {
          fieldType = 'BOOLEAN'
        }
        
        fields[header] = {
          fieldId: header,
          fieldType: fieldType,
          allowMultiple: false
        }
      })

      // Step 3: Create Schema with proper structure
      const schema = {
        appsId: appsId,
        formId: fileName,
        description: `Auto-generated schema from CSV: ${fileName}`,
        fields: fields
      }

      const schemaEndpoint = dbType === 'mongodb' 
        ? 'http://localhost:4441/no-code-db-api/form/schema'
        : 'http://localhost:4441/no-code-db-api/relational/form/schema'

      console.log('=== CSV IMPORT: SCHEMA SAVE ===')
      console.log(`POST ${schemaEndpoint}`)
      console.log('JSON Body:', JSON.stringify(schema, null, 2))
      
      if (setMessage && setMessageType) {
        setMessage(`Creating schema for ${dbType}...`)
        setMessageType('info')
      }
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      const schemaResponse = await fetch(schemaEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schema),
        signal: controller.signal
      }).catch(err => {
        if (err.name === 'AbortError') {
          throw new Error('Request timed out. Is the MongoDB API server running?')
        }
        throw err
      })
      
      clearTimeout(timeoutId)
      
      if (!schemaResponse.ok) {
        const errorText = await schemaResponse.text().catch(() => 'No error details available')
        console.error(`Error saving schema (${schemaResponse.status}): ${errorText}`)
        throw new Error(`Failed to save schema: ${schemaResponse.status} ${schemaResponse.statusText}`)
      }
      
      console.log('✅ Schema saved successfully')
      
      // Step 4: Import all CSV data rows
      if (dataRows.length > 0) {
        console.log('=== CSV IMPORT: DATA IMPORT ===')
        console.log(`Importing ${dataRows.length} data rows...`)
        
        if (setMessage && setMessageType) {
          setMessage(`App and schema created! Importing ${dataRows.length} data rows...`)
          setMessageType('info')
        }
        
        const failedRows: number[] = []
        
        // Convert and import each row
        for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i]
          const rowData: Record<string, any> = {}
          
          // Convert each cell to proper data type
          headers.forEach((header, index) => {
            const cellValue = row[index] || ''
            const fieldDef = fields[header]
            
            if (fieldDef.fieldType === 'NUMERIC') {
              rowData[header] = cellValue === '' ? null : Number(cellValue)
            } else if (fieldDef.fieldType === 'BOOLEAN') {
              rowData[header] = cellValue.toLowerCase() === 'true'
            } else {
              rowData[header] = cellValue
            }
          })
          
          const formPayload = {
            appsId: appsId,
            formId: schema.formId,
            fields: rowData
          }
          
          // Log first 3 rows as samples
          if (i < 3) {
            console.log(`Sample Row ${i + 1}:`)
            console.log('POST /no-code-db-api/form/data')
            console.log('JSON Body:', JSON.stringify(formPayload, null, 2))
          }
          
          try {
            const dataResponse = await fetch('http://localhost:4441/no-code-db-api/form/data', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(formPayload)
            })
            
            if (!dataResponse.ok) {
              console.error(`Failed to import row ${i + 1}:`, await dataResponse.text().catch(() => 'No error details'))
              failedRows.push(i + 1)
            }
          } catch (error) {
            console.error(`Error importing row ${i + 1}:`, error)
            failedRows.push(i + 1)
          }
          
          // Update progress
          if (setMessage && setMessageType) {
            setMessage(`Importing data... ${i + 1}/${dataRows.length} rows processed`)
            setMessageType('info')
          }
        }
        
        // Final summary
        const successCount = dataRows.length - failedRows.length
        console.log(`=== IMPORT COMPLETE ===`)
        console.log(`✅ Successfully imported: ${successCount}/${dataRows.length} rows`)
        if (failedRows.length > 0) {
          console.log(`❌ Failed rows: ${failedRows.join(', ')}`)
        }
        
        if (setMessage && setMessageType) {
          if (failedRows.length === 0) {
            setMessage(`✅ Complete! App created, schema saved, and ${successCount} rows imported successfully.`)
            setMessageType('success')
          } else {
            setMessage(`⚠️ App and schema created, ${successCount}/${dataRows.length} rows imported. ${failedRows.length} rows failed.`)
            setMessageType('error')
          }
        }
      } else {
        if (setMessage && setMessageType) {
          setMessage('✅ App and schema created successfully (no data rows to import).')
          setMessageType('success')
        }
      }
      
      // Create form records for the UI
      const formRecords = dataRows.map((row, index) => {
        const rowData: Record<string, any> = {}
        
        // Convert each cell to proper data type
        headers.forEach((header, headerIndex) => {
          const cellValue = row[headerIndex] || ''
          const fieldDef = fields[header]
          
          if (fieldDef.fieldType === 'NUMERIC') {
            rowData[header] = cellValue === '' ? null : Number(cellValue)
          } else if (fieldDef.fieldType === 'BOOLEAN') {
            rowData[header] = cellValue.toLowerCase() === 'true'
          } else {
            rowData[header] = cellValue
          }
        })
        
        return {
          id: `csv_import_${Date.now()}_${index}`,
          name: `${fileName} Record ${index + 1}`,
          schemaName: fileName,
          data: rowData
        }
      })
      
      // Return the schema with proper structure for the workspace
      const workspaceSchema = {
        appsId: appsId,
        formId: schema.formId,
        fields: fields
      }
      
      if (onSchemaGenerated) {
        onSchemaGenerated([workspaceSchema], appsId, formRecords)
      }
      // Reset CSV upload state
      setCsvFile(null)
      setCsvData([])
      
    } catch (error) {
      console.error('Error in CSV import process:', error)
      if (setMessage && setMessageType) {
        let errorMessage = 'Error during CSV import'
        
        if (error instanceof Error) {
          errorMessage = error.message
          
          if (error.message.includes('Failed to fetch') || error.message.includes('timed out')) {
            errorMessage = "Could not connect to the MongoDB API server. Please ensure it's running at http://localhost:4441"
          }
        }
        
        setMessage(`Error: ${errorMessage}`)
        setMessageType('error')
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const clearCsvData = () => {
    setCsvFile(null)
    setCsvData([])
    if (csvFileInputRef.current) {
      csvFileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Title and Breadcrumb */}
      <div className="border-b border-zinc-800 pb-4">
        <h2 className="text-2xl font-extralight text-zinc-100 mb-2">CSV Import — NoCode</h2>
        <p className="text-zinc-400 text-sm">Upload your CSV file to automatically generate database schemas from your existing data.</p>
      </div>

      {/* CSV Upload Section */}
      <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-xl p-6 border border-zinc-700">
        <div className="flex items-center space-x-3 mb-6">
          <Upload className="w-6 h-6 text-green-400" />
          <div>
            <h3 className="text-xl font-medium text-zinc-100">Upload CSV File</h3>
            <p className="text-sm text-zinc-400">Generate schema from your existing CSV data with automatic type detection</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-zinc-600 rounded-lg p-8 text-center">
            <input
              ref={csvFileInputRef}
              type="file"
              accept=".csv"
              onChange={handleCsvUpload}
              className="hidden"
            />
            <FileText className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
            <p className="text-lg text-zinc-300 mb-2">
              {csvFile ? `Selected: ${csvFile.name}` : 'Select a CSV file to generate schema'}
            </p>
            <p className="text-sm text-zinc-500 mb-4">
              Supports CSV files with headers. Field types will be automatically detected.
            </p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => csvFileInputRef.current?.click()}
                className="px-6 py-3 bg-green-600 rounded-lg text-white hover:bg-green-700 transition-colors font-medium"
              >
                Choose CSV File
              </button>
              {csvFile && (
                <button
                  onClick={clearCsvData}
                  className="px-6 py-3 bg-zinc-700 rounded-lg text-zinc-300 hover:bg-zinc-600 transition-colors font-medium flex items-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {csvData.length > 0 && (
            <div className="space-y-4">
              <div className="bg-zinc-900 rounded-lg p-6">
                <h4 className="text-lg font-medium text-zinc-200 mb-4 flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <span>Data Preview (first 5 rows)</span>
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-700">
                        {csvData[0]?.map((header, index) => (
                          <th key={index} className="text-left p-3 text-zinc-300 font-semibold bg-zinc-800">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.slice(1, 6).map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="p-3 text-zinc-400">
                              {cell || <span className="text-zinc-600 italic">empty</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-zinc-500 mt-3">
                  Showing {Math.min(5, csvData.length - 1)} of {csvData.length - 1} data rows
                </p>
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => generateSchemaFromCsv('mongodb')}
                  disabled={isGenerating}
                  className="flex-1 px-6 py-4 bg-green-600 rounded-lg text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 font-medium text-lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Database className="w-5 h-5" />
                      <span>Generate Schema for MongoDB</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => generateSchemaFromCsv('postgresql')}
                  disabled={isGenerating}
                  className="flex-1 px-6 py-4 bg-green-600 rounded-lg text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 font-medium text-lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Database className="w-5 h-5" />
                      <span>Generate Schema for PostgreSQL</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 rounded-xl p-6 border border-blue-800/30">
        <h4 className="text-lg font-medium text-blue-300 mb-3">How it works</h4>
        <div className="space-y-2 text-sm text-blue-200">
          <p>• Upload a CSV file with column headers in the first row</p>
          <p>• Field types are automatically detected from sample data:</p>
          <div className="ml-4 space-y-1 text-xs text-blue-300">
            <p>- Numbers → NUMERIC fields</p>
            <p>- true/false → BOOLEAN fields</p>
            <p>- Everything else → TEXT fields</p>
          </div>
          <p>• The schema will be named after your CSV filename</p>
          <p>• Use "Save to MongoDB" to register the schema, then "Create Form" to add data</p>
        </div>
      </div>
    </div>
  )
}
