// Run from the target repository root after its original build and the new app build.
// Only generated directories are written. Existing source files are never modified.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
const root = fs.realpathSync(".");
const legacy = path.join(root, "dist");
const app = path.join(root, "chip-visualizer/dist");
const target = path.join(legacy, "gemm32");
const preview = path.join(root, ".tooling/pages-preview/WEB_GEMM_ASIC_SKY130");
if (
  !fs.existsSync(path.join(legacy, "index.html")) ||
  !fs.existsSync(path.join(app, "index.html"))
)
  throw Error("Build both websites first");
if (fs.existsSync(target))
  throw Error(
    "dist/gemm32 already exists. Run the original root build to regenerate a clean dist first.",
  );
const hash = (file) =>
  crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isSymbolicLink()) throw Error(`Unexpected link: ${p}`);
    return e.isDirectory() ? files(p) : [p];
  });
}
const original = new Map(
  files(legacy).map((p) => [path.relative(legacy, p), hash(p)]),
);
const expectedBase = "/WEB_GEMM_ASIC_SKY130/gemm32/";
if (
  !fs
    .readFileSync(path.join(app, "index.html"), "utf8")
    .includes(`${expectedBase}assets/`)
)
  throw Error("Wrong Vite production base");
fs.cpSync(app, target, { recursive: true });
for (const [relative, digest] of original)
  if (hash(path.join(legacy, relative)) !== digest)
    throw Error(`Existing website changed: ${relative}`);
const banned =
  /\.(?:gds|oas|odb|def|lef|spef|sdf|lib|db|vcd|pem|key|exe|dll|zip|tar|gz)$/i;
const secret =
  /(?:-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----|github_pat_[A-Za-z0-9_]{30,}|gh[pousr]_[A-Za-z0-9]{30,})/;
let total = 0;
for (const file of files(legacy)) {
  const rel = path.relative(legacy, file).replaceAll(path.sep, "/");
  const size = fs.statSync(file).size;
  total += size;
  if (
    banned.test(rel) ||
    size > 5 * 1024 * 1024 ||
    /(^|\/)(?:node_modules|\.git|pdk|\.env)(\/|$)/i.test(rel)
  )
    throw Error(`Disallowed artifact: ${rel}`);
  if (
    /\.(?:js|json|html|css|md|txt|tcl|py|v|svg)$/i.test(rel) &&
    secret.test(fs.readFileSync(file, "utf8"))
  )
    throw Error(`Credential pattern detected in ${rel}`);
}
fs.mkdirSync(path.dirname(preview), { recursive: true });
fs.cpSync(legacy, preview, { recursive: true });
const report = {
  legacyFilesVerified: original.size,
  combinedFiles: files(legacy).length,
  totalBytes: total,
  base: expectedBase,
  legacyIndexSHA256: original.get("index.html"),
  legacySourceModified: false,
};
fs.writeFileSync(
  path.join(root, ".tooling/combined-build-audit.json"),
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report, null, 2));
