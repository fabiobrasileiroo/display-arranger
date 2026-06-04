import type { ReactNode } from "react"
import { motion } from "motion/react"

/**
 * Scroll-triggered reveal using Motion's `whileInView`. Unlike a one-shot
 * IntersectionObserver, this observes each element when it mounts — so it works
 * for content that loads asynchronously (e.g. the releases fetched from GitHub).
 */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  as = "div",
}: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
  as?: "div" | "section" | "li"
}) {
  const MotionTag = motion[as]
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.7, delay: delay / 1000, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </MotionTag>
  )
}
