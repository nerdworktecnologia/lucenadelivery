import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const i = args.indexOf(name);
  if (i === -1) return fallback;
  return args[i + 1] ?? fallback;
};

const hasFlag = (name) => args.includes(name);

const sessionId = getArg("--session", "cpanel-delete-client-error");
const outdir = getArg("--outdir", ".dbg");
const clean = hasFlag("--clean");
const idleSeconds = Number(getArg("--idle", "0")) || 0;
const remote = hasFlag("--remote");
const basePort = Number(getArg("--port", "7777")) || 7777;

const host = remote ? "0.0.0.0" : "127.0.0.1";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const ensureDir = (p) => {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
};

const writeEnvFile = (apiUrl) => {
  ensureDir(outdir);
  const envPath = path.join(outdir, `${sessionId}.env`);
  fs.writeFileSync(envPath, `DEBUG_SERVER_URL=${apiUrl}\nDEBUG_SESSION_ID=${sessionId}\n`, "utf8");
  return envPath;
};

const getIp = () => {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const n of nets[name] || []) {
      if (n.family === "IPv4" && !n.internal) return n.address;
    }
  }
  return "127.0.0.1";
};

const start = async () => {
  ensureDir(outdir);
  const logFile = path.join(outdir, `trae-debug-log-${sessionId}.ndjson`);
  if (clean) {
    try {
      fs.writeFileSync(logFile, "", "utf8");
    } catch {}
  }

  let lastActivity = Date.now();
  const touch = () => {
    lastActivity = Date.now();
  };

  const server = http.createServer((req, res) => {
    if (!req.url) {
      res.writeHead(404, corsHeaders);
      res.end("not found");
      return;
    }

    if (req.method === "OPTIONS" && req.url.startsWith("/event")) {
      res.writeHead(204, corsHeaders);
      res.end();
      return;
    }

    if (req.method === "POST" && req.url.startsWith("/event")) {
      touch();
      let raw = "";
      req.on("data", (c) => { raw += c; });
      req.on("end", () => {
        try {
          const evt = JSON.parse(raw || "{}");
          if (!evt.ts) evt.ts = Date.now();
          if (!evt.sessionId) evt.sessionId = sessionId;
          fs.appendFileSync(logFile, `${JSON.stringify(evt)}\n`, "utf8");
          res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: true }));
        } catch {
          res.writeHead(400, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: false, error: "invalid json" }));
        }
      });
      return;
    }

    if (req.method === "GET" && req.url.startsWith("/health")) {
      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    res.writeHead(404, corsHeaders);
    res.end("not found");
  });

  const bind = (port) =>
    new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(port, host, () => resolve(port));
    });

  let actualPort = basePort;
  for (let i = 0; i < 10; i++) {
    try {
      actualPort = await bind(basePort + i);
      break;
    } catch (e) {
      if (i === 9) throw e;
    }
  }

  const publicHost = remote ? getIp() : "127.0.0.1";
  const apiUrl = `http://${publicHost}:${actualPort}/event`;
  const envFile = writeEnvFile(apiUrl);

  process.stdout.write(`@@DEBUG_SERVER_INFO\n${JSON.stringify({
    api_url: apiUrl,
    session_id: sessionId,
    log_dir: path.resolve(outdir),
    log_file: path.resolve(logFile),
    env_file: path.resolve(envFile),
  }, null, 2)}\n@@END_DEBUG_SERVER_INFO\n`);

  if (idleSeconds > 0) {
    setInterval(() => {
      if (Date.now() - lastActivity > idleSeconds * 1000) {
        server.close(() => process.exit(0));
      }
    }, 1000).unref();
  }
};

start().catch((e) => {
  process.stderr.write(String(e?.stack || e) + "\n");
  process.exit(1);
});

