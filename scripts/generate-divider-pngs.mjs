import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const svgPath = path.resolve(__dirname, "..", "public", "images", "orange-divider.svg");
const svg = fs.readFileSync(svgPath, "utf-8");

const colors = {
  orange: "#F97316",
  black: "#1C1C1C",
  white: "#FFFFFF",
};

for (const [name, color] of Object.entries(colors)) {
  const colored = svg.replace(/#F97316/g, color);
  const outPath = path.resolve(__dirname, "..", "public", "images", `orange-divider-${name}.png`);
  await sharp(Buffer.from(colored))
    .resize(800, 120, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(outPath);
  console.log("Created:", `orange-divider-${name}.png`);
}
