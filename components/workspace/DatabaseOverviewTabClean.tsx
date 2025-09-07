"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Trash2, Plus, Edit, Save, X, BookOpen, Loader2, Database, FileText, Eye, Edit3, Check } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import SimpleFormCreator from "../SimpleFormCreator"

interface Schema {
  appsId?: string
  formId: string
  description?: string
  fields: Record<string, any>
}

interface DatabaseOverviewTabProps {
  schemaObject: object | null | object[]
  selectedItem: any
  projects: any[]
  formCreationSchema: Schema | null
  formData: Record<string, any> | null
  onFormDataChange: ((data: Record<string, any>) => void) | null
  onFormSubmit: ((formData: Record<string, any>, schema: Schema) => void) | null
  onFormCancel: (() => void) | null
  onSchemaDelete: ((projectName: string, schemaId: string) => void) | null
  onFormCreate: ((schema: Schema) => void) | null
  onSchemaSave: ((projectName: string, schema: Schema) => void) | null
  onBulkSchemaSave: ((projectName: string, schemas: Schema[]) => void) | null
  unsavedSchemas: Record<string, Schema[]>
}

export default function DatabaseOverviewTab({
  schemaObject,
  selectedItem,
  projects,
  formCreationSchema,
  formData,
  onFormDataChange,
  onFormSubmit,
  onFormCancel,
  onSchemaDelete,
  onFormCreate,
  onSchemaSave,
  onBulkSchemaSave,
  unsavedSchemas
}: DatabaseOverviewTabProps) {

  const handleCreateForm = () => {
    const selectedSchema = getSelectedSchema()
    
    if (selectedSchema && !Array.isArray(selectedSchema) && onFormCreate) {
      console.log('Calling onFormCreate with schema:', selectedSchema)
      onFormCreate(selectedSchema)
    } else {
      console.log('Cannot create form - missing selectedSchema or onFormCreate callback')
    }
  }

  if (formCreationSchema) {
    return (
      <SimpleFormCreator
        schema={formCreationSchema}
        formData={formData || {}}
        onFormDataChange={onFormDataChange || (() => {})}
        onFormSubmit={onFormSubmit || (() => {})}
        onFormCancel={onFormCancel || (() => {})}
      />
    )
  }

  const handleDeleteSchema = () => {
    if (selectedItem && selectedItem.type === 'schema' && onSchemaDelete) {
      const projectName = selectedItem.path[1]
      const schemaId = selectedItem.path[3]
      onSchemaDelete(projectName, schemaId)
    }
  }

  const getSelectedProject = () => {
    if (!selectedItem) return null
    return projects.find(p => p.name === selectedItem.path[1])
  }

  const getSelectedSchema = () => {
    if (!selectedItem) return null
    
    if (selectedItem.type === 'schema') {
      const projectName = selectedItem.path[1]
      const schemaId = selectedItem.path[3]
      const project = projects.find(p => p.name === projectName)
      
      if (project && project.schemas) {
        return project.schemas.find((s: Schema) => s.formId === schemaId)
      }
    }
    
    return null
  }

  const renderSchemaDetails = () => {
    const selectedSchema = getSelectedSchema()
    
    if (!selectedSchema) {
      return (
        <div className="flex items-center justify-center h-64 text-zinc-500">
          <div className="text-center">
            <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select a schema to view details</p>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-zinc-100">{selectedSchema.formId}</h3>
            {selectedSchema.description && (
              <p className="text-zinc-400 mt-1">{selectedSchema.description}</p>
            )}
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={handleCreateForm}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Form
            </Button>
            <Button
              onClick={handleDeleteSchema}
              variant="destructive"
              size="sm"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-zinc-100">Schema Fields</CardTitle>
            <CardDescription className="text-zinc-400">
              Field definitions and properties
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(selectedSchema.fields).map(([fieldId, fieldDef]: [string, any]) => (
                <div key={fieldId} className="border border-zinc-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-zinc-100">{fieldId}</h4>
                    <div className="flex space-x-2">
                      <Badge variant="secondary" className="bg-zinc-700 text-zinc-300">
                        {fieldDef.fieldType}
                      </Badge>
                      {fieldDef.required && (
                        <Badge variant="destructive" className="bg-red-900 text-red-300">
                          Required
                        </Badge>
                      )}
                      {fieldDef.unique && (
                        <Badge variant="outline" className="border-yellow-600 text-yellow-400">
                          Unique
                        </Badge>
                      )}
                    </div>
                  </div>
                  {fieldDef.description && (
                    <p className="text-sm text-zinc-400">{fieldDef.description}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      {renderSchemaDetails()}
    </div>
  )
}
