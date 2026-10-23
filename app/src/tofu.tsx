// Standalone browser entry: no hosted telemetry or account integration.
import { createRoot } from "react-dom/client"
import { App } from "./components/App/App"

const rootElement = document.querySelector("#root")
if (rootElement === null) {
  throw new Error("Root element '#root' was not found")
}
createRoot(rootElement).render(<App />)

if ("serviceWorker" in navigator && process.env["NODE_ENV"] === "production") {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js", { scope: "/" })
      .catch((error: unknown) =>
        console.warn("Offline cache unavailable:", error),
      )
  })
}
