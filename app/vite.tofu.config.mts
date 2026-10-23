// Standalone signal for Tofu: the editor at "/", served with its own
// SoundFonts, without hosted analytics, error reporting or cloud accounts.
import react from "@vitejs/plugin-react"
import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { defineConfig } from "vite"
import checker from "vite-plugin-checker"
import svgr from "vite-plugin-svgr"

const soundFontDir = path.join(__dirname, "../electron/assets/soundfonts")
const soundFonts = ["A320U.sf2", "A320U_drums.sf2", "A320U-license.txt"]
// Licence and provenance files published beside the app.
const notices = ["LICENSE", "TOFU.md", "COPYING.soundfonts"]

export default defineConfig(({ command }) => ({
  plugins: [
    checker({ typescript: true }),
    react(),
    svgr({
      include: "**/*.svg",
      svgrOptions: {
        plugins: ["@svgr/plugin-svgo", "@svgr/plugin-jsx"],
        exportType: "default",
      },
    }),
    {
      name: "signal-standalone-assets",
      // The dev server answers /soundfonts/* with the files the build publishes.
      configureServer(server) {
        server.middlewares.use("/soundfonts", (req, res, next) => {
          const requested = (req.url ?? "").split("?")[0] ?? ""
          const name = decodeURIComponent(requested).replace(/^\//, "")
          if (!soundFonts.includes(name)) {
            next()
            return
          }
          res.setHeader(
            "Content-Type",
            name.endsWith(".txt")
              ? "text/plain; charset=utf-8"
              : "application/octet-stream",
          )
          res.end(readFileSync(path.join(soundFontDir, name)))
        })
      },
      generateBundle() {
        const publicDir = path.join(__dirname, "public")
        for (const entry of readdirSync(publicDir, { withFileTypes: true })) {
          // Upstream's public HTML pages carry hosted analytics and cloud UI.
          if (!entry.isFile() || entry.name.endsWith(".html")) {
            continue
          }
          let source = readFileSync(path.join(publicDir, entry.name))
          if (entry.name === "manifest.webmanifest") {
            const manifest = JSON.parse(source.toString("utf8"))
            manifest.start_url = "/"
            manifest.scope = "/"
            source = Buffer.from(JSON.stringify(manifest, null, 2))
          }
          this.emitFile({ type: "asset", fileName: entry.name, source })
        }
        for (const name of soundFonts) {
          this.emitFile({
            type: "asset",
            fileName: `soundfonts/${name}`,
            source: readFileSync(path.join(soundFontDir, name)),
          })
        }
        for (const name of notices) {
          this.emitFile({
            type: "asset",
            fileName: name,
            source: readFileSync(path.join(__dirname, "..", name)),
          })
        }
      },
    },
  ],
  // Development serves app/public as upstream does; the build emits the
  // filtered copy above instead.
  publicDir: command === "serve" ? "public" : false,
  // Upstream ships unminified bundles ("disable minify for now"); keep that.
  build: { outDir: "dist", minify: false },
  server: { port: 3000 },
  resolve: {
    alias: {
      react: path.resolve(__dirname, "node_modules/react"),
    },
    dedupe: [
      "react",
      "react-dom",
      "firebase",
      "firebase/app",
      "firebase/auth",
      "firebase/firestore",
      "firebase/functions",
    ],
  },
  // Deliberately exposes no Firebase or Sentry settings from the environment,
  // so the editor always starts in its local, account-free mode.
  define: {
    "process.env": {
      NODE_ENV: command === "build" ? "production" : "development",
    },
  },
}))
