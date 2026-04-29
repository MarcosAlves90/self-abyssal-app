const { spawn, spawnSync } = require("node:child_process");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const composeFile = path.join(rootDir, "packages/backend/docker-compose.yml");
const composeBaseArgs = ["compose", "-f", composeFile];
const backendServices = [{ name: "api", service: "api", style: "\u001b[38;2;108;170;116m" }];
const frontLogger = { name: "front", style: "\u001b[38;2;156;134;206m" };
const useWebTarget = process.argv.includes("--web");
const mobileScript = useWebTarget ? "dev:mobile:web" : "dev:mobile";

let backendLogStreams = [];
let mobileProcess;
let isShuttingDown = false;

function spawnProcess(command, args, options = {}) {
  return spawn(command, args, {
    cwd: rootDir,
    env: process.env,
    shell: true,
    ...options
  });
}

function waitForExit(child) {
  return new Promise((resolve) => {
    child.on("exit", (code, signal) => {
      resolve({ code, signal });
    });
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

function startServiceLogStream(service) {
  const childProcess = spawnProcess(
    "docker",
    [...composeBaseArgs, "logs", "-f", "--tail=20", service.service],
    { stdio: ["ignore", "pipe", "pipe"] }
  );

  attachPrefixedLogs(childProcess, service);

  childProcess.on("exit", (code) => {
    if (!isShuttingDown && code && code !== 0) {
      const message = `log stream exited with code ${code}`;

      process.stderr.write(`${formatLine(service, message)}\n`);
    }
  });

  return childProcess;
}

async function shutdown(exitCode = 0) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  for (const backendLogStream of backendLogStreams) {
    if (backendLogStream?.exitCode === null) {
      backendLogStream.kill("SIGINT");
    }
  }

  if (mobileProcess?.exitCode === null) {
    mobileProcess.kill("SIGINT");
  }

  spawnSync("docker", [...composeBaseArgs, "down"], {
    cwd: rootDir,
    stdio: "inherit"
  });

  process.exit(exitCode);
}

async function main() {
  const targetLabel = useWebTarget ? "web" : "native";

  process.stdout.write(formatLine(frontLogger, "starting mobile target: " + targetLabel) + "\n");

  const backendUp = spawnProcess("docker", [...composeBaseArgs, "up", "--build", "-d"], {
    stdio: "inherit"
  });

  const backendUpResult = await waitForExit(backendUp);

  if (backendUpResult.code !== 0) {
    process.exit(backendUpResult.code || 1);
  }

  backendLogStreams = backendServices.map((service) => startServiceLogStream(service));

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
