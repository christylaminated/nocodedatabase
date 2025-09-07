"use client"

import { Edit3, Database, Plus, Settings } from "lucide-react"

interface DatabaseManagementTabProps {
  onLoadDatabases: () => void
  isLoading: boolean
  projects: any[]
}

export default function DatabaseManagementTab({
  onLoadDatabases,
  isLoading,
  projects
}: DatabaseManagementTabProps) {
  const totalSchemas = projects.reduce((sum, project) => sum + (project.schemas?.length || 0), 0)
  const totalForms = projects.reduce((sum, project) => sum + (project.forms?.length || 0), 0)

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="border-b border-zinc-800 pb-4">
        <h2 className="text-2xl font-extralight text-zinc-100 mb-2">Database Management</h2>
        <p className="text-zinc-400 text-sm">View, modify, and manage your existing database structures with intelligent assistance.</p>
      </div>

      {/* Database Status */}
      <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-xl p-6 border border-zinc-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-zinc-100">Database Status</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-zinc-400">{projects.length} projects</span>
            </div>
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-green-400" />
              <span className="text-sm text-zinc-400">{totalSchemas} schemas</span>
            </div>
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-purple-400" />
              <span className="text-sm text-zinc-400">{totalForms} forms</span>
            </div>
          </div>
        </div>
        
        {projects.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Database className="w-8 h-8 text-zinc-400" />
            </div>
            <p className="text-zinc-400 mb-4">No projects created yet</p>
            <p className="text-zinc-500 text-sm">Use the AI prompt tab to create your first project, or load existing databases</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project, index) => (
              <div key={index} className="bg-zinc-900 p-4 rounded-lg border border-zinc-700">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-zinc-200">{project.name}</h4>
                  <div className="flex space-x-1">
                    <button className="p-1 bg-zinc-800 rounded hover:bg-zinc-700 transition-colors">
                      <Settings className="w-3 h-3 text-zinc-400" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2 mb-3">
                  <p className="text-xs text-zinc-400">
                    {project.schemas?.length || 0} schemas
                  </p>
                  <p className="text-xs text-zinc-400">
                    {project.forms?.length || 0} forms
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button className="flex-1 bg-zinc-800 text-zinc-300 px-2 py-1 rounded text-xs hover:bg-zinc-700 transition-colors flex items-center justify-center space-x-1">
                    <Plus className="w-3 h-3" />
                    <span>Schema</span>
                  </button>
                  <button className="flex-1 bg-zinc-800 text-zinc-300 px-2 py-1 rounded text-xs hover:bg-zinc-700 transition-colors flex items-center justify-center space-x-1">
                    <Edit3 className="w-3 h-3" />
                    <span>Form</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Load Databases Section */}
      <div className="border-t border-zinc-800 pt-6">
        <div className="flex items-center space-x-3 mb-4">
          <Database className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-extralight text-zinc-100 tracking-tight">Load Existing Databases</h3>
        </div>
        
        <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-xl p-6 border border-zinc-700">
          <p className="text-zinc-300 mb-4">Load existing database schemas from your system</p>
          <button
            onClick={onLoadDatabases}
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium text-base hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center space-x-3"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Loading...</span>
              </>
            ) : (
              <>
                <Database className="w-5 h-5" />
                <span>Load All Databases</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
