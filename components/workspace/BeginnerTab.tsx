"use client"

import { useState } from "react"
import { BookOpen, Play, Lightbulb, ArrowRight, Database, Users, ShoppingCart, GraduationCap } from "lucide-react"

interface BeginnerTabProps {
  onPromptSelect: (prompt: string) => void
  onSwitchToPromptTab: () => void
}

export default function BeginnerTab({ onPromptSelect, onSwitchToPromptTab }: BeginnerTabProps) {
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null)

  const beginnerPrompts = [
    {
      id: "customer-management",
      title: "Customer Management",
      description: "Track your customers, their contact info, and purchase history",
      icon: Users,
      prompt: "I need to manage my customers. I want to store their names, email addresses, phone numbers, and track their orders.",
      businessValue: "Perfect for small businesses wanting to build customer relationships and track sales"
    },
    {
      id: "inventory-tracking",
      title: "Product Inventory",
      description: "Keep track of your products, quantities, and suppliers",
      icon: Database,
      prompt: "I need to track my inventory. I have products with names, descriptions, quantities in stock, and supplier information.",
      businessValue: "Essential for any business that sells physical products"
    },
    {
      id: "online-store",
      title: "Online Store",
      description: "Manage products, customers, and orders for your e-commerce business",
      icon: ShoppingCart,
      prompt: "I'm starting an online store. I need to manage products, customer accounts, shopping carts, and order processing.",
      businessValue: "Complete foundation for an e-commerce business"
    },
    {
      id: "student-records",
      title: "Student Management",
      description: "Track students, courses, grades, and enrollment information",
      icon: GraduationCap,
      prompt: "I need to manage a school system with students, teachers, courses, and track which students are enrolled in which classes.",
      businessValue: "Great for educational institutions or training programs"
    }
  ]

  const handleTryPrompt = (prompt: string) => {
    onPromptSelect(prompt)
    onSwitchToPromptTab()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-4">
        <h2 className="text-2xl font-extralight text-zinc-100 mb-2 flex items-center space-x-3">
          <BookOpen className="w-6 h-6 text-blue-400" />
          <span>Beginner's Guide</span>
        </h2>
        <p className="text-zinc-400 text-sm">
          New to databases? Start here! Try these common business scenarios to learn how databases can help organize your business.
        </p>
      </div>

      {/* What You'll Learn */}
      <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 rounded-xl p-6 border border-blue-800/30">
        <h3 className="text-lg font-medium text-zinc-100 mb-3 flex items-center space-x-2">
          <Lightbulb className="w-5 h-5 text-yellow-400" />
          <span>What You'll Learn</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-zinc-300">
          <div className="space-y-2">
            <p>• What databases are and why they're useful</p>
            <p>• How to organize business information</p>
            <p>• Different types of data you can store</p>
          </div>
          <div className="space-y-2">
            <p>• How to connect related information</p>
            <p>• Best practices for data organization</p>
            <p>• Real-world business applications</p>
          </div>
        </div>
      </div>

      {/* Beginner Prompts */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-zinc-100">Try These Common Business Scenarios</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {beginnerPrompts.map((item) => (
            <div
              key={item.id}
              className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-xl p-6 border border-zinc-700 hover:border-zinc-600 transition-colors"
            >
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-zinc-800 rounded-lg">
                  <item.icon className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-zinc-100 mb-2">{item.title}</h4>
                  <p className="text-sm text-zinc-400 mb-3">{item.description}</p>
                  <p className="text-xs text-zinc-500 mb-4 italic">{item.businessValue}</p>
                  
                  <button
                    onClick={() => handleTryPrompt(item.prompt)}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Play className="w-4 h-4" />
                    <span>Try This Example</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-xl p-6 border border-zinc-700">
        <h3 className="text-lg font-medium text-zinc-100 mb-4">How It Works</h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
            <div>
              <h4 className="text-sm font-medium text-zinc-200">Choose a Scenario</h4>
              <p className="text-xs text-zinc-400">Pick one of the business scenarios above that matches your needs</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
            <div>
              <h4 className="text-sm font-medium text-zinc-200">See It Generated</h4>
              <p className="text-xs text-zinc-400">Watch as your database structure is automatically created</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
            <div>
              <h4 className="text-sm font-medium text-zinc-200">Learn & Understand</h4>
              <p className="text-xs text-zinc-400">Get explanations about what was created and why it's useful for your business</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">4</div>
            <div>
              <h4 className="text-sm font-medium text-zinc-200">Customize & Expand</h4>
              <p className="text-xs text-zinc-400">Modify the structure to fit your specific business needs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Database Basics */}
      <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-xl p-6 border border-green-800/30">
        <h3 className="text-lg font-medium text-zinc-100 mb-4">Database Basics (In Simple Terms)</h3>
        <div className="space-y-3 text-sm text-zinc-300">
          <div>
            <strong className="text-zinc-200">What is a database?</strong>
            <p className="text-zinc-400">Think of it like a digital filing cabinet that helps you organize and find business information quickly.</p>
          </div>
          <div>
            <strong className="text-zinc-200">What are fields?</strong>
            <p className="text-zinc-400">Fields are like the blanks on a form - spaces where you store specific pieces of information (like "Customer Name" or "Phone Number").</p>
          </div>
          <div>
            <strong className="text-zinc-200">Why use different field types?</strong>
            <p className="text-zinc-400">Just like you wouldn't write a phone number in the "Date" field on a form, databases use different types to ensure information is stored correctly.</p>
          </div>
          <div>
            <strong className="text-zinc-200">What are relationships?</strong>
            <p className="text-zinc-400">Ways to connect related information - like linking a customer to their orders, so you can see all purchases by one person.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
