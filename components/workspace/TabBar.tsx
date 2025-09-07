"use client"

import { useEffect, useRef } from "react"
import { Database, FileText, Sparkles, Upload, BookOpen, Search } from "lucide-react"

type TabKey = "beginner" | "prompt" | "management" | "overview" | "csv-import" | "querying"

interface TabBarProps {
  active: TabKey
  onChange: (tab: TabKey) => void
}

const tabs = [
  { key: "beginner" as TabKey, label: "Beginner Guide", icon: BookOpen },
  { key: "prompt" as TabKey, label: "AI Prompt", icon: Sparkles },
  { key: "csv-import" as TabKey, label: "CSV Import", icon: Upload },
  { key: "management" as TabKey, label: "Database Management", icon: Database },
  { key: "overview" as TabKey, label: "Database Overview", icon: FileText },
  { key: "querying" as TabKey, label: "Database Querying", icon: Search },
]

export default function TabBar({ active, onChange }: TabBarProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const handleKeyDown = (e: React.KeyboardEvent, tabKey: TabKey) => {
    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault()
        const currentIndex = tabs.findIndex(tab => tab.key === tabKey)
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1
        onChange(tabs[prevIndex].key)
        tabRefs.current[prevIndex]?.focus()
        break
      case "ArrowRight":
        e.preventDefault()
        const nextCurrentIndex = tabs.findIndex(tab => tab.key === tabKey)
        const nextIndex = nextCurrentIndex < tabs.length - 1 ? nextCurrentIndex + 1 : 0
        onChange(tabs[nextIndex].key)
        tabRefs.current[nextIndex]?.focus()
        break
      case "Home":
        e.preventDefault()
        onChange(tabs[0].key)
        tabRefs.current[0]?.focus()
        break
      case "End":
        e.preventDefault()
        onChange(tabs[tabs.length - 1].key)
        tabRefs.current[tabs.length - 1]?.focus()
        break
    }
  }

  return (
    <div 
      className="border-b border-zinc-800 bg-zinc-900 flex-shrink-0"
      role="tablist"
      aria-label="Workspace tabs"
    >
      <div className="flex">
        {tabs.map((tab, index) => {
          const Icon = tab.icon
          const isActive = active === tab.key
          
          return (
            <button
              key={tab.key}
              ref={(el: HTMLButtonElement | null) => { tabRefs.current[index] = el; return undefined; }}
              onClick={() => onChange(tab.key)}
              onKeyDown={(e) => handleKeyDown(e, tab.key)}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900 ${
                isActive
                  ? "text-blue-400 border-b-2 border-blue-400 bg-zinc-950"
                  : "text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800"
              }`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tab-${tab.key}`}
              tabIndex={isActive ? 0 : -1}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
