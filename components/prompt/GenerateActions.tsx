"use client"

import { Sparkles } from "lucide-react"

type GenerateActionsProps = {
  prompt: string
  onChangePrompt?: (v: string) => void
  onGenerateSchema: () => void
  onGenerateTable?: () => void
  className?: string
  isGenerating?: boolean
}

export default function GenerateActions({
  prompt,
  onGenerateSchema,
  onGenerateTable,
  className = "",
  isGenerating = false
}: GenerateActionsProps) {
  return (
    <div className={`flex flex-col md:flex-row gap-3 ${className}`}>
      <button
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-medium text-base hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-3"
        onClick={onGenerateSchema}
        disabled={isGenerating || !prompt.trim()}
      >
        {isGenerating ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Generating Schema/Table...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            <span>Generate Schema/Table</span>
          </>
        )}
      </button>
      {onGenerateTable && (
        <button
          className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-3 rounded-xl font-medium text-base hover:from-indigo-700 hover:to-indigo-800 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-3"
          onClick={onGenerateTable}
          disabled={isGenerating || !prompt.trim()}
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Generating Table...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Generate Table</span>
            </>
          )}
        </button>
      )}
    </div>
  )
}
