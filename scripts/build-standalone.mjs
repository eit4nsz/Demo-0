import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [html, css, javascript, welcomeArt] = await Promise.all([
  readFile(resolve(root, "index.html"), "utf8"),
  readFile(resolve(root, "styles.css"), "utf8"),
  readFile(resolve(root, "game.js"), "utf8"),
  readFile(resolve(root, "assets", "images", "welcome-pilot-cat.webp"))
]);

const welcomeArtDataUrl = `data:image/webp;base64,${welcomeArt.toString("base64")}`;

const standalone = html
  .replace('<link rel="stylesheet" href="styles.css">', `<style>\n${css}\n</style>`)
  .replace('<script src="game.js"></script>', `<script>\n${javascript.replaceAll("</script>", "<\\/script>")}\n</script>`)
  .replace('src="assets/images/welcome-pilot-cat.webp"', `src="${welcomeArtDataUrl}"`)
  .replace("<title>Escuela de Aviación</title>", "<title>Escuela de Aviación · Versión autocontenida</title>");

await writeFile(resolve(root, "standalone.html"), standalone, "utf8");
await writeFile(resolve(root, "public", "game.js"), javascript, "utf8");
console.log("standalone.html generado correctamente");
