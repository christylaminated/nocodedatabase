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
import { getLlamaExplanation } from "@/lib/llamaExplain"
import { useState } from "react"

interface Schema {
  appsId?: string
  formId: string
  description?: string
  fields: Record<string, any>
  databaseType?: 'mongodb' | 'postgresql'
  metadata?: Record<string, any>
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
  onSchemaSave: ((projectName: string, schema: Schema, dbType?: 'mongodb' | 'postgresql') => void) | null
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
  const [explanation, setExplanation] = useState<string>('')
  const [isExplaining, setIsExplaining] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)
  const [selectedDbType, setSelectedDbType] = useState<'mongodb' | 'postgresql'>('mongodb')
  const [followUpQuestion, setFollowUpQuestion] = useState<string>('')
  const [isFollowingUp, setIsFollowingUp] = useState(false)
  const [currentSchema, setCurrentSchema] = useState<Schema | object | null>(null)

  const handleCreateForm = () => {
    const selectedSchema = getSelectedSchema()
    
    if (selectedSchema && !Array.isArray(selectedSchema) && onFormCreate) {
      console.log('Calling onFormCreate with schema:', selectedSchema)
      onFormCreate(selectedSchema)
    } else {
      console.log('Cannot create form - missing selectedSchema or onFormCreate callback')
    }
  }

  const handleAddAllSchemas = async (dbType: 'mongodb' | 'postgresql') => {
    const selectedProject = getSelectedProject()
    if (!selectedProject) {
      console.log('Cannot add all schemas - no project selected')
      return
    }

    // Determine which schemas to use - from AI generation or from project
    const isSchemaFolderSelected = selectedItem?.type === 'folder' && selectedItem?.path?.length === 3 && selectedItem?.path[2] === 'schema'
    let schemasToSave: Schema[] = []
    
    if (isSchemaFolderSelected) {
      // Use schemas from the selected project
      schemasToSave = selectedProject.schemas || []
    } else if (schemaObject && Array.isArray(schemaObject)) {
      // Use schemas from AI generation
      schemasToSave = schemaObject as Schema[]
    }

    if (schemasToSave.length === 0 || !onSchemaSave) {
      console.log('Cannot add all schemas - no schemas available or missing onSchemaSave callback')
      return
    }

    // PHASE 1: Create app first (if it doesn't exist)
    console.log(`🏗️ Phase 1: Creating app "${selectedProject.name}" if it doesn't exist...`)
    const appCreated = await createApp(selectedProject.name, dbType)
    if (!appCreated) {
      console.log('❌ Failed to create app, aborting schema creation')
      return
    }

    // PHASE 2: Sort schemas by dependencies and send them
    console.log(`📋 Phase 2: Sending schemas to ${dbType} in dependency order...`)
    
    // Sort schemas: those without EMBED and REF_PICK_LIST fields first, then those with them last
    const schemasWithoutEmbedOrRef = schemasToSave.filter((schema: Schema) => {
      return !Object.values(schema.fields).some((field: any) => 
        field.fieldType === 'EMBED' || field.fieldType === 'REF_PICK_LIST'
      )
    })
    
    const schemasWithEmbedOrRef = schemasToSave.filter((schema: Schema) => {
      return Object.values(schema.fields).some((field: any) => 
        field.fieldType === 'EMBED' || field.fieldType === 'REF_PICK_LIST'
      )
    })

    const sortedSchemas = [...schemasWithoutEmbedOrRef, ...schemasWithEmbedOrRef]
    
    console.log(`Adding all schemas to ${dbType} in dependency order:`, sortedSchemas)
    
    // Save each schema individually with the correct database type
    for (const schema of sortedSchemas) {
      await onSchemaSave(selectedProject.name, schema, dbType)
    }
  }

  // Helper function to create app
  const createApp = async (projectName: string, dbType: 'mongodb' | 'postgresql'): Promise<boolean> => {
    const appPayload = {
      appsId: projectName,
      appsName: `${projectName} Manager`,
      description: `A no-code database app for managing ${projectName.toLowerCase()} data.`
    }
    
    // Use different endpoints for MongoDB vs PostgreSQL
    const endpoint = dbType === 'mongodb' 
      ? 'http://localhost:4441/no-code-db-api/apps'
      : 'http://localhost:4441/no-code-db-api/relational/apps'
    
    console.log(`🔄 Creating ${dbType} app with payload:`, appPayload)
    console.log(`📡 Endpoint: ${endpoint}`)
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appPayload)
      })
      
      if (!response.ok) {
        // Check if app already exists (409 conflict is expected)
        if (response.status === 409) {
          console.log(`✅ ${dbType} app already exists, proceeding with schemas`)
          return true
        }
        throw new Error(`Failed to create ${dbType} app: ${response.statusText}`)
      }
      
      console.log(`✅ ${dbType} app created successfully`)
      return true
    } catch (error: unknown) {
      console.error(`❌ Error creating ${dbType} app:`, error)
      return false
    }
  }

  const handleExplainSchema = async () => {
    const selectedSchema = getSelectedSchema()
    const isSchemaFolderSelected = selectedItem?.type === 'folder' && selectedItem?.path?.length === 3 && selectedItem?.path[2] === 'schema'
    
    if (!selectedSchema || isSchemaFolderSelected) {
      // Get schemas to explain - from AI generation or project schemas
      let schemasToExplain
      if (isSchemaFolderSelected) {
        const selectedProject = getSelectedProject()
        schemasToExplain = selectedProject?.schemas || []
      } else {
        schemasToExplain = schemaObject
      }
      
      if (!schemasToExplain || (Array.isArray(schemasToExplain) && schemasToExplain.length === 0)) return
      
      setCurrentSchema(schemasToExplain)
      setIsExplaining(true)
      try {
        const explanation = await getLlamaExplanation(schemasToExplain, "Explain this database structure")
        setExplanation(explanation)
        setShowExplanation(true)
      } catch (error) {
        console.error('Error getting explanation:', error)
        setExplanation('Sorry, there was an error generating the explanation.')
        setShowExplanation(true)
      } finally {
        setIsExplaining(false)
      }
    } else {
      setCurrentSchema(selectedSchema)
      setIsExplaining(true)
      try {
        const explanation = await getLlamaExplanation(selectedSchema, "Explain this database schema")
        setExplanation(explanation)
        setShowExplanation(true)
      } catch (error) {
        console.error('Error getting explanation:', error)
        setExplanation('Sorry, there was an error generating the explanation.')
        setShowExplanation(true)
      } finally {
        setIsExplaining(false)
      }
    }
  }

  const handleFollowUpQuestion = async () => {
    if (!followUpQuestion.trim() || !currentSchema) return
    
    setIsFollowingUp(true)
    try {
      const followUpExplanation = await getLlamaExplanation(currentSchema, followUpQuestion)
      setExplanation(prev => `${prev}\n\n--- Follow-up Question: ${followUpQuestion} ---\n\n${followUpExplanation}`)
      setFollowUpQuestion('')
    } catch (error) {
      console.error('Error getting follow-up explanation:', error)
      setExplanation(prev => `${prev}\n\n--- Follow-up Question: ${followUpQuestion} ---\n\nSorry, there was an error generating the follow-up explanation.`)
    } finally {
      setIsFollowingUp(false)
    }
  }

  const handleSaveToDatabase = (schema: Schema, dbType: 'mongodb' | 'postgresql') => {
    const selectedProject = getSelectedProject()
    if (!selectedProject || !onSchemaSave) {
      console.log('Cannot save to database - missing project or onSchemaSave callback')
      return
    }

    console.log(`Saving schema ${schema.formId} to ${dbType}:`, schema)
    onSchemaSave(selectedProject.name, schema, dbType)
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
      console.log('DEBUG: Looking for project:', projectName, 'schema:', schemaId)
      console.log('DEBUG: Available projects:', projects.map(p => ({ name: p.name, schemaCount: p.schemas?.length })))
      const project = projects.find(p => p.name === projectName)
      console.log('DEBUG: Found project:', project)
      
      if (project && project.schemas) {
        console.log('DEBUG: Project schemas:', project.schemas.map((s: Schema) => s.formId))
        const schema = project.schemas.find((s: Schema) => s.formId === schemaId)
        console.log('DEBUG: Found schema:', schema)
        return schema
      }
    }
    
    return null
  }

  const renderSchemaDetails = () => {
    const selectedSchema = getSelectedSchema()
    console.log('DatabaseOverviewTab: selectedSchema result:', selectedSchema)
    const hasSchemaArray = schemaObject && Array.isArray(schemaObject) && schemaObject.length > 0
    const isSchemaFolderSelected = selectedItem?.type === 'folder' && selectedItem?.path?.length === 3 && selectedItem?.path[2] === 'schema'
    
    // Get schemas from the selected project when schema folder is clicked
    const getProjectSchemas = () => {
      if (isSchemaFolderSelected && selectedItem?.path?.[1]) {
        const projectName = selectedItem.path[1]
        const project = projects.find(p => p.name === projectName)
        return project?.schemas || []
      }
      return []
    }
    
    const projectSchemas = getProjectSchemas()
    const availableSchemas = hasSchemaArray ? schemaObject : projectSchemas
    const schemaCount = hasSchemaArray ? schemaObject.length : projectSchemas.length
    
    if (!selectedSchema || isSchemaFolderSelected) {
      return (
        <div className="space-y-6">
          {(hasSchemaArray || (isSchemaFolderSelected && projectSchemas.length > 0)) && (
            <div className="flex justify-center space-x-4">
              <Button
                onClick={async (e) => {
                  e.preventDefault()
                  await handleAddAllSchemas('mongodb')
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                <Database className="h-4 w-4 mr-2" />
                Add All Schemas to MongoDB ({schemaCount})
              </Button>
              <Button
                onClick={async (e) => {
                  e.preventDefault()
                  await handleAddAllSchemas('postgresql')
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                <Database className="h-4 w-4 mr-2" />
                Add All Schemas to PostgreSQL ({schemaCount})
              </Button>
              <Button
                onClick={handleExplainSchema}
                disabled={isExplaining}
                className="bg-purple-600 hover:bg-purple-700 text-white"
                size="lg"
              >
                {isExplaining ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <BookOpen className="h-4 w-4 mr-2" />
                )}
                {isExplaining ? 'Explaining...' : 'Explain Schemas'}
              </Button>
            </div>
          )}
          
          {showExplanation && explanation && (
            <Card className="bg-zinc-800 border-zinc-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-zinc-100 flex items-center">
                    <BookOpen className="h-5 w-5 mr-2" />
                    Schema Explanation
                  </CardTitle>
                  <Button
                    onClick={() => setShowExplanation(false)}
                    variant="ghost"
                    size="sm"
                    className="text-zinc-400 hover:text-zinc-200"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription className="text-zinc-400">
                  Business-friendly explanation of your database structure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-zinc-200 whitespace-pre-wrap leading-relaxed mb-4">
                  {explanation}
                </div>
                
                <Separator className="my-4 bg-zinc-700" />
                
                <div className="space-y-3">
                  <Label className="text-zinc-300 text-sm font-medium">Ask a follow-up question:</Label>
                  <div className="flex space-x-2">
                    <Input
                      value={followUpQuestion}
                      onChange={(e) => setFollowUpQuestion(e.target.value)}
                      placeholder="e.g., How would this work for a small business?"
                      className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-200"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !isFollowingUp) {
                          handleFollowUpQuestion()
                        }
                      }}
                    />
                    <Button
                      onClick={handleFollowUpQuestion}
                      disabled={isFollowingUp || !followUpQuestion.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isFollowingUp ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Ask'
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="flex items-center justify-center h-64 text-zinc-500">
            <div className="text-center">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a schema to view details</p>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {hasSchemaArray && (
          <div className="flex justify-center">
            <Button
              onClick={() => handleAddAllSchemas('mongodb')}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              <Database className="h-4 w-4 mr-2" />
              Add All Schemas ({schemaObject.length})
            </Button>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-zinc-100">{selectedSchema.formId}</h3>
            {selectedSchema.description && (
              <p className="text-zinc-400 mt-1">{selectedSchema.description}</p>
            )}
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={handleExplainSchema}
              disabled={isExplaining}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isExplaining ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <BookOpen className="h-4 w-4 mr-2" />
              )}
              {isExplaining ? 'Explaining...' : 'Explain'}
            </Button>
            <Button
              onClick={handleCreateForm}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Form (MongoDB)
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

        <div className="flex items-center space-x-4 p-4 bg-zinc-900 rounded-lg">
          <Label className="text-zinc-300 font-medium">Save Schema:</Label>
          <Button
            onClick={() => handleSaveToDatabase(selectedSchema, 'mongodb')}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Database className="h-4 w-4 mr-2" />
            Save to MongoDB
          </Button>
          <Button
            onClick={() => handleSaveToDatabase(selectedSchema, 'postgresql')}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Database className="h-4 w-4 mr-2" />
            Save to PostgreSQL
          </Button>
        </div>

        {showExplanation && explanation && (
          <Card className="bg-zinc-800 border-zinc-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-zinc-100 flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Schema Explanation
                </CardTitle>
                <Button
                  onClick={() => setShowExplanation(false)}
                  variant="ghost"
                  size="sm"
                  className="text-zinc-400 hover:text-zinc-200"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription className="text-zinc-400">
                Business-friendly explanation of this schema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-zinc-200 whitespace-pre-wrap leading-relaxed mb-4">
                {explanation}
              </div>
              
              <Separator className="my-4 bg-zinc-700" />
              
              <div className="space-y-3">
                <Label className="text-zinc-300 text-sm font-medium">Ask a follow-up question:</Label>
                <div className="flex space-x-2">
                  <Input
                    value={followUpQuestion}
                    onChange={(e) => setFollowUpQuestion(e.target.value)}
                    placeholder="e.g., How would this work for a small business?"
                    className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-200"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !isFollowingUp) {
                        handleFollowUpQuestion()
                      }
                    }}
                  />
                  <Button
                    onClick={handleFollowUpQuestion}
                    disabled={isFollowingUp || !followUpQuestion.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isFollowingUp ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Ask'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
