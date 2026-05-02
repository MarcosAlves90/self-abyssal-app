const { accessSync, constants } = require("node:fs");
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const backendRoot = path.resolve(__dirname, "..");

function canAccess(filePath) {
  try {
    accessSync(filePath, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function resolveVenvPython(baseDir) {
  const candidates = process.platform === "win32"
    ? [
        path.join(baseDir, "Scripts", "python.exe"),
        path.join(baseDir, "Scripts", "python"),
      ]
    : [
        path.join(baseDir, "bin", "python"),
      ];

  return candidates.find(canAccess) ?? null;
}

function resolvePythonCommand() {
  if (process.env.PYTHON) {
    return { command: process.env.PYTHON, args: [] };
  }

  if (process.env.VIRTUAL_ENV) {
    const venvPython = resolveVenvPython(process.env.VIRTUAL_ENV);
    if (venvPython) {
      return { command: venvPython, args: [] };
    }
  }

  const localEnvDirs = [".venv", "venv", ".env", "env"];
  for (const dir of localEnvDirs) {
    const venvPython = resolveVenvPython(path.join(backendRoot, dir));
    if (venvPython) {
      return { command: venvPython, args: [] };
    }
  }

  const fallbackCandidates = process.platform === "win32"
    ? [
        { command: "py", args: ["-3"] },
        { command: "python", args: [] },
        { command: "python3", args: [] },
      ]
    : [
        { command: "python3", args: [] },
        { command: "python", args: [] },
        { command: "py", args: ["-3"] },
      ];

  for (const candidate of fallbackCandidates) {
    const probe = spawnSync(candidate.command, [...candidate.args, "--version"], {
      cwd: backendRoot,
      encoding: "utf8",
      shell: false,
    });

    if (!probe.error && probe.status === 0) {
      return candidate;
    }
  }

  throw new Error(
    "Nenhum interpretador Python foi encontrado. Crie/ative o venv em packages/backend/.venv ou instale Python no sistema."
  );
}

const python = resolvePythonCommand();
const child = spawnSync(python.command, [...python.args, ...process.argv.slice(2)], {
  cwd: backendRoot,
  stdio: "inherit",
  shell: false,
});

if (child.error) {
  console.error(child.error.message);
  process.exit(child.status ?? 1);
}

process.exit(child.status ?? 0);
