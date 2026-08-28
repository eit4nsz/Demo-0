import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [html, css, javascript, menuArt] = await Promise.all([
  readFile(resolve(root, "index.html"), "utf8"),
  readFile(resolve(root, "styles.css"), "utf8"),
  readFile(resolve(root, "game.js"), "utf8"),
  readFile(resolve(root, "assets", "images", "menu-hangar-game-art.png"))
]);

const menuArtDataUrl = `data:image/png;base64,${menuArt.toString("base64")}`;

const standalone = html
  .replace('<link rel="stylesheet" href="styles.css">', `<style>\n${css}\n</style>`)
  .replace('<script src="game.js"></script>', `<script>\n${javascript.replaceAll("</script>", "<\\/script>")}\n</script>`)
  .replace('src="assets/images/menu-hangar-game-art.png"', `src="${menuArtDataUrl}"`)
  .replace("<title>Escuela de Aviación</title>", "<title>Escuela de Aviación · Versión autocontenida</title>");

await writeFile(resolve(root, "standalone.html"), standalone, "utf8");
await writeFile(resolve(root, "public", "game.js"), javascript, "utf8");
console.log("standalone.html generado correctamente");
