const { spawn, spawnSync } = require("node:child_process");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const composeFile = path.join(rootDir, "packages/backend/docker-compose.yml");
const composeBaseArgs = ["compose", "-f", composeFile];
const backendServices = ["identity-service", "catalog-service", "operations-service"];
const useWebTarget = process.argv.includes("--web");
const mobileScript = useWebTarget ? "dev:mobile:web" : "dev:mobile";

let backendLogStream;
let mobileProcess;
let isShuttingDown = false;

function spawnProcess(command, args, options = {}) {
  return spawn(command, args, {
    cwd: rootDir,
    env: process.env,
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

function pipeWithPrefix(stream, prefix, target) {
  let buffer = "";

  stream.on("data", (chunk) => {
    buffer += chunk.toString().replaceAll("\r", "");
    const lines = buffer.split("\n");
    buffer = lines.pop();

    for (const line of lines) {
      if (line) {
        target.write(`${prefix}${line}\n`);
      }
    }
  });

  stream.on("end", () => {
    if (buffer) {
      target.write(`${prefix}${buffer}\n`);
    }
  });
}

async function shutdown(exitCode = 0) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  if (backendLogStream?.exitCode === null) {
    backendLogStream.kill("SIGINT");
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
  process.stdout.write(`[dev] starting mobile target: ${useWebTarget ? "web" : "native"}\n`);

  const backendUp = spawnProcess("docker", [...composeBaseArgs, "up", "--build", "-d"], {
    stdio: "inherit"
  });

  const backendUpResult = await waitForExit(backendUp);

  if (backendUpResult.code !== 0) {
    process.exit(backendUpResult.code || 1);
  }

  backendLogStream = spawnProcess(
    "docker",
    [...composeBaseArgs, "logs", "-f", "--tail=20", "--no-log-prefix", ...backendServices],
    { stdio: ["ignore", "pipe", "pipe"] }
  );

  pipeWithPrefix(backendLogStream.stdout, "[backend] ", process.stdout);
  pipeWithPrefix(backendLogStream.stderr, "[backend] ", process.stderr);

  backendLogStream.on("exit", (code) => {
    if (!isShuttingDown && code && code !== 0) {
      process.stderr.write(`[backend] log stream exited with code ${code}\n`);
    }
  });

  mobileProcess = spawnProcess("npm", ["run", mobileScript], {
    stdio: "inherit"
  });

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
  console.error("[dev]", error.message);
  shutdown(1);
});
