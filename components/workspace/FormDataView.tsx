import React from 'react'
import { FileText, Calendar, User } from 'lucide-react'

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

interface FormDataViewProps {
  schemaName: string
  records: FormRecord[]
  schema: Schema | null
  onRecordSelect: (record: FormRecord) => void
}

export default function FormDataView({ schemaName, records, schema, onRecordSelect }: FormDataViewProps) {
  if (!schema) {
    return (
      <div className="p-6 text-center text-zinc-400">
        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Schema not found for {schemaName}</p>
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <div className="p-6 text-center text-zinc-400">
        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">No {schemaName} Records</h3>
        <p>Create a form to add your first {schemaName} record.</p>
      </div>
    )
  }

  const fieldNames = Object.keys(schema.fields)

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      {/* Header */}
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center space-x-3">
          <FileText className="w-6 h-6 text-blue-400" />
          <div>
            <h2 className="text-xl font-semibold text-white">{schemaName} Records</h2>
            <p className="text-sm text-zinc-400">{records.length} record{records.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                  Record Name
                </th>
                {fieldNames.slice(0, 4).map(fieldName => (
                  <th key={fieldName} className="px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                    {fieldName}
                  </th>
                ))}
                {fieldNames.length > 4 && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                    +{fieldNames.length - 4} more
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {records.map((record, index) => (
                <tr 
                  key={record.id}
                  onClick={() => onRecordSelect(record)}
                  className="hover:bg-zinc-800 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <User className="w-4 h-4 text-zinc-400" />
                      <div>
                        <p className="text-sm font-medium text-white">{record.name}</p>
                        <p className="text-xs text-zinc-400">ID: {record.id}</p>
                      </div>
                    </div>
                  </td>
                  {fieldNames.slice(0, 4).map(fieldName => (
                    <td key={fieldName} className="px-4 py-3">
                      <span className="text-sm text-zinc-300">
                        {record.data?.[fieldName] || '-'}
                      </span>
                    </td>
                  ))}
                  {fieldNames.length > 4 && (
                    <td className="px-4 py-3">
                      <span className="text-xs text-zinc-500">
                        Click to view all fields
                      </span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
