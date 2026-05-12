#!/usr/bin/env node
/**
 * stackloom — CLI for the StackLoom foundation scaffold.
 *
 * Subcommands:
 *   create   Bootstrap a new product project from StackLoom (clones from GitHub)
 *   update   Upgrade the current project from upstream StackLoom
 *   check    Check foundation boundary drift
 *   version  Print the CLI version
 *   help     Print usage
 */

import { execFileSync, execSync } from "child_process"
import { fileURLToPath } from "url"
import { createRequire } from "module"
import path from "path"
import fs from "fs"
import os from "os"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PACKAGE_ROOT = path.join(__dirname, "..")
const UPSTREAM_URL = "git@github.com:ooiai/stackloom.git"

// ── helpers ──────────────────────────────────────────────────────────────────

const RED    = "\x1b[31m"
const GREEN  = "\x1b[32m"
const CYAN   = "\x1b[36m"
const YELLOW = "\x1b[33m"
const BOLD   = "\x1b[1m"
const RESET  = "\x1b[0m"

function info(msg)    { console.log(`${CYAN}[stackloom]${RESET} ${msg}`) }
function success(msg) { console.log(`${GREEN}[stackloom]${RESET} ${msg}`) }
function error(msg)   { console.error(`${RED}[stackloom]${RESET} ${msg}`) }

function getVersion() {
  try {
    const require = createRequire(import.meta.url)
    const pkg = require(path.join(PACKAGE_ROOT, "package.json"))
    return pkg.version
  } catch {
    return "unknown"
  }
}

function printHelp() {
  console.log(`
${BOLD}stackloom${RESET} — StackLoom foundation scaffold CLI (v${getVersion()})

${BOLD}USAGE${RESET}
  stackloom <command> [options]

${BOLD}COMMANDS${RESET}
  ${BOLD}create${RESET}   Bootstrap a new product project from StackLoom
  ${BOLD}update${RESET}   Upgrade current project from upstream StackLoom
  ${BOLD}check${RESET}    Check foundation boundary drift in current project
  ${BOLD}version${RESET}  Print CLI version
  ${BOLD}help${RESET}     Print this help

${BOLD}EXAMPLES${RESET}
  # Create a new project
  stackloom create --name "MySchool" --slug "myschool" --email "support@myschool.com"

  # Upgrade an existing project (run from the product project directory)
  stackloom update

  # Check foundation boundaries
  stackloom check

${BOLD}INSTALL${RESET}
  npm install -g @ooiai/stackloom

${BOLD}DOCS${RESET}
  https://github.com/ooiai/stackloom/blob/main/docs/foundation-guide.md
`)
}

// ── script runner ─────────────────────────────────────────────────────────────

function runScript(scriptPath, args = [], env = {}) {
  if (!fs.existsSync(scriptPath)) {
    error(`Script not found: ${scriptPath}`)
    process.exit(1)
  }
  try {
    execFileSync("bash", [scriptPath, ...args], {
      stdio: "inherit",
      env: { ...process.env, ...env },
    })
  } catch (err) {
    // execFileSync throws on non-zero exit; the script already printed errors
    process.exit(err.status ?? 1)
  }
}

// ── command dispatch ──────────────────────────────────────────────────────────

const [, , command, ...rest] = process.argv

switch (command) {
  case "create": {
    // Clone StackLoom from GitHub into a temp dir, then run the create script.
    // This ensures `create` always uses the latest StackLoom source without
    // bundling the entire codebase into the npm package.
    const tmpDir = path.join(os.tmpdir(), `stackloom-src-${Date.now()}`)
    info(`Cloning StackLoom from ${UPSTREAM_URL} ...`)
    try {
      execFileSync("git", ["clone", "--depth=1", "--quiet", UPSTREAM_URL, tmpDir], {
        stdio: "inherit",
      })
    } catch {
      error("Failed to clone StackLoom from GitHub.")
      error(`Make sure git is available and you have access to: ${UPSTREAM_URL}`)
      process.exit(1)
    }

    const script = path.join(tmpDir, "scripts", "create-project.sh")
    try {
      runScript(script, rest, { STACKLOOM_SOURCE: tmpDir })
    } finally {
      // Clean up the temp clone regardless of success/failure
      try { execSync(`rm -rf "${tmpDir}"`, { stdio: "ignore" }) } catch {}
    }
    break
  }

  case "update":
  case "upgrade": {
    const local = path.join(process.cwd(), "scripts", "upgrade-project.sh")
    if (!fs.existsSync(local)) {
      error("scripts/upgrade-project.sh not found in current directory.")
      error("Make sure you are running this from a StackLoom-based project root.")
      process.exit(1)
    }
    runScript(local, rest)
    break
  }

  case "check": {
    const local = path.join(process.cwd(), "scripts", "check-boundaries.sh")
    if (!fs.existsSync(local)) {
      error("scripts/check-boundaries.sh not found in current directory.")
      error("Make sure you are running this from a StackLoom-based project root.")
      process.exit(1)
    }
    runScript(local, rest)
    break
  }

  case "version":
  case "-v":
  case "--version":
    console.log(`stackloom v${getVersion()}`)
    break

  case "help":
  case "-h":
  case "--help":
  case undefined:
    printHelp()
    break

  default:
    error(`Unknown command: "${command}"`)
    console.log(`Run ${BOLD}stackloom help${RESET} for usage.`)
    process.exit(1)
}
