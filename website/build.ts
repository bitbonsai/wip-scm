// Deploy build: copy public/ -> dist/ and inline style.css into each page
// so there is zero render-blocking CSS. Run by CF Pages: `bun build.ts`,
// output directory `dist`. Local dev keeps serving public/ uninlined.
import { cpSync, readFileSync, writeFileSync, rmSync } from "node:fs";

rmSync("dist", { recursive: true, force: true });
cpSync("public", "dist", { recursive: true });

const css = readFileSync("public/style.css", "utf8");
const link = '<link rel="stylesheet" href="/style.css" />';

for (const page of ["index.html", "rfc.html"]) {
  const html = readFileSync(`public/${page}`, "utf8");
  if (!html.includes(link)) throw new Error(`${page}: stylesheet link not found`);
  writeFileSync(`dist/${page}`, html.replace(link, `<style>\n${css}</style>`));
}

rmSync("dist/style.css");
rmSync("dist/data.db", { force: true });
console.log("built dist/ with inlined CSS");
