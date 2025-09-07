"use client"

import React from 'react'

interface Schema {
  appsId?: string
  formId: string
  description?: string
  fields: Record<string, any>
}

interface SimpleFormCreatorProps {
  schema: Schema
  formData: Record<string, any>
  onFormDataChange: (data: Record<string, any>) => void
  onFormSubmit: (formData: Record<string, any>, schema: Schema) => void
  onFormCancel: () => void
}

export default function SimpleFormCreator({
  schema,
  formData,
  onFormDataChange,
  onFormSubmit,
  onFormCancel
}: SimpleFormCreatorProps) {
  const handleFieldChange = (fieldId: string, value: any) => {
    const newData = {
      ...formData,
      [fieldId]: value
    }
    onFormDataChange(newData)
  }

  const handleSubmit = () => {
    onFormSubmit(formData, schema)
  }

  return (
    <div className="space-y-6 p-6 bg-zinc-900 min-h-screen">
      <div className="border-b border-zinc-800 pb-4">
        <h2 className="text-2xl font-extralight text-zinc-100 mb-2">
          Create Form — {schema.formId}
        </h2>
        <p className="text-zinc-400 text-sm">
          Enter data for the {schema.formId} schema.
        </p>
        <p className="text-green-400 text-xs mt-2">✓ Form is rendering successfully</p>
      </div>

      <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-xl p-6 border border-zinc-700">
        <div className="space-y-4">
          {Object.entries(schema.fields).map(([fieldId, fieldDef]: [string, any]) => (
            <div key={fieldId} className="space-y-2">
              <label className="block text-sm font-medium text-zinc-200">
                {fieldId}
                {fieldDef.required && <span className="text-red-400 ml-1">*</span>}
              </label>
              
              {fieldDef.fieldType === 'TEXT' && (
                <input
                  type="text"
                  className="w-full p-3 border border-zinc-600 rounded-lg bg-zinc-900 text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder={`Enter ${fieldId}`}
                  value={formData[fieldId] || ''}
                  onChange={(e) => handleFieldChange(fieldId, e.target.value)}
                />
              )}
              
              {fieldDef.fieldType === 'NUMERIC' && (
                <input
                  type="number"
                  className="w-full p-3 border border-zinc-600 rounded-lg bg-zinc-900 text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder={`Enter ${fieldId}`}
                  value={formData[fieldId] || ''}
                  onChange={(e) => handleFieldChange(fieldId, parseFloat(e.target.value) || '')}
                />
              )}
              
              {fieldDef.fieldType === 'BOOLEAN' && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 bg-zinc-900 border-zinc-600 rounded focus:ring-blue-500"
                    checked={formData[fieldId] || false}
                    onChange={(e) => handleFieldChange(fieldId, e.target.checked)}
                  />
                  <span className="text-zinc-300">Yes/No</span>
                </div>
              )}
              
              {fieldDef.fieldType === 'DATE' && (
                <input
                  type="date"
                  className="w-full p-3 border border-zinc-600 rounded-lg bg-zinc-900 text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  value={formData[fieldId] || ''}
                  onChange={(e) => handleFieldChange(fieldId, e.target.value)}
                />
              )}
              
              {fieldDef.fieldType === 'MONEY' && (
                <input
                  type="number"
                  step="0.01"
                  className="w-full p-3 border border-zinc-600 rounded-lg bg-zinc-900 text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder={`Enter ${fieldId} amount`}
                  value={formData[fieldId] || ''}
                  onChange={(e) => handleFieldChange(fieldId, parseFloat(e.target.value) || '')}
                />
              )}
              
              {fieldDef.fieldType === 'REF_PICK_LIST' && (
                <input
                  type="text"
                  className="w-full p-3 border border-zinc-600 rounded-lg bg-zinc-900 text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder={`Enter ${fieldId} (references ${fieldDef.refPickListId || 'another form'})`}
                  value={formData[fieldId] || ''}
                  onChange={(e) => handleFieldChange(fieldId, e.target.value)}
                />
              )}
              
              {!['TEXT', 'NUMERIC', 'BOOLEAN', 'DATE', 'MONEY', 'REF_PICK_LIST'].includes(fieldDef.fieldType) && (
                <input
                  type="text"
                  className="w-full p-3 border border-zinc-600 rounded-lg bg-zinc-900 text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder={`Enter ${fieldId}`}
                  value={formData[fieldId] || ''}
                  onChange={(e) => handleFieldChange(fieldId, e.target.value)}
                />
              )}
              
              <p className="text-xs text-zinc-500">
                Type: {fieldDef.fieldType}
                {fieldDef.required && ' | Required'}
                {fieldDef.unique && ' | Unique'}
              </p>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-zinc-700">
          <button
            onClick={onFormCancel}
            className="px-4 py-2 border border-zinc-600 rounded-lg text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition-colors"
          >
            Save Form Data
          </button>
        </div>
      </div>
    </div>
  )
}
