"use client"

import { useState, useMemo, useEffect } from "react"
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText, Database, Plus, MoreHorizontal, Grid3X3 } from "lucide-react"
import ErrorBoundary from "../ErrorBoundary"

interface Schema {
  formId: string
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

interface FolderExplorerProps {
  projects: Project[]
  selectedItem: { type: 'project' | 'schema' | 'form' | 'folder', path: string[] } | null
  onItemSelect: (item: { type: 'project' | 'schema' | 'form' | 'folder', path: string[] }) => void
  onProjectCreate: (name: string) => void
  onSchemaCreate: (projectName: string) => void
  onFormCreate: (projectName: string, schemaName: string) => void
  onItemRename: (oldPath: string[], newName: string) => void
  onItemDelete: (path: string[]) => void
  onSchemaSave?: (schema: Schema) => void
}

export default function FolderExplorer({
  projects,
  selectedItem,
  onItemSelect,
  onProjectCreate,
  onSchemaCreate,
  onFormCreate,
  onItemRename,
  onItemDelete,
  onSchemaSave
}: FolderExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['apps']))
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, item: any } | null>(null)

  // Ensure Apps folder is always expanded
  useEffect(() => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev)
      newSet.add('apps')
      return newSet
    })
  }, [])

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenu) {
        setContextMenu(null)
      }
    }

    if (contextMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [contextMenu])

  const toggleFolder = (folderPath: string) => {
    console.log('Toggling folder:', folderPath)
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath)
    } else {
      newExpanded.add(folderPath)
    }
    setExpandedFolders(newExpanded)
    console.log('Expanded folders:', Array.from(newExpanded))
  }

  const isExpanded = (folderPath: string) => expandedFolders.has(folderPath)

  const handleContextMenu = (e: React.MouseEvent, item: any) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, item })
  }

  const closeContextMenu = () => setContextMenu(null)

  const getContextMenuItems = (item: any) => {
    if (item.type === 'apps') {
      return [
        { label: 'New Project', action: () => onProjectCreate('New Project') }
      ]
    } else if (item.type === 'project') {
      return [
        { label: 'New Schema', action: () => onSchemaCreate(item.name) },
        { label: 'Rename', action: () => onItemRename([item.name], '') },
        { label: 'Delete', action: () => onItemDelete([item.name]) }
      ]
    } else if (item.type === 'schema') {
      const menuItems = [
        { label: 'Create Form', action: () => {
          try {
            console.log('Create Form clicked, item:', item)
            console.log('onFormCreate function:', onFormCreate)
            
            if (!onFormCreate) {
              console.error('onFormCreate callback is not defined')
              return
            }
            
            if (item.projectName && item.schemaName) {
              console.log('Calling onFormCreate with:', item.projectName, item.schemaName)
              onFormCreate(item.projectName, item.schemaName)
            } else {
              console.error('Missing projectName or schemaName:', { projectName: item.projectName, schemaName: item.schemaName })
            }
          } catch (error) {
            console.error('Error in Create Form action:', error)
          }
        }},
        { label: 'Rename', action: () => onItemRename([item.projectName || '', 'schema', item.schemaName || ''], '') },
        { label: 'Delete', action: () => onItemDelete([item.projectName || '', 'schema', item.schemaName || '']) }
      ]
      
      // Add "Save to MongoDB" option if callback is provided
      if (onSchemaSave && item.data) {
        menuItems.unshift({ label: 'Save to MongoDB', action: () => onSchemaSave(item.data) })
      }
      
      return menuItems
    } else if (item.type === 'form') {
      return [
        { label: 'Rename', action: () => onItemRename([item.projectName, 'form', item.formName], '') },
        { label: 'Delete', action: () => onItemDelete([item.projectName, 'form', item.formName]) }
      ]
    }
    return []
  }

  const getIcon = (type: string, path?: string[]) => {
    switch (type) {
      case 'folder':
        // Check if this is a project folder (under Apps)
        if (path && path.length === 2 && path[0] === 'apps') {
          return <Database className="w-4 h-4 text-green-400" />
        }
        return <Folder className="w-4 h-4 text-blue-400" />
      case 'project':
        return <Database className="w-4 h-4 text-green-400" />
      case 'schema':
        return <Grid3X3 className="w-4 h-4 text-blue-400" />
      case 'form':
        return <FileText className="w-4 h-4 text-purple-400" />
      default:
        return <Folder className="w-4 h-4 text-gray-400" />
    }
  }

  const renderItem = (item: any, depth: number = 0) => {
    const isSelected = selectedItem && 
      selectedItem.type === item.type && 
      JSON.stringify(selectedItem.path) === JSON.stringify(item.path)

    const isFolder = item.type === 'folder' || item.type === 'apps'
    const hasChildren = item.children && item.children.length > 0

    return (
      <div key={item.path.join('/')} style={{ paddingLeft: `${depth * 16}px` }}>
        <div
          className={`flex items-center space-x-2 py-1 px-2 rounded cursor-pointer hover:bg-zinc-800 ${
            isSelected ? 'bg-blue-600/20 text-blue-300' : 'text-zinc-300'
          }`}
          onClick={() => {
            console.log('FolderExplorer: Clicking on item:', item)
            onItemSelect(item)
          }}
          onContextMenu={(e) => handleContextMenu(e, item)}
        >
          {isFolder && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleFolder(item.path.join('/'))
              }}
              className="w-4 h-4 flex items-center justify-center"
            >
              {isExpanded(item.path.join('/')) ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
          )}
          
          {getIcon(item.type, item.path)}
          
          <span className="text-sm truncate">{item.name}</span>
          
          {item.type !== 'apps' && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleContextMenu(e, item)
              }}
              className="ml-auto opacity-0 group-hover:opacity-100 hover:bg-zinc-700 rounded p-1"
            >
              <MoreHorizontal className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Render children if folder is expanded */}
        {isFolder && isExpanded(item.path.join('/')) && hasChildren && (
          <div>
            {item.children.map((child: any) => renderItem(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  // Build folder structure
  const buildFolderStructure = () => {
    try {
      console.log('Building folder structure with projects:', projects)
      
      if (!projects || !Array.isArray(projects)) {
        console.log('No projects or invalid projects data')
        return {
          type: 'folder',
          name: 'Apps',
          path: ['apps'],
          children: []
        }
      }

      const appsFolder = {
        type: 'folder',
        name: 'Apps',
        path: ['apps'],
        children: projects.map(project => {
          console.log('Processing project:', project)
          if (!project || !project.name) {
            console.warn('Invalid project data:', project)
            return null
          }
          
          return {
            type: 'folder',
            name: project.name,
            path: ['apps', project.name],
            children: [
              {
                type: 'folder',
                name: 'schema',
                path: ['apps', project.name, 'schema'],
                children: (project.schemas || []).map(schema => {
                  if (!schema || !schema.formId) {
                    console.warn('Invalid schema data:', schema)
                    return null
                  }
                  return {
                    type: 'schema',
                    name: schema.formId,
                    path: ['apps', project.name, 'schema', schema.formId],
                    projectName: project.name,
                    schemaName: schema.formId,
                    data: schema
                  }
                }).filter(Boolean)
              },
              {
                type: 'folder',
                name: 'form',
                path: ['apps', project.name, 'form'],
                children: (project.schemas || []).map(schema => {
                  if (!schema || !schema.formId) {
                    console.warn('Invalid schema data for form folder:', schema)
                    return null
                  }
                  
                  // Get forms for this schema
                  const schemaForms = (project.forms || []).filter(form => 
                    form && form.schemaName === schema.formId
                  )
                  
                  return {
                    type: 'folder',
                    name: schema.formId,
                    path: ['apps', project.name, 'form', schema.formId],
                    projectName: project.name,
                    schemaName: schema.formId,
                    children: schemaForms.map(form => ({
                      type: 'form',
                      name: form.name || 'Untitled Form',
                      path: ['apps', project.name, 'form', schema.formId, form.id],
                      projectName: project.name,
                      schemaName: schema.formId,
                      formName: form.name,
                      data: form
                    }))
                  }
                }).filter(Boolean)
              }
            ]
          }
        }).filter(Boolean)
      }

      console.log('Built folder structure:', appsFolder)
      return appsFolder
    } catch (error) {
      console.error('Error in buildFolderStructure:', error)
      return {
        type: 'folder',
        name: 'Apps',
        path: ['apps'],
        children: []
      }
    }
  }

  const folderStructure = useMemo(() => buildFolderStructure(), [projects])

  return (
    <ErrorBoundary>
      <div className="h-full bg-zinc-900 text-zinc-200">
        <div className="p-3 border-b border-zinc-800">
          <h3 className="text-sm font-medium text-zinc-200">Explorer</h3>
        </div>
        
        <div className="p-2">
          {renderItem(folderStructure)}
        </div>

        {/* Context Menu */}
        {contextMenu && (
          <div
            className="fixed z-50 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg py-1 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {getContextMenuItems(contextMenu.item).map((menuItem, index) => (
              <button
                key={index}
                onClick={() => {
                  menuItem.action()
                  closeContextMenu()
                }}
                className="w-full text-left px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-700"
              >
                {menuItem.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}
