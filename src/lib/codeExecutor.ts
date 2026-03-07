import { runInNewContext } from "vm";
import { spawn, type ChildProcess } from "child_process";

export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTimeMs: number;
  language: string;
}

const MAX_TIMEOUT_MS = 10_000;
const MAX_OUTPUT_LENGTH = 50_000;

export async function executeCode(
  language: string,
  code: string,
): Promise<ExecutionResult> {
  const lang = language.toLowerCase().trim();

  if (lang === "javascript" || lang === "js") {
    return executeJavaScript(code);
  }
  if (lang === "python" || lang === "py") {
    return executePython(code);
  }

  return {
    success: false,
    output: "",
    error: `Linguagem não suportada: "${language}". Suportadas: javascript, python`,
    executionTimeMs: 0,
    language,
  };
}

function formatValue(val: unknown): string {
  if (val === null) return "null";
  if (val === undefined) return "undefined";
  if (typeof val === "object") {
    try {
      return JSON.stringify(val, null, 2);
    } catch {
      return String(val);
    }
  }
  return String(val);
}

function executeJavaScript(code: string): ExecutionResult {
  const start = Date.now();
  const logs: string[] = [];

  const sandbox = {
    console: {
      log: (...args: unknown[]) => logs.push(args.map(formatValue).join(" ")),
      error: (...args: unknown[]) =>
        logs.push("[ERROR] " + args.map(formatValue).join(" ")),
      warn: (...args: unknown[]) =>
        logs.push("[WARN] " + args.map(formatValue).join(" ")),
      info: (...args: unknown[]) => logs.push(args.map(formatValue).join(" ")),
      table: (...args: unknown[]) => logs.push(args.map(formatValue).join(" ")),
    },
    Math,
    Date,
    JSON,
    Array,
    Object,
    String,
    Number,
    Boolean,
    RegExp,
    Map,
    Set,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    encodeURIComponent,
    decodeURIComponent,
    encodeURI,
    decodeURI,
    // Blocked APIs
    setTimeout: undefined,
    setInterval: undefined,
    setImmediate: undefined,
    clearTimeout: undefined,
    clearInterval: undefined,
    clearImmediate: undefined,
    require: undefined,
    process: undefined,
    global: undefined,
    globalThis: undefined,
    Buffer: undefined,
    __dirname: undefined,
    __filename: undefined,
    fetch: undefined,
  };

  try {
    const result = runInNewContext(code, sandbox, {
      timeout: MAX_TIMEOUT_MS,
      displayErrors: true,
    });

    if (result !== undefined) {
      logs.push(formatValue(result));
    }

    const output = logs.join("\n").slice(0, MAX_OUTPUT_LENGTH);
    return {
      success: true,
      output: output || "(sem output)",
      executionTimeMs: Date.now() - start,
      language: "javascript",
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const output = logs.join("\n");
    return {
      success: false,
      output,
      error: errorMsg,
      executionTimeMs: Date.now() - start,
      language: "javascript",
    };
  }
}

function executePython(code: string): Promise<ExecutionResult> {
  const start = Date.now();
  const codeB64 = Buffer.from(code).toString("base64");

  // Sandbox wrapper: blocks dangerous modules, file access, then execs user code
  const wrapper = [
    "import sys, io, base64, builtins",
    "",
    "BLOCKED = {",
    '    "os","subprocess","shutil","socket","http","urllib",',
    '    "requests","ftplib","smtplib","telnetlib","ctypes",',
    '    "multiprocessing","signal","webbrowser","pathlib",',
    '    "glob","tempfile","zipfile","tarfile","sqlite3",',
    '    "pickle","shelve","dbm",',
    "}",
    "",
    "_orig = builtins.__import__",
    "def _safe(name, *a, **kw):",
    '    if name.split(".")[0] in BLOCKED:',
    "        raise ImportError(f\"Module '{name}' is blocked in sandbox\")",
    "    return _orig(name, *a, **kw)",
    "builtins.__import__ = _safe",
    "",
    "def _no_open(*a, **kw):",
    '    raise PermissionError("File access is blocked in sandbox")',
    "builtins.open = _no_open",
    "",
    "try:",
    `    _code = base64.b64decode("${codeB64}").decode("utf-8")`,
    '    exec(compile(_code, "<sandbox>", "exec"))',
    "except SystemExit:",
    "    pass",
    "except Exception as e:",
    '    print(f"{type(e).__name__}: {e}", file=sys.stderr)',
  ].join("\n");

  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let killed = false;

    // Filter env to exclude secrets
    const safeEnv = Object.fromEntries(
      Object.entries(process.env)
        .filter(([key]) => {
          const k = key.toUpperCase();
          return (
            !k.includes("KEY") &&
            !k.includes("SECRET") &&
            !k.includes("TOKEN") &&
            !k.includes("PASSWORD") &&
            !k.includes("SUPABASE") &&
            !k.includes("GEMINI")
          );
        })
        .filter((entry): entry is [string, string] => entry[1] !== undefined),
    );

    const proc: ChildProcess = spawn("python", ["-u", "-"], {
      stdio: ["pipe", "pipe", "pipe"],
      env: safeEnv as NodeJS.ProcessEnv,
    });

    const timer = setTimeout(() => {
      killed = true;
      proc.kill("SIGTERM");
    }, MAX_TIMEOUT_MS);

    proc.stdout!.on("data", (data: Buffer) => {
      stdout += data.toString();
      if (stdout.length > MAX_OUTPUT_LENGTH) {
        stdout = stdout.slice(0, MAX_OUTPUT_LENGTH) + "\n...(output truncado)";
        killed = true;
        proc.kill("SIGTERM");
      }
    });

    proc.stderr!.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on("close", () => {
      clearTimeout(timer);

      if (killed && !stdout && !stderr) {
        resolve({
          success: false,
          output: "",
          error: "Execução excedeu o limite de tempo (10s)",
          executionTimeMs: Date.now() - start,
          language: "python",
        });
        return;
      }

      const output = stdout.slice(0, MAX_OUTPUT_LENGTH);
      const hasError = stderr.length > 0;

      resolve({
        success: !hasError,
        output: output || (hasError ? "" : "(sem output)"),
        error: stderr || undefined,
        executionTimeMs: Date.now() - start,
        language: "python",
      });
    });

    proc.on("error", (err: NodeJS.ErrnoException) => {
      clearTimeout(timer);
      resolve({
        success: false,
        output: "",
        error:
          err.code === "ENOENT"
            ? "Python não encontrado. Certifique-se de que o Python está instalado e no PATH."
            : err.message,
        executionTimeMs: Date.now() - start,
        language: "python",
      });
    });

    proc.stdin!.write(wrapper);
    proc.stdin!.end();
  });
}
