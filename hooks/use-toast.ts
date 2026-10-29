"use client"

// Minimal toast for Pet TV. The page calls toast({ title, description });
// the <Toaster /> in the app layout listens for these events and shows them.

export type ToastInput = {
  title?: string
  description?: string
}

export const TOAST_EVENT = "pet-tv-toast"

export function toast({ title, description }: ToastInput) {
  if (typeof window === "undefined") return
  window.dispatchEvent(
    new CustomEvent<ToastInput & { id: number }>(TOAST_EVENT, {
      detail: { title, description, id: Date.now() + Math.random() },
    })
  )
}

export function useToast() {
  return { toast }
}
