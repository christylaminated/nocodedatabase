"use client"

import { useState, useEffect } from "react"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import FolderExplorer from "./FolderExplorer"
import BeginnerTab from "./BeginnerTab"
import AiPromptTab from "./AiPromptTab"
import CsvImportTab from "./CsvImportTab"
import DatabaseManagementTab from "./DatabaseManagementTab"
import DatabaseOverviewTab from "./DatabaseOverviewTab"
import QueryingTab from "./QueryingTab"
import FormDataView from "./FormDataView"
import FormRecordView from "./FormRecordView"
import SimpleFormCreator from "../SimpleFormCreator"
import TabBar from "./TabBar"
import TabPanel from "./TabPanel"

type TabKey = "beginner" | "prompt" | "management" | "overview" | "csv-import" | "querying"

interface Schema {
  appsId?: string
  formId: string
  description?: string
  fields: Record<string, any>
}

interface FormRecord {
  id: string
  name: string
  schemaName: string
  data?: any
}

interface Project {
  name: string
  schemas: Schema[]
  forms: FormRecord[]
}

export default function Workspace() {
  const [active, setActive] = useState<TabKey>("beginner")
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedItem, setSelectedItem] = useState<{ type: 'project' | 'schema' | 'form' | 'folder', path: string[] } | null>(null)
  const [prompt, setPrompt] = useState("")
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoadingDatabases, setIsLoadingDatabases] = useState(false)
  const [formCreationSchema, setFormCreationSchema] = useState<Schema | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [selectedFormRecord, setSelectedFormRecord] = useState<FormRecord | null>(null)
  const [unsavedSchemas, setUnsavedSchemas] = useState<string[]>([])

  // Debug logging for state changes
  useEffect(() => {
    console.log('formCreationSchema changed:', formCreationSchema)
  }, [formCreationSchema])

  useEffect(() => {
    console.log('active tab changed:', active)
  }, [active])

  const getSelectedProject = () => {
    if (!selectedItem) return null
    return projects.find(p => p.name === selectedItem.path[1])
  }


  const handleSchemaDelete = (projectName: string, schemaId: string) => {
    setProjects(prevProjects => 
      prevProjects.map(project => 
        project.name === projectName 
          ? { ...project, schemas: project.schemas.filter(schema => schema.formId !== schemaId) }
          : project
      )
    )
    setSelectedItem(null) // Clear selection after deletion
    setMessage(`Schema "${schemaId}" deleted successfully`)
    setMessageType("success")
  }

  // Handle form creation from schema
  const handleFormCreateFromSchema = (schema: any) => {
    setFormCreationSchema(schema)
    setFormData({}) // Reset form data
  }

  // Initialize with example project only if no saved state
  useEffect(() => {
    const savedState = localStorage.getItem("workspace-state")
    if (!savedState) {
      const exampleProject: Project = {
        name: "exampleProject",
        schemas: [{
          formId: "testSchema",
          fields: {
            name: { fieldType: "TEXT", isRequired: true },
            email: { fieldType: "TEXT", isRequired: true }
          }
        }],
        forms: []
      }
      setProjects([exampleProject])
    }
  }, [])

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem("workspace-state")
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        if (parsed.projects && parsed.projects.length > 0) {
          setProjects(parsed.projects)
        }
        setPrompt(parsed.prompt || "")
        setSelectedItem(parsed.selectedItem || null)
      } catch (e) {
        console.error("Failed to parse saved state:", e)
      }
    }
  }, [])

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const stateToSave = {
      projects,
      prompt,
      selectedItem
    }
    localStorage.setItem("workspace-state", JSON.stringify(stateToSave))
  }, [projects, prompt, selectedItem])
  
  // Function to clear localStorage and reset state
  const handleResetWorkspace = () => {
    localStorage.removeItem("workspace-state")
    setProjects([])
    setPrompt("")
    setSelectedItem(null)
    setMessage("Workspace reset successfully!")
    setMessageType("success")
  }

  // Debug active tab
  useEffect(() => {
    console.log('Active tab changed to:', active)
  }, [active])

  const handleSchemaUpdate = (updatedSchema: any) => {
    // Update the selected schema in the current project
    if (selectedItem && selectedItem.type === 'schema') {
      const projectIndex = projects.findIndex(p => p.name === selectedItem.path[1])
      if (projectIndex !== -1) {
        const schemaIndex = projects[projectIndex].schemas.findIndex(s => s.formId === selectedItem.path[3])
        if (schemaIndex !== -1) {
          const newProjects = [...projects]
          newProjects[projectIndex].schemas[schemaIndex] = updatedSchema
          setProjects(newProjects)
        }
      }
    }
    setMessage("Schema updated successfully!")
    setMessageType("success")
  }

  // Sort schemas by dependencies - schemas with EMBED fields that reference other schemas come after their dependencies
  const sortSchemasByDependencies = (schemas: Schema[]) => {
    const schemaMap = new Map(schemas.map(s => [s.formId, s]))
    const visited = new Set<string>()
    const visiting = new Set<string>()
    const sorted: Schema[] = []

    const visit = (schemaId: string) => {
      if (visited.has(schemaId)) return
      if (visiting.has(schemaId)) {
        // Circular dependency - just add it anyway
        return
      }

      visiting.add(schemaId)
      const schema = schemaMap.get(schemaId)
      
      if (schema) {
        // Find EMBED dependencies
        const dependencies = findEmbedDependencies(schema)
        
        // Visit dependencies first
        for (const dep of dependencies) {
          if (schemaMap.has(dep)) {
            visit(dep)
          }
        }
        
        visited.add(schemaId)
        visiting.delete(schemaId)
        sorted.push(schema)
      }
    }

    // Visit all schemas
    for (const schema of schemas) {
      visit(schema.formId)
    }

    return sorted
  }

  // Remove EMBED fields from schema fields
  const removeEmbedFields = (fields: Record<string, any>): Record<string, any> => {
    const baseFields: Record<string, any> = {}
    for (const [key, field] of Object.entries(fields)) {
      if (field && typeof field === 'object' && field.fieldType !== 'EMBED') {
        baseFields[key] = field
      }
    }
    return baseFields
  }

  // Get only EMBED fields from schema fields
  const getEmbedFields = (fields: Record<string, any>): Record<string, any> => {
    const embedFields: Record<string, any> = {}
    for (const [key, field] of Object.entries(fields)) {
      if (field && typeof field === 'object' && field.fieldType === 'EMBED') {
        embedFields[key] = field
      }
    }
    return embedFields
  }

  // Find schemas that this schema depends on via EMBED and REF_PICK_LIST fields
  const findEmbedDependencies = (schema: Schema): string[] => {
    const dependencies: string[] = []
    
    const checkFields = (fields: Record<string, any>) => {
      for (const field of Object.values(fields)) {
        if (field && typeof field === 'object') {
          // Check for direct REF_PICK_LIST dependencies
          if (field.fieldType === 'REF_PICK_LIST' && field.refPickListId) {
            const refFormId = field.refPickListId.split('.')[0]
            if (refFormId && !dependencies.includes(refFormId)) {
              dependencies.push(refFormId)
            }
          }
          // Check for EMBED fields and their nested dependencies
          else if (field.fieldType === 'EMBED' && field.embeddedFormSchema) {
            const embedFields = field.embeddedFormSchema.fields || {}
            for (const embedField of Object.values(embedFields)) {
              if (embedField && typeof embedField === 'object' && 
                  'fieldType' in embedField && embedField.fieldType === 'REF_PICK_LIST' && 
                  'refPickListId' in embedField && embedField.refPickListId) {
                const refFormId = (embedField.refPickListId as string).split('.')[0]
                if (refFormId && !dependencies.includes(refFormId)) {
                  dependencies.push(refFormId)
                }
              }
            }
          }
        }
      }
    }
    
    checkFields(schema.fields)
    return dependencies
  }

  const handleCreateApp = async (appsId: string, appsName: string, description: string) => {
    const appPayload = {
      appsId: appsId,
      appsName: appsName,
      description: description
    }
    
    console.log('🏗️ App Creation - Sending this JSON body to API (POST /no-code-db-api/apps):')
    console.log(JSON.stringify(appPayload, null, 2))
    
    try {
      const response = await fetch('http://localhost:4441/no-code-db-api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appPayload)
      })
      
      if (!response.ok) {
        // Check if app already exists (409 conflict is expected)
        if (response.status === 409) {
          console.log('✅ App already exists, proceeding with schemas')
          return true
        }
        throw new Error(`Failed to create app: ${response.statusText}`)
      }
      
      console.log('✅ App created successfully')
      return true
    } catch (error: unknown) {
      console.error('Error creating app:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create app'
      setMessage(`Error creating app: ${errorMessage}`)
      setMessageType('error')
      return false
    }
  }

  const handleSchemaGenerated = async (schemas: any[], appsId: string, formEntries?: string[] | FormRecord[]) => {
    console.log('Generated schemas:', schemas)
    console.log('Apps ID:', appsId)
    
    // Just add schemas to state without creating app - app creation happens only when user saves
    // Track new schemas as unsaved with project context
    const newSchemaIds = schemas.map(s => `${appsId}:${s.formId}`)
    setUnsavedSchemas(prev => [...new Set([...prev, ...newSchemaIds])])
    
    // Create or update project
    const projectName = appsId
    setProjects(prevProjects => {
      const existingProjectIndex = prevProjects.findIndex(p => p.name === projectName)
      
      if (existingProjectIndex >= 0) {
        // Update existing project
        const updatedProjects = [...prevProjects]
        const existingForms = updatedProjects[existingProjectIndex].forms
        const newForms = Array.isArray(formEntries) && formEntries.length > 0 && typeof formEntries[0] === 'object' 
          ? formEntries as FormRecord[]
          : []
        
        updatedProjects[existingProjectIndex] = {
          ...updatedProjects[existingProjectIndex],
          schemas: [...updatedProjects[existingProjectIndex].schemas, ...schemas],
          forms: [...existingForms, ...newForms]
        }
        return updatedProjects
      } else {
        // Create new project
        const newForms = Array.isArray(formEntries) && formEntries.length > 0 && typeof formEntries[0] === 'object' 
          ? formEntries as FormRecord[]
          : []
          
        const newProject: Project = {
          name: projectName,
          schemas: schemas,
          forms: newForms
        }
        return [...prevProjects, newProject]
      }
    })
    
    const formMessage = formEntries ? ` and ${formEntries.length} form entries` : ''
    setMessage(`Generated ${schemas.length} schema(s)${formMessage} successfully!`)
    setMessageType("success")
  }

  // Handle bulk saving all schemas in a project
  const handleBulkSchemaSave = async (projectName: string) => {
    const project = projects.find(p => p.name === projectName)
    if (!project || !project.schemas.length) return

    setMessage('Creating app and saving all schemas...')
    setMessageType('info')

    try {
      // Step 1: Create app first (only if it doesn't exist)
      const appCreated = await handleCreateApp(
        projectName,
        `${projectName} Manager`,
        `A no-code database app for managing ${projectName.toLowerCase()} data.`
      )
      
      if (!appCreated) {
        return // Stop if app creation failed
      }

      // Step 2: Create schemas in dependency order (schemas with EMBED fields last)
      console.log('🔄 Creating schemas in dependency order...')
      const sortedSchemas = sortSchemasByDependencies(project.schemas)
      
      for (const schema of sortedSchemas) {
        const payload = {
          appsId: projectName,
          formId: schema.formId,
          description: `Schema for ${schema.formId}`,
          fields: schema.fields
        }
        
        console.log(`🔄 Creating schema: ${schema.formId}`)
        console.log(JSON.stringify(payload, null, 2))
        
        const response = await fetch('http://localhost:4441/no-code-db-api/form/schema', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        
        if (!response.ok) {
          throw new Error(`Failed to create schema ${schema.formId}: ${response.statusText}`)
        }
      }
      
      setMessage(`Successfully saved all ${project.schemas.length} schemas for "${projectName}"!`)
      setMessageType('success')
      setUnsavedSchemas(prev => prev.filter(id => !project.schemas.some(s => `${projectName}:${s.formId}` === id)))
      
    } catch (error: unknown) {
      console.error('Error saving schemas:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to save schemas'
      setMessage(`Error: ${errorMessage}`)
      setMessageType('error')
    }
  }

  // Handle saving individual schema to MongoDB

  const handleSchemaSave = async (projectName: string, schema: Schema, dbType: 'mongodb' | 'postgresql' = 'mongodb') => {
    const endpoint = dbType === 'mongodb' 
      ? 'http://localhost:4441/no-code-db-api/form/schema'
      : 'http://localhost:4441/no-code-db-api/relational/form/schema'
    
    console.log(`💾 Individual Save - Sending this JSON body to API (POST ${endpoint}):`)
    console.log(JSON.stringify(schema, null, 2))
    setMessage(`Saving schema to ${dbType === 'mongodb' ? 'MongoDB' : 'PostgreSQL'}...`)
    setMessageType('info')
    
    try {
      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      // Format schema with required appsId field
      const payload = {
        appsId: schema.appsId || 'DefaultApp',
        formId: schema.formId,
        description: schema.description || `Schema for ${schema.formId}`,
        fields: schema.fields
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      }).catch(err => {
        if (err.name === 'AbortError') {
          throw new Error('Request timed out. Is the MongoDB API server running?');
        }
        throw err;
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error details available');
        console.error(`Error saving schema (${response.status}): ${errorText}`);
        throw new Error(`Failed to save schema: ${response.status} ${response.statusText}`);
      }
      
      // Form creation is only for CSV imports, not regular schema saves
      
      setMessage(`Schema "${schema.formId}" saved successfully to ${dbType === 'mongodb' ? 'MongoDB' : 'PostgreSQL'}!`)
      setMessageType('success')
      
    } catch (error: unknown) {
      console.error('Error saving schema to MongoDB:', error)
      let errorMessage = 'Failed to save schema to MongoDB'
      
      if (error instanceof Error) {
        errorMessage = error.message
        
        // Provide more specific error messages based on error type
        if (error.message.includes('Failed to fetch') || error.message.includes('timed out')) {
          errorMessage = "Could not connect to the MongoDB API server. Please ensure it's running at http://localhost:4441"
        }
      }
      
      setMessage(`Error: ${errorMessage}`)
      setMessageType('error')
    }
  };

  // Handle form data submission
  const handleFormSubmit = async (formData: Record<string, any>, schema: Schema) => {
    setMessage('Saving form data...')
    setMessageType('info')
    
    try {
      // Find the project to get the appsId
      const selectedProject = getSelectedProject()
      if (!selectedProject) {
        throw new Error('No project selected')
      }
      
      // Use the exact field names from the schema definition
      const mappedFields: Record<string, any> = {}
      
      // Map form data using schema field names directly
      Object.keys(schema.fields).forEach((schemaFieldName) => {
        if (formData[schemaFieldName] !== undefined) {
          mappedFields[schemaFieldName] = formData[schemaFieldName]
        }
      })
      
      const formPayload = {
        appsId: selectedProject.name, // Use project name as appsId
        formId: schema.formId,
        fields: mappedFields
      }
      
      console.log('📝 Form Data Save - Sending this JSON body to API (POST /no-code-db-api/form/data):')
      console.log(JSON.stringify(formPayload, null, 2))
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch('http://localhost:4441/no-code-db-api/form/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formPayload),
        signal: controller.signal
      }).catch(err => {
        if (err.name === 'AbortError') {
          throw new Error('Request timed out. Is the MongoDB API server running?');
        }
        throw err;
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error details available');
        console.error(`Error saving form data (${response.status}): ${errorText}`);
        throw new Error(`Failed to save form data: ${response.status} ${response.statusText}`);
      }
      
      // Add the new form record to the project's forms array
      const newFormRecord: FormRecord = {
        id: `form_${Date.now()}`, // Generate unique ID
        name: `${schema.formId} Record ${Date.now()}`,
        schemaName: schema.formId,
        data: mappedFields
      }
      
      setProjects(prevProjects => {
        return prevProjects.map(project => {
          if (project.name === selectedProject.name) {
            return {
              ...project,
              forms: [...project.forms, newFormRecord]
            }
          }
          return project
        })
      })
      
      setMessage(`Form data saved successfully for "${schema.formId}"!`)
      setMessageType('success')
      setFormCreationSchema(null) // Close form
      setFormData({}) // Reset form data
      
    } catch (error: unknown) {
      console.error('Error saving form data:', error)
      let errorMessage = 'Failed to save form data'
      
      if (error instanceof Error) {
        errorMessage = error.message
        
        if (error.message.includes('Failed to fetch') || error.message.includes('timed out')) {
          errorMessage = "Could not connect to the MongoDB API server. Please ensure it's running at http://localhost:4441"
        }
      }
      
      setMessage(`Error: ${errorMessage}`)
      setMessageType('error')
    }
  }

  const handleLoadAllDatabases = async () => {
    console.log('Loading all databases...')
    setIsLoadingDatabases(true)
    
    // Just show current projects in memory - no API calls or localStorage
    setMessage("Showing current projects")
    setMessageType("success")
    setIsLoadingDatabases(false)
  }

  const handleItemSelect = (item: any) => {
    console.log('Workspace: handleItemSelect called with:', item)
    setSelectedItem({
      type: item.type,
      path: item.path
    })
    console.log('Workspace: selectedItem set to:', { type: item.type, path: item.path })
    
    // Automatically switch to overview tab when a schema or form is selected
    if (item.type === 'schema' || item.type === 'form') {
      console.log('Workspace: Switching to overview tab')
      setActive('overview')
    }
  }

  const handleProjectCreate = (name: string) => {
    const newProject: Project = {
      name: name,
      schemas: [],
      forms: []
    }
    setProjects([...projects, newProject])
  }

  const handleSchemaCreate = (projectName: string) => {
    console.log('Create schema for project:', projectName);
  };

  const handleFormCreate = (projectName: string, schemaName: string) => {
    try {
      console.log('Creating form for project:', projectName, 'schema:', schemaName);

      // Find the schema to create a form for
      const project = projects.find((p) => p.name === projectName);
      const schema = project?.schemas.find((s) => s.formId === schemaName);

      if (schema) {
        setFormCreationSchema(schema);
        setFormData({}); // Reset form data
        setActive("overview"); // Switch to overview tab to show form
        console.log('Form creation initiated for schema:', schema);
      } else {
        console.error('Schema not found:', schemaName, 'in project:', projectName);
        setMessage(`Schema "${schemaName}" not found`);
        setMessageType("error");
      }
    } catch (error) {
      console.error('Error in handleFormCreate:', error);
      setMessage('Error creating form');
      setMessageType("error");
    }
  }

  const handleItemRename = (oldPath: string[], newName: string) => {
    // This would typically open a rename dialog
    console.log('Rename item:', oldPath, 'to:', newName)
  }

  const handleItemDelete = (path: string[]) => {
    if (path.length === 1) {
      // Delete project - show confirmation dialog
      const projectName = path[0]
      const confirmed = window.confirm(`Are you sure you want to delete the entire "${projectName}" app? This will permanently remove all schemas, forms, and data associated with this app. This action cannot be undone.`)
      
      if (confirmed) {
        setProjects(projects.filter(p => p.name !== projectName))
        setMessage(`App "${projectName}" has been deleted successfully.`)
        setMessageType('success')
        
        // Clear selection if the deleted project was selected
        if (selectedItem && selectedItem.path[0] === projectName) {
          setSelectedItem(null)
        }
      }
    } else if (path.length === 3) {
      // Delete schema or form
      const projectIndex = projects.findIndex(p => p.name === path[1])
      if (projectIndex !== -1) {
        const newProjects = [...projects]
        if (path[2] === 'schema') {
          const schemaName = path[3]
          const confirmed = window.confirm(`Are you sure you want to delete the "${schemaName}" schema? This action cannot be undone.`)
          
          if (confirmed) {
            newProjects[projectIndex].schemas = newProjects[projectIndex].schemas.filter(s => s.formId !== schemaName)
            setMessage(`Schema "${schemaName}" has been deleted successfully.`)
            setMessageType('success')
          } else {
            return
          }
        } else if (path[2] === 'form') {
          const formName = path[3]
          const confirmed = window.confirm(`Are you sure you want to delete the "${formName}" form? This action cannot be undone.`)
          
          if (confirmed) {
            newProjects[projectIndex].forms = newProjects[projectIndex].forms.filter(f => f.id !== formName)
            setMessage(`Form "${formName}" has been deleted successfully.`)
            setMessageType('success')
          } else {
            return
          }
        }
        setProjects(newProjects)
      }
    }
  }

  // Extract project name from prompt
  const extractProjectName = (prompt: string): string => {
    // Simple extraction - could be improved with AI
    const words = prompt.toLowerCase().split(' ')
    const keyWords = ['student', 'customer', 'employee', 'product', 'order', 'inventory', 'event', 'booking']
    for (const word of words) {
      if (keyWords.includes(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1) + 'Management'
      }
    }
    return `Project_${Date.now()}`
  }


  // Get the currently selected schema data for display
  const getSelectedSchemaData = () => {
    if (!selectedItem || selectedItem.type !== 'schema') return null
    
    const projectName = selectedItem.path[1]
    const schemaName = selectedItem.path[3]
    
    const project = projects.find(p => p.name === projectName)
    if (!project) return null
    
    const schema = project.schemas.find(s => s.formId === schemaName)
    return schema || null
  }

  const getFormRecordsForSchema = (projectName: string, schemaName: string) => {
    const project = projects.find(p => p.name === projectName)
    if (!project) return []
    
    return project.forms.filter(form => form.schemaName === schemaName)
  }

  const getSchemaForRecord = (schemaName: string, projectName: string) => {
    const project = projects.find(p => p.name === projectName)
    if (!project) return null
    
    return project.schemas.find(s => s.formId === schemaName) || null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 font-sans">
      {/* Header */}
      <header className="relative bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
        <div className="relative max-w-7xl mx-auto px-8 py-8 flex justify-between items-center">
          <h1 className="text-3xl font-extralight mb-2 tracking-tight leading-tight">
            Workspace
            <span className="block font-light text-blue-200">NoCode Database Management</span>
          </h1>
          <button 
            onClick={handleResetWorkspace}
            className="px-4 py-2 bg-red-600 rounded-lg text-white hover:bg-red-700 transition-colors text-sm"
          >
            Reset Workspace
          </button>
        </div>
      </header>

      {/* Message Display */}
      {message && (
        <div className="max-w-7xl mx-auto px-8 pt-4">
          <div
            className={`mb-4 p-3 rounded-xl border font-medium shadow-lg backdrop-blur-sm ${
              messageType === "success"
                ? "bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-800 border-emerald-200"
                : "bg-gradient-to-r from-red-50 to-rose-50 text-red-800 border-red-200"
            }`}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`w-2 h-2 rounded-full ${messageType === "success" ? "bg-emerald-500" : "bg-red-500"}`}
              ></div>
              <span className="text-sm">{message}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace */}
      <div className="max-w-7xl mx-auto px-8 py-4">
        <div className="h-[calc(100vh-200px)] min-h-[600px] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
          <ResizablePanelGroup direction="horizontal">
            {/* Left Folder Explorer */}
            <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
              <FolderExplorer
                projects={projects}
                selectedItem={selectedItem}
                onItemSelect={handleItemSelect}
                onProjectCreate={handleProjectCreate}
                onSchemaCreate={handleSchemaCreate}
                onFormCreate={handleFormCreate}
                onItemRename={handleItemRename}
                onItemDelete={handleItemDelete}
                onSchemaSave={(schema: Schema) => handleSchemaSave(selectedItem?.path[1] || '', schema)}
              />
            </ResizablePanel>

            {/* Resizable Handle */}
            <ResizableHandle />

            {/* Right Tabs */}
            <ResizablePanel defaultSize={75}>
              <section className="h-full bg-zinc-950 flex flex-col">
                <TabBar active={active} onChange={setActive} />
                <div className="flex-1 overflow-auto p-4 relative">
                  <div className={`absolute inset-0 ${active === "beginner" ? "block" : "hidden"}`}>
                    <BeginnerTab 
                      onPromptSelect={setPrompt}
                      onSwitchToPromptTab={() => setActive("prompt")}
                    />
                  </div>
                  <div className={`absolute inset-0 ${active === "prompt" ? "block" : "hidden"}`}>
                    <AiPromptTab 
                      prompt={prompt}
                      onPromptChange={setPrompt}
                      onSchemaGenerated={handleSchemaGenerated}
                      isGenerating={isGenerating}
                      setIsGenerating={setIsGenerating}
                      setMessage={setMessage}
                      setMessageType={setMessageType}
                    />
                  </div>
                  <div className={`absolute inset-0 ${active === "management" ? "block" : "hidden"}`}>
                    <DatabaseManagementTab 
                      onLoadDatabases={handleLoadAllDatabases}
                      isLoading={isLoadingDatabases}
                      projects={projects}
                    />
                  </div>
                  <div className={`absolute inset-0 ${active === "csv-import" ? "block" : "hidden"}`}>
                    <CsvImportTab 
                      onSchemaGenerated={handleSchemaGenerated}
                      isGenerating={isGenerating}
                      setIsGenerating={setIsGenerating}
                      setMessage={setMessage}
                      setMessageType={setMessageType}
                    />
                  </div>
                  <div className={`absolute inset-0 ${active === "overview" ? "block" : "hidden"}`}>
                    {selectedFormRecord ? (
                      <FormRecordView 
                        record={selectedFormRecord}
                        schema={getSchemaForRecord(selectedFormRecord.schemaName, selectedFormRecord.id.split('-')[0])}
                        onBack={() => setSelectedFormRecord(null)}
                      />
                    ) : selectedItem?.type === 'schema' && formCreationSchema ? (
                      <SimpleFormCreator
                        schema={formCreationSchema}
                        formData={formData}
                        onFormDataChange={setFormData}
                        onFormSubmit={handleFormSubmit}
                        onFormCancel={() => setFormCreationSchema(null)}
                      />
                    ) : selectedItem?.type === 'form' && selectedItem.path.length === 5 && selectedItem.path[2] === 'form' ? (
                      (() => {
                        const projectName = selectedItem.path[1]
                        const schemaName = selectedItem.path[3]
                        const formId = selectedItem.path[4]
                        const project = projects.find(p => p.name === projectName)
                        const formRecord = project?.forms.find(f => f.id === formId)
                        
                        if (formRecord) {
                          return (
                            <FormRecordView
                              record={formRecord}
                              schema={getSchemaForRecord(schemaName, projectName)}
                              onBack={() => setSelectedItem({
                                type: 'folder',
                                path: ['apps', projectName, 'form', schemaName]
                              })}
                            />
                          )
                        }
                        return null
                      })()
                    ) : selectedItem?.type === 'folder' && selectedItem.path.length === 4 && selectedItem.path[2] === 'form' ? (
                      <FormDataView
                        schemaName={selectedItem.path[3]}
                        records={getFormRecordsForSchema(selectedItem.path[1], selectedItem.path[3])}
                        schema={getSchemaForRecord(selectedItem.path[3], selectedItem.path[1])}
                        onRecordSelect={setSelectedFormRecord}
                      />
                    ) : (
                      <DatabaseOverviewTab 
                        schemaObject={getSelectedSchemaData()}
                        selectedItem={selectedItem}
                        projects={projects}
                        formCreationSchema={formCreationSchema}
                        formData={formData}
                        onFormDataChange={setFormData}
                        onFormSubmit={handleFormSubmit}
                        onFormCancel={() => setFormCreationSchema(null)}
                        onSchemaDelete={handleSchemaDelete}
                        onFormCreate={handleFormCreateFromSchema}
                        onSchemaSave={handleSchemaSave}
                        onBulkSchemaSave={handleBulkSchemaSave}
                        unsavedSchemas={{}}
                      />
                    )}
                  </div>
                  <div className={`absolute inset-0 ${active === "querying" ? "block" : "hidden"}`}>
                    <QueryingTab />
                  </div>
                </div>
              </section>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </div>
  )
}
