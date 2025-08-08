"use client"

import { useState } from "react"
import { ChevronRight, ChevronsRight, Pencil, Check, X, Plus } from "lucide-react"

type JsonTreeViewProps = {
  data: any
  onUpdate: (data: any) => void
  rootName?: string
  viewAsTable?: boolean
}

type JsonNodeProps = {
  name: string
  value: any
  path: (string | number)[]
  onUpdate: (path: (string | number)[], value: any) => void
  isRoot?: boolean
}
const JsonNode = ({ name, value, path, onUpdate, isRoot = false }: JsonNodeProps) => {
  const [isOpen, setIsOpen] = useState(isRoot)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)

  const isObject = typeof value === "object" && value !== null && !Array.isArray(value)
  const isArray = Array.isArray(value)

  const handleToggle = () => {
    if (isObject || isArray) {
      setIsOpen(!isOpen)
    }
  }

  const handleEdit = () => {
    if (!isObject && !isArray) {
      setEditValue(value)
      setIsEditing(true)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const handleSave = () => {
    // Basic type coercion
    let finalValue: any = editValue
    if (!isNaN(value) && !isNaN(Number(editValue))) {
      finalValue = Number(editValue)
    } else if (typeof value === 'boolean') {
      finalValue = String(editValue).toLowerCase() === 'true'
    }

    onUpdate(path, finalValue)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  return (
    <div className={`ml-${isRoot ? 0 : 6} font-mono text-sm`}>
      <div className="flex items-center group cursor-pointer" onClick={handleToggle}>
        {(isObject || isArray) && (
          <ChevronRight
            className={`w-4 h-4 mr-1 text-gray-500 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
          />
        )}
        <span className="text-gray-900 font-semibold">{name}:</span>
        {!isObject && !isArray && !isEditing && (
          <>
            <span className={`ml-2 ${typeof value === 'string' ? 'text-emerald-700' : 'text-blue-700'}`}>
              {typeof value === 'string' ? `"${value}"` : String(value)}
            </span>
            <Pencil className="w-3 h-3 ml-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" onClick={handleEdit} />
          </>
        )}
        {isEditing && (
          <div className="flex items-center ml-2">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              autoFocus
              className="px-1 py-0 border border-blue-400 rounded-sm bg-blue-50 focus:outline-none"
            />
            <Check className="w-4 h-4 text-green-600 cursor-pointer mx-1" onClick={handleSave} />
            <X className="w-4 h-4 text-red-600 cursor-pointer" onClick={handleCancel} />
          </div>
        )}
      </div>

      {isOpen && (isObject || isArray) && (
        <div className="border-l border-gray-200">
          {Object.entries(value).map(([key, childValue]) => (
            <JsonNode
              key={key}
              name={key}
              value={childValue}
              path={[...path, key]}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Helper: get input type from fieldType
const getInputType = (fieldType: string) => {
  switch (fieldType) {
    case 'EMAIL': return 'email';
    case 'NUMERIC':
    case 'CURRENCY': return 'number';
    case 'DATE': return 'date';
    case 'DATE_TIME': return 'datetime-local';
    case 'BOOLEAN': return 'checkbox';
    case 'URL': return 'url';
    default: return 'text';
  }
}

// Modal form for adding a document
const AddDocumentModal = ({ schema, open, onClose }: { schema: any, open: boolean, onClose: (success?: boolean) => void }) => {
  const [formData, setFormData] = useState<any>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) return null;
  if (!schema || !Array.isArray(schema.fields)) return null;

  const handleChange = (field: any, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field.fieldId]: value }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      // Only include fields defined in the schema
      let allowedFieldKeys: string[] = [];
      if (Array.isArray(schema.fields)) {
        allowedFieldKeys = schema.fields.map((f: any) => f.fieldId);
      } else if (typeof schema.fields === 'object' && schema.fields !== null) {
        allowedFieldKeys = Object.keys(schema.fields);
      }
      const filteredFields: Record<string, any> = {};
      for (const key of allowedFieldKeys) {
        if (formData.hasOwnProperty(key)) {
          filteredFields[key] = formData[key];
        }
      }
      // Prepare the request body according to the specification
      const payload = { 
        formId: schema.formId, 
        fields: filteredFields 
      };
      
      console.log('POSTing document to /no-code-db-api/form/data:', payload);
      
      // Send the document data to the non-relational database API endpoint
      const response = await fetch('http://localhost:4441/no-code-db-api/form/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        let errorMsg = 'Failed to add document';
        try {
          const errorData = await response.json();
          if (errorData && errorData.message) {
            errorMsg = errorData.message;
          } else if (typeof errorData === 'string') {
            errorMsg = errorData;
          }
        } catch (err) {
          // If not JSON, try text
          try {
            const errorText = await response.text();
            if (errorText) errorMsg = errorText;
          } catch {}
        }
        throw new Error(errorMsg);
      }
      onClose(true);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 min-w-[320px] max-w-[90vw]">
        <h2 className="text-xl font-semibold mb-4">Add Document to {schema.name || schema.formId}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {schema.fields.map((field: any) => (
            <div key={field.fieldId} className="flex flex-col">
              <label className="font-medium mb-1">{field.fieldId}{field.isRequired ? ' *' : ''}</label>
              <input
                type={getInputType(field.fieldType)}
                value={formData[field.fieldId] ?? ''}
                required={!!field.isRequired}
                minLength={field.length || undefined}
                pattern={field.pattern || undefined}
                onChange={e => handleChange(field, field.fieldType === 'BOOLEAN' ? e.target.checked : e.target.value)}
                className="border rounded px-2 py-1"
              />
            </div>
          ))}
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="flex gap-2 mt-4">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={isSubmitting}>{isSubmitting ? 'Adding...' : 'Add Document'}</button>
            <button type="button" className="bg-gray-200 px-4 py-2 rounded" onClick={() => onClose(false)} disabled={isSubmitting}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal form for adding a row to relational table
const AddRowModal = ({ schema, open, onClose, tableName }: { schema: any, open: boolean, onClose: (success?: boolean) => void, tableName?: string }) => {
  const [formData, setFormData] = useState<any>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tableNameInput, setTableNameInput] = useState(tableName || "");

  if (!open) return null;
  if (!schema || !Array.isArray(schema.fields)) return null;

  const handleChange = (field: any, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field.fieldId]: value }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError(null);
    
    // Table name is now inferred from schema.formId, no need to validate
    
    setIsSubmitting(true);
    try {
      // Only include fields defined in the schema
      let allowedFieldKeys: string[] = [];
      if (Array.isArray(schema.fields)) {
        allowedFieldKeys = schema.fields.map((f: any) => f.fieldId);
      } else if (typeof schema.fields === 'object' && schema.fields !== null) {
        allowedFieldKeys = Object.keys(schema.fields);
      }
      const filteredFields: Record<string, any> = {};
      for (const key of allowedFieldKeys) {
        if (formData.hasOwnProperty(key)) {
          filteredFields[key] = formData[key];
        }
      }
      
      // Prepare the request body for relational database using the simplified structure
      const payload = { 
        formId: schema.formId,
        fields: filteredFields
      };
      
      console.log('POSTing row to /no-code-db-api/relational/form/data:', payload);
      
      // Send the row data to the relational database API endpoint
      const response = await fetch('http://localhost:4441/no-code-db-api/relational/form/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        let errorMsg = 'Failed to add row';
        try {
          const errorData = await response.json();
          if (errorData && errorData.message) {
            errorMsg = errorData.message;
          } else if (typeof errorData === 'string') {
            errorMsg = errorData;
          }
        } catch (err) {
          // If not JSON, try text
          try {
            const errorText = await response.text();
            if (errorText) errorMsg = errorText;
          } catch {}
        }
        throw new Error(errorMsg);
      }
      onClose(true);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 min-w-[320px] max-w-[90vw]">
        <h2 className="text-xl font-semibold mb-4">Add Row to Table: {schema.formId}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {schema.fields.map((field: any) => (
            <div key={field.fieldId} className="flex flex-col">
              <label className="font-medium mb-1">{field.fieldId}{field.isRequired ? ' *' : ''}</label>
              <input
                type={getInputType(field.fieldType)}
                value={formData[field.fieldId] ?? ''}
                required={!!field.isRequired}
                minLength={field.length || undefined}
                pattern={field.pattern || undefined}
                onChange={e => handleChange(field, field.fieldType === 'BOOLEAN' ? e.target.checked : e.target.value)}
                className="border rounded px-2 py-1"
              />
            </div>
          ))}
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="flex gap-2 mt-4">
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded" disabled={isSubmitting}>{isSubmitting ? 'Adding...' : 'Add Row'}</button>
            <button type="button" className="bg-gray-200 px-4 py-2 rounded" onClick={() => onClose(false)} disabled={isSubmitting}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const JsonTreeView = ({ data, onUpdate, rootName = "root", viewAsTable = false }: JsonTreeViewProps) => {
  const [modalSchema, setModalSchema] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [rowModalOpen, setRowModalOpen] = useState(false);
  const [rowModalSchema, setRowModalSchema] = useState<any>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [confirmMessages, setConfirmMessages] = useState<{ [formId: string]: string | null }>({});
  const handleUpdate = (path: (string | number)[], newValue: any) => {
    // Create a deep copy to avoid direct state mutation
    const newData = JSON.parse(JSON.stringify(data))
    
    // Traverse the path to update the value
    let current = newData
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]]
    }
    current[path[path.length - 1]] = newValue
    
    // Notify the parent component of the change
    onUpdate(newData)
  }

  // Helper: get all schemas (array or single)
  const schemas = Array.isArray(data) ? data : [data];

  // Confirm schema handler (Non-relational):
  // POST to http://localhost:4441/no-code-db-api/form/schema
  const handleConfirmSchema = async (schema: any) => {
    const schemaId = schema.formId || (Array.isArray(schema) ? 'multiple' : 'unknown');
    setConfirming(schemaId);
    setConfirmMessages((prev) => ({ ...prev, [schemaId]: "Confirming schema..." }));
    
    try {
      console.log(`Sending POST request to confirm schema: ${schemaId}`);
      
      if (Array.isArray(schema)) {
        // If schema is an array, POST each one individually
        for (const singleSchema of schema) {
          console.log("Sending schema:", singleSchema);
          const response = await fetch('http://localhost:4441/no-code-db-api/form/schema', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(singleSchema)
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error confirming schema: ${errorText}`);
            throw new Error('Failed to confirm one of the schemas');
          }
        }
        setConfirmMessages((prev) => ({ ...prev, all: 'All schemas confirmed and saved!' }));
      } else {
        console.log("Sending schema:", schema);
        const response = await fetch('http://localhost:4441/no-code-db-api/form/schema', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(schema)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error confirming schema: ${errorText}`);
          throw new Error('Failed to confirm schema');
        }
        
        console.log(`Schema ${schemaId} confirmed successfully`);
        setConfirmMessages((prev) => ({ ...prev, [schemaId]: 'Schema confirmed and saved!' }));
      }
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setConfirmMessages(prev => {
          const newMessages = { ...prev };
          delete newMessages[schemaId];
          return newMessages;
        });
      }, 3000);
    } catch (error: any) {
      console.error('Error in handleConfirmSchema:', error);
      setConfirmMessages(prev => ({ ...prev, [schemaId]: `Error confirming schema: ${error.message}` }));
    } finally {
      setConfirming("");
    }
  };

  // Helper function to ensure all fields in a schema are properly populated
  const ensureCompleteFields = (schema: any): any => {
    if (!schema || !schema.fields) return schema;
    
    const completeSchema = { ...schema };
    const fields: Record<string, any> = {};
    
    // Process each field to ensure it has all required properties
    Object.entries(schema.fields).forEach(([key, value]: [string, any]) => {
      // Start with existing field data or create a new object
      const field = typeof value === 'object' && value !== null ? { ...value } : {};
      
      // Ensure fieldId is set (use key as fallback)
      field.fieldId = field.fieldId || key;
      
      // For known field types like 'course' or 'student', set appropriate defaults
      if (['course', 'student'].includes(key) && !field.fieldType) {
        field.fieldType = 'REF_FORM';
        field.refFormId = field.refFormId || `${key}s`; // Pluralize for refFormId
        field.isRequired = field.isRequired !== undefined ? field.isRequired : true;
      }
      
      // For other fields, ensure they have at least fieldType
      if (!field.fieldType) {
        // Default to REF_FORM if the field name matches a known schema
        if (key.endsWith('Id') || key.includes('_id')) {
          field.fieldType = 'REF_FORM';
          // Try to derive refFormId from the field name
          const baseField = key.replace(/Id$|_id$/i, '');
          field.refFormId = field.refFormId || `${baseField}s`;
        } else {
          field.fieldType = 'TEXT'; // Default to TEXT if we can't determine
        }
      }
      
      // For REF_FORM fields, ensure refFormId is set
      if (field.fieldType === 'REF_FORM' && !field.refFormId) {
        field.refFormId = `${key}s`; // Pluralize as fallback
      }
      
      fields[key] = field;
    });
    
    completeSchema.fields = fields;
    return completeSchema;
  };
  
  // Add table handler for relational database
  // POST to http://localhost:4441/no-code-db-api/relational/form/schema
  const handleAddTable = async (schema: any) => {
    try {
      console.log(`Sending POST request to add table to relational database for schema: ${schema.formId || "unknown"}`);
      
      // Ensure schema fields are complete before sending
      const completeSchema = ensureCompleteFields(schema);
      
      // Prepare the request body with exact format required by the API
      const requestBody = {
        formId: completeSchema.formId || "unknown",
        fields: completeSchema.fields // Direct fields object without tables array
      };
      
      console.log('Request body for Add Table:', requestBody);
      
      // Send the schema to the relational database API endpoint
      const response = await fetch('http://localhost:4441/no-code-db-api/relational/form/schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error adding table: ${errorText}`);
        throw new Error('Failed to add table to relational database');
      }
      
      console.log('Table added successfully');
      setConfirmMessages(prev => ({ ...prev, [schema.formId || "unknown"]: "Table added successfully!" }));
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setConfirmMessages(prev => {
          const newMessages = { ...prev };
          delete newMessages[schema.formId || "unknown"];
          return newMessages;
        });
      }, 3000);
    } catch (error: any) {
      console.error('Error adding table:', error);
      setConfirmMessages(prev => ({ ...prev, [schema.formId || "unknown"]: `Error adding table: ${error.message}` }));
    }
  };

  // Add row handler for relational database
  // Opens a modal for user to input row data
  const handleAddRow = (schema: any) => {
    let schemaForModal = { ...schema };
    if (schemaForModal.fields && !Array.isArray(schemaForModal.fields)) {
      schemaForModal.fields = Object.values(schemaForModal.fields);
    }
    setRowModalSchema(schemaForModal);
    setRowModalOpen(true);
  };

  // Helper: open Add Document modal with fields as array
  const openAddDocumentModal = (schema: any) => {
    let schemaForModal = { ...schema };
    if (schemaForModal.fields && !Array.isArray(schemaForModal.fields)) {
      schemaForModal.fields = Object.values(schemaForModal.fields);
    }
    setModalSchema(schemaForModal);
    setModalOpen(true);
  };
  
  // Handle successful row addition
  const handleRowAdded = (success: boolean = false) => {
    setRowModalOpen(false);
    setRowModalSchema(null);
    
    if (success) {
      const schemaId = rowModalSchema?.formId || "unknown";
      setConfirmMessages(prev => ({ ...prev, [schemaId]: "Row added successfully!" }));
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setConfirmMessages(prev => {
          const newMessages = { ...prev };
          delete newMessages[schemaId];
          return newMessages;
        });
      }, 3000);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200">
      {schemas.map((schema, idx) => (
        <div key={schema.formId || idx} className="mb-8">
          <div className="flex flex-col mb-2">
            <div className="flex items-center mb-2">
              <span className="font-bold text-lg mr-2">{schema.formId || rootName}</span>
            </div>
            <div className="flex items-center mb-2">
              <span className="text-sm font-medium text-blue-600 mr-2">Non-Relational Database:</span>
              <div className="flex">
                <button className="flex items-center gap-1 bg-emerald-600 text-white px-3 py-1 rounded hover:bg-emerald-700" onClick={() => openAddDocumentModal(schema)}>
                  <Plus className="w-4 h-4" /> Add Document
                </button>
                <button
                  className="ml-2 flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  onClick={() => handleConfirmSchema(schema)}
                  disabled={confirming === (schema.formId || "unknown")}
                >
                  {confirming === (schema.formId || "unknown") ? 'Confirming...' : 'Confirm Schema'}
                </button>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium text-purple-600 mr-2">Relational Database:</span>
              <div className="flex">
                <button 
                  className="flex items-center gap-1 bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
                  onClick={() => handleAddTable(schema)}
                >
                  <Plus className="w-4 h-4" /> Add Table
                </button>
                <button 
                  className="ml-2 flex items-center gap-1 bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
                  onClick={() => handleAddRow(schema)}
                >
                  <Plus className="w-4 h-4" /> Add Row
                </button>
              </div>
            </div>
          </div>
          {confirmMessages[schema.formId] && (
            <div className="text-sm text-blue-700 mb-2">{confirmMessages[schema.formId]}</div>
          )}
          <JsonNode name={rootName} value={schema} path={[]} onUpdate={handleUpdate} isRoot />
        </div>
      ))}
      <AddDocumentModal schema={modalSchema} open={modalOpen} onClose={() => { setModalOpen(false); setModalSchema(null); }} />
      <AddRowModal schema={rowModalSchema} open={rowModalOpen} onClose={handleRowAdded} />
    </div>
  )
}

export default JsonTreeView 