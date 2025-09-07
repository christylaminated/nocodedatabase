"use client"

import { useState } from "react"
import { Plus, Database, Edit3, Eye, Sparkles } from "lucide-react"
import Link from "next/link"

export default function NoCodeDatabase() {
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("")

  const examplePrompts = [
    {
      icon: <Database className="w-5 h-5 text-blue-600" />,
      text: "I want to track students and their course enrollments. Each student should have a name, email, major, and GPA that is automatically calculated from their grades. Each course should have a name, code, and instructor. I also want to log each student's grades for different assignments, and only show a 'makeup submission' field if the original grade is below 60.",
      category: "Student Management",
    },
    {
      icon: <Edit3 className="w-5 h-5 text-purple-600" />,
      text: "I want to track employee information including departments and hire dates",
      category: "HR Management",
    },
    {
      icon: <Eye className="w-5 h-5 text-indigo-600" />,
      text: "Set up event bookings with attendee details and ticket quantities",
      category: "Event Management",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 font-sans">
      {/* Subtle Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-40 left-40 w-80 h-80 bg-slate-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      {/* Header */}
      <header className="relative bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
        <div className="relative max-w-7xl mx-auto px-8 py-20 text-center">
          <div className="flex items-center justify-center mb-8">
            <div className="bg-white/10 p-5 rounded-3xl backdrop-blur-sm border border-white/20">
              <Database className="w-14 h-14 text-white" />
            </div>
          </div>
          <h1 className="text-6xl font-extralight mb-6 tracking-tight leading-tight">
            Intelligent Database
            <span className="block font-light text-blue-200">Management Platform</span>
          </h1>
          <p className="text-xl font-light opacity-90 max-w-3xl mx-auto leading-relaxed mb-8">
            Transform your data requirements into sophisticated database structures using natural language processing.
            No technical expertise required.
          </p>
          <div className="flex items-center justify-center space-x-3 text-sm font-medium">
            <Sparkles className="w-4 h-4 text-blue-300" />
            <span className="text-blue-200">Powered by Advanced AI</span>
            <Sparkles className="w-4 h-4 text-blue-300" />
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-8 py-16">
        {/* Message Display */}
        {message && (
          <div
            className={`mb-12 p-6 rounded-2xl border font-medium shadow-lg backdrop-blur-sm ${
              messageType === "success"
                ? "bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-800 border-emerald-200"
                : "bg-gradient-to-r from-red-50 to-rose-50 text-red-800 border-red-200"
            }`}
          >
            <div className="flex items-center space-x-4">
              <div
                className={`w-2 h-2 rounded-full ${messageType === "success" ? "bg-emerald-500" : "bg-red-500"}`}
              ></div>
              <span>{message}</span>
            </div>
          </div>
        )}
      
        {/* Get Started Section */}
        <section className="bg-white rounded-3xl shadow-2xl border border-slate-200/50 p-10 mb-16 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-center space-y-8">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-4xl font-extralight text-slate-900 mb-6 tracking-tight">Your Database Journey Awaits</h2>
              <p className="text-lg text-slate-600 font-light leading-relaxed mb-8">
                Step into our interactive workspace where you can:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 hover:shadow-md transition-all duration-300">
                  <div className="bg-blue-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                    <Database className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-medium text-slate-800 mb-2">Design Schemas</h3>
                  <p className="text-sm text-slate-600">Describe your data needs in plain English and watch as AI creates your database structure</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-100 hover:shadow-md transition-all duration-300">
                  <div className="bg-purple-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                    <Edit3 className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-medium text-slate-800 mb-2">Customize Fields</h3>
                  <p className="text-sm text-slate-600">Fine-tune your database structure with an intuitive visual editor</p>
                </div>
                
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-100 hover:shadow-md transition-all duration-300">
                  <div className="bg-indigo-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                    <Eye className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="font-medium text-slate-800 mb-2">Manage Data</h3>
                  <p className="text-sm text-slate-600">Create forms and interfaces to interact with your database</p>
                </div>
              </div>
            </div>
            
            <Link
              href="/workspace"
              className="w-full md:w-1/2 lg:w-1/3 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-10 py-5 rounded-2xl font-medium text-lg hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center space-x-4"
            >
              <Sparkles className="w-6 h-6" />
              <span>Enter Workspace</span>
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
