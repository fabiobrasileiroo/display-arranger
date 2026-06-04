import * as React from "react"

import { cn } from "@/lib/utils"

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-bg-soft/40 p-5 backdrop-blur-sm transition-[transform,box-shadow,border-color,background-color] duration-300 ease-out will-change-transform hover:-translate-y-1 hover:border-primary/30 hover:bg-bg-soft/55 hover:shadow-[0_24px_60px_-30px_rgba(0,0,0,0.85)]",
        className,
      )}
      {...props}
    />
  )
}

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-bg-soft/60 px-2.5 py-0.5 text-xs font-medium text-muted transition-colors duration-300",
        className,
      )}
      {...props}
    />
  )
}
