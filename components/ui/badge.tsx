import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantClasses =
    variant === "default"
      ? "bg-purple-600 text-white"
      : variant === "secondary"
        ? "bg-white/10 text-white"
        : "border border-gray-300 text-white"
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variantClasses,
        className
      )}
      {...props}
    />
  )
}

export { Badge }
