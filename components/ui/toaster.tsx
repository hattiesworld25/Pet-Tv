"use client"

import { useEffect, useState } from "react"
import { TOAST_EVENT, type ToastInput } from "@/hooks/use-toast"

type ActiveToast = ToastInput & { id: number }

export function Toaster() {
  const [toasts, setToasts] = useState<ActiveToast[]>([])

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<ActiveToast>).detail
      if (!detail) return
      setToasts((prev) => [...prev.slice(-2), detail])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== detail.id))
      }, 3000)
    }
    window.addEventListener(TOAST_EVENT, handler)
    return () => window.removeEventListener(TOAST_EVENT, handler)
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="rounded-lg border border-white/20 bg-gray-900/95 px-4 py-3 shadow-2xl"
        >
          {t.title && (
            <p className="text-sm font-semibold text-white">{t.title}</p>
          )}
          {t.description && (
            <p className="mt-0.5 text-sm text-white/70">{t.description}</p>
          )}
        </div>
      ))}
    </div>
  )
}
