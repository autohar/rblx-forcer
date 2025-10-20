"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"

// Dynamically import your existing generator page
const Generator = dynamic(() => import("./[directory]/page"), { ssr: false })

export default function HomePage() {
  const [showGenerator, setShowGenerator] = useState(false)

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6">
      {/* Title */}
      <h1 className="text-3xl font-bold mb-6 text-center">
        Welcome to Dual Hook Generator
      </h1>

      {/* Button to show/hide generator */}
      <Button
        onClick={() => setShowGenerator(!showGenerator)}
        className="mb-6 px-6 py-3 text-lg font-semibold"
      >
        {showGenerator ? "Hide Generator" : "Dual Hook Generator"}
      </Button>

      {/* Show generator when button clicked */}
      {showGenerator && (
        <div
          className="w-full max-w-4xl transition-all duration-300 ease-in-out"
          style={{
            opacity: showGenerator ? 1 : 0,
            transform: showGenerator ? "scale(1)" : "scale(0.98)",
          }}
        >
          <Generator />
        </div>
      )}
    </main>
  )
}
