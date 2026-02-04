"use client"

import { useEffect } from "react"

// Suppress benign ResizeObserver errors that occur when callbacks
// can't be delivered in a single animation frame
export function ResizeObserverFix() {
  useEffect(() => {
    const resizeObserverError = (e: ErrorEvent) => {
      if (e.message === "ResizeObserver loop completed with undelivered notifications.") {
        e.stopImmediatePropagation()
      }
    }
    
    window.addEventListener("error", resizeObserverError)
    return () => window.removeEventListener("error", resizeObserverError)
  }, [])
  
  return null
}
