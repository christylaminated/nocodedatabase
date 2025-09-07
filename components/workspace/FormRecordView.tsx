import React from 'react'
import { FileText, ArrowLeft, Calendar, User, Database } from 'lucide-react'

interface FormRecord {
  id: string
  name: string
  schemaName: string
  data?: any
}

interface Schema {
  formId: string
  fields: Record<string, any>
}

interface FormRecordViewProps {
  record: FormRecord
  schema: Schema | null
  onBack: () => void
}

export default function FormRecordView({ record, schema, onBack }: FormRecordViewProps) {
  if (!schema) {
    return (
      <div className="p-6 text-center text-zinc-400">
        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Schema not found for {record.schemaName}</p>
      </div>
    )
  }

  const getFieldTypeIcon = (fieldType: string) => {
    switch (fieldType) {
      case 'DATE':
        return <Calendar className="w-4 h-4" />
      case 'TEXT':
        return <FileText className="w-4 h-4" />
      case 'NUMERIC':
      case 'MONEY':
        return <Database className="w-4 h-4" />
      default:
        return <User className="w-4 h-4" />
    }
  }

  const formatFieldValue = (value: any, fieldType: string) => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-zinc-500 italic">No value</span>
    }

    switch (fieldType) {
      case 'MONEY':
        return `$${value}`
      case 'DATE':
        return new Date(value).toLocaleDateString()
      case 'BOOLEAN':
        return value ? 'Yes' : 'No'
      default:
        return String(value)
    }
  }

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      {/* Header */}
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </button>
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-semibold text-white">{record.name}</h2>
              <p className="text-sm text-zinc-400">{record.schemaName} Record • ID: {record.id}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Record Details */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl">
          <h3 className="text-lg font-medium text-white mb-4">Record Details</h3>
          
          <div className="space-y-4">
            {Object.entries(schema.fields).map(([fieldName, fieldConfig]) => {
              const fieldType = fieldConfig.fieldType || 'TEXT'
              const isRequired = fieldConfig.isRequired || false
              const value = record.data?.[fieldName]

              return (
                <div key={fieldName} className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getFieldTypeIcon(fieldType)}
                      <span className="font-medium text-white">{fieldName}</span>
                      {isRequired && (
                        <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">
                          Required
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-zinc-500 uppercase">{fieldType}</span>
                  </div>
                  
                  <div className="text-zinc-300">
                    {formatFieldValue(value, fieldType)}
                  </div>
                  
                  {fieldConfig.description && (
                    <p className="text-xs text-zinc-500 mt-2">{fieldConfig.description}</p>
                  )}
                </div>
              )
            })}
          </div>

          {/* Raw Data Section */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-white mb-4">Raw Data</h3>
            <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
              <pre className="text-xs text-zinc-400 overflow-auto">
                {JSON.stringify(record.data, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
