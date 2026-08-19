'use client'

import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react'

export interface TelemetryEvent {
  session_id: string
  mission_id: string
  event_type: string
  payload: any
  timestamp: string // ISO string
}

interface TelemetryContextType {
  logEvent: (eventType: string, payload?: any) => void
}

const TelemetryContext = createContext<TelemetryContextType | null>(null)

export function useTelemetry() {
  const ctx = useContext(TelemetryContext)
  if (!ctx) {
    throw new Error('useTelemetry must be used within a TelemetryProvider')
  }
  return ctx
}

interface TelemetryProviderProps {
  children: React.ReactNode
  sessionId: string
  missionId: string
}

export function TelemetryProvider({ children, sessionId, missionId }: TelemetryProviderProps) {
  const bufferRef = useRef<TelemetryEvent[]>([])
  const flushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFlushingRef = useRef(false)

  const flush = useCallback(async (isUnload = false) => {
    if (bufferRef.current.length === 0) return
    if (isFlushingRef.current && !isUnload) return

    const eventsToFlush = [...bufferRef.current]
    bufferRef.current = [] // clear buffer optimistically

    if (isUnload) {
      // Use sendBeacon for page unload
      const blob = new Blob([JSON.stringify(eventsToFlush)], { type: 'application/json' })
      navigator.sendBeacon('/api/telemetry', blob)
      return
    }

    isFlushingRef.current = true
    try {
      const res = await fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventsToFlush),
      })
      if (!res.ok) {
        throw new Error('Failed to send telemetry')
      }
    } catch (err) {
      console.warn('Telemetry flush failed, requeuing events...', err)
      // Requeue at the beginning
      bufferRef.current = [...eventsToFlush, ...bufferRef.current]
    } finally {
      isFlushingRef.current = false
    }
  }, [])

  const logEvent = useCallback((eventType: string, payload: any = {}) => {
    const event: TelemetryEvent = {
      session_id: sessionId,
      mission_id: missionId,
      event_type: eventType,
      payload,
      timestamp: new Date().toISOString()
    }
    bufferRef.current.push(event)

    if (bufferRef.current.length >= 20) {
      // Flush immediately if buffer is full
      if (flushTimeoutRef.current) clearTimeout(flushTimeoutRef.current)
      flush()
    } else if (!flushTimeoutRef.current) {
      // Schedule a flush in 5 seconds if not already scheduled
      flushTimeoutRef.current = setTimeout(() => {
        flushTimeoutRef.current = null
        flush()
      }, 5000)
    }
  }, [sessionId, missionId, flush])

  // Setup unmount / page hide behavior
  useEffect(() => {
    logEvent('session_start')

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flush(true)
      }
    }
    const handleBeforeUnload = () => {
      flush(true)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      logEvent('session_end')
      flush(true) // flush everything on unmount
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      if (flushTimeoutRef.current) clearTimeout(flushTimeoutRef.current)
    }
  }, [logEvent, flush])

  // Idle tracking
  useEffect(() => {
    let idleTimer: ReturnType<typeof setTimeout>
    
    const resetIdleTimer = () => {
      clearTimeout(idleTimer)
      idleTimer = setTimeout(() => {
        logEvent('idle', { duration_ms: 30000 })
      }, 30000)
    }

    // Attach listeners
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll']
    events.forEach(e => document.addEventListener(e, resetIdleTimer, { passive: true }))
    
    resetIdleTimer()

    return () => {
      clearTimeout(idleTimer)
      events.forEach(e => document.removeEventListener(e, resetIdleTimer))
    }
  }, [logEvent])

  return (
    <TelemetryContext.Provider value={{ logEvent }}>
      {children}
    </TelemetryContext.Provider>
  )
}
