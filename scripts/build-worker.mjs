import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const output = resolve("dist", "server");
await mkdir(output, { recursive: true });
await writeFile(
  resolve(output, "index.js"),
  `export default {\n  async fetch(request, env) {\n    return env.ASSETS.fetch(request);\n  }\n};\n`,
  "utf8"
);
console.log("Worker estático generado correctamente");
