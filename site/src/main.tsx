import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App"

if (typeof window !== "undefined") {
  if ("scrollRestoration" in window.history) {
    window.history.scrollRestoration = "manual"
  }

  const rootElement = document.documentElement
  const previousScrollBehavior = rootElement.style.scrollBehavior
  rootElement.style.scrollBehavior = "auto"
  window.scrollTo(0, 0)

  requestAnimationFrame(() => {
    rootElement.style.scrollBehavior = previousScrollBehavior
  })
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
