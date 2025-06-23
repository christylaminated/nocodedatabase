"use client"

import { useState, useEffect } from "react";

// Helper to determine HTML input type from SQL data type
const getHtmlInputType = (sqlType: string) => {
  const lowerSqlType = sqlType.toLowerCase();
  if (lowerSqlType.includes('int') || lowerSqlType.includes('numeric') || lowerSqlType.includes('decimal')) {
    return 'number';
  }
  if (lowerSqlType.includes('date')) {
    return 'date';
  }
  if (lowerSqlType.includes('timestamp')) {
    return 'datetime-local';
  }
  if (lowerSqlType.includes('boolean')) {
    return 'checkbox';
  }
  return 'text';
};

interface AddRowModalProps {
  table: any;
  open: boolean;
  onClose: (success?: boolean) => void;
}

const AddRowModal = ({ table, open, onClose }: AddRowModalProps) => {
  const [formData, setFormData] = useState({});
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when table changes
  useEffect(() => {
    if (table) {
      const initialData = table.columns.reduce((acc: any, col: any) => {
        acc[col.name] = '';
        return acc;
      }, {});
      setFormData(initialData);
    }
  }, [table]);

  if (!open || !table) return null;

  const handleChange = (columnName: string, value: any, type: string) => {
    setFormData(prev => ({
      ...prev,
      [columnName]: type === 'checkbox' ? value.checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        tableName: table.tableName,
        rowData: formData,
      };

      // In a real app, this would be a POST to your backend
      // For now, we'll simulate the call and log it.
      console.log("Simulating POST to /api/v1/relational/insert with payload:", payload);
      
      // Fake delay to simulate network request
      await new Promise(res => setTimeout(res, 1000));
      
      // const response = await fetch('/api/v1/relational/insert', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(payload)
      // });
      // if (!response.ok) throw new Error('Failed to add row.');

      onClose(true); // Close modal on success
    } catch (err) {
      setError((err as any).message || "An unknown error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">Add Row to <span className="font-mono text-blue-600">{table.tableName}</span></h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {table.columns.map((col: any) => (
            <div key={col.name} className="flex flex-col">
              <label htmlFor={col.name} className="font-medium mb-1 capitalize">
                {col.name.replace(/_/g, ' ')}
                {col.isNotNull ? <span className="text-red-500">*</span> : ''}
              </label>
              {getHtmlInputType(col.type) === 'checkbox' ? (
                <input
                  id={col.name}
                  name={col.name}
                  type="checkbox"
                  checked={!!(formData as any)[col.name]}
                  onChange={e => handleChange(col.name, e.target, 'checkbox')}
                  className="h-5 w-5"
                />
              ) : (
                <input
                  id={col.name}
                  name={col.name}
                  type={getHtmlInputType(col.type)}
                  value={(formData as any)[col.name] || ''}
                  onChange={e => handleChange(col.name, getHtmlInputType(col.type) === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value, getHtmlInputType(col.type))}
                  required={col.isNotNull}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              )}
            </div>
          ))}
          {error && <div className="text-red-600 text-sm mt-4">{error}</div>}
          <div className="flex justify-end gap-4 mt-8">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition"
              onClick={() => onClose(false)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Row'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRowModal; 