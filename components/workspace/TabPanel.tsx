"use client"

interface TabPanelProps {
  children: React.ReactNode
  hidden: boolean
  id: string
}

export default function TabPanel({ children, hidden, id }: TabPanelProps) {
  if (hidden) {
    return null
  }

  return (
    <div
      role="tabpanel"
      id={id}
      aria-hidden={false}
      className="w-full h-full"
    >
      {children}
    </div>
  )
}
