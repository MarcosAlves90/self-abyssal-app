const { spawn } = require("node:child_process");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const backendLogger = { name: "api", style: "\u001b[38;2;108;170;116m" };
const frontLogger = { name: "front", style: "\u001b[38;2;156;134;206m" };
const useWebTarget = process.argv.includes("--web");
const mobileScript = useWebTarget ? "dev:mobile:web" : "dev:mobile";

let backendProcess;
let mobileProcess;
let isShuttingDown = false;
let backendRestartTimer = null;

function spawnProcess(command, args, options = {}) {
  return spawn(command, args, {
    cwd: rootDir,
    env: process.env,
    shell: true,
    ...options
  });
}

function formatLine({ name, style }, message) {
  const line = `[${name}] ${message}`;
  return `${style}${line}\u001b[0m`;
}

function attachPrefixedLogs(childProcess, logger) {
  const writeLine = (target, message) => {
    target.write(`${formatLine(logger, message)}\n`);
  };

  childProcess.stdout.on("data", (chunk) => {
    writeLines(chunk, process.stdout, writeLine);
  });

  childProcess.stderr.on("data", (chunk) => {
    writeLines(chunk, process.stderr, writeLine);
  });
}

function writeLines(chunk, target, writeLine) {
  const normalized = chunk.toString().replaceAll("\r", "");
  const lines = normalized.split("\n");
  const trailingLine = lines.pop();

  for (const line of lines) {
    if (line) {
      writeLine(target, line);
    }
  }

  if (trailingLine) {
    writeLine(target, trailingLine);
  }
}

function describeProcessExit(code, signal) {
  if (typeof code === "number") {
    return `code ${code}`;
  }

  return `signal ${signal}`;
}

async function shutdown(exitCode = 0) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  if (backendRestartTimer) {
    clearTimeout(backendRestartTimer);
    backendRestartTimer = null;
  }

  if (backendProcess?.exitCode === null) {
    backendProcess.kill("SIGINT");
  }

  if (mobileProcess?.exitCode === null) {
    mobileProcess.kill("SIGINT");
  }

  process.exit(exitCode);
}

function startBackend() {
  const childProcess = spawnProcess("npm", ["--workspace", "@abyssal/backend", "run", "dev"], {
    stdio: ["ignore", "pipe", "pipe"]
  });

  attachPrefixedLogs(childProcess, backendLogger);

  childProcess.on("exit", (code, signal) => {
    if (isShuttingDown || childProcess !== backendProcess) {
      return;
    }

    const exitDescription = describeProcessExit(code, signal);
    const exitedBySignal = typeof signal === "string";

    const restartMessage = "backend stopped (" + exitDescription + "); restarting...";
    process.stderr.write(formatLine(backendLogger, restartMessage) + "\n");

    if (backendRestartTimer) {
      return;
    }

    backendRestartTimer = setTimeout(() => {
      backendRestartTimer = null;

      if (isShuttingDown) {
        return;
      }

      backendProcess = startBackend();
    }, exitedBySignal ? 1500 : 1000);
  });

  return childProcess;
}

async function main() {
  const targetLabel = useWebTarget ? "web" : "native";

  process.stdout.write(formatLine(frontLogger, "starting mobile target: " + targetLabel) + "\n");

  // Start backend via npm workspace script (uses .venv in dev)
  backendProcess = startBackend();

  // Start mobile process
  mobileProcess = spawnProcess("npm", ["run", mobileScript], {
    stdio: ["ignore", "pipe", "pipe"]
  });

  attachPrefixedLogs(mobileProcess, frontLogger);

  mobileProcess.on("exit", (code, signal) => {
    let nextCode = 0;

    if (typeof code === "number") {
      nextCode = code;
    } else if (signal) {
      nextCode = 130;
    }

    shutdown(nextCode);
  });

  process.on("SIGINT", () => {
    shutdown(0);
  });

  process.on("SIGTERM", () => {
    shutdown(0);
  });
}

main().catch((error) => {
  console.error(formatLine(frontLogger, error.message));
  shutdown(1);
});
