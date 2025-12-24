import fs from "fs";
import path from "path";
import sharp from "sharp";

async function main() {
  const projectRoot = process.cwd();
  const publicDir = path.join(projectRoot, "public");
  const iconsDir = path.join(publicDir, "icons");
  const source = path.join(publicDir, "vortexpcs-logo.png");

  if (!fs.existsSync(source)) {
    console.error("Source logo not found:", source);
    process.exit(1);
  }
  if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

  const sizes = [16, 32, 180, 192, 512];
  for (const size of sizes) {
    const out = path.join(iconsDir, `icon-${size}.png`);
    await sharp(source)
      .resize(size, size, {
        fit: "cover",
        position: "centre",
        withoutEnlargement: false,
      })
      .png({ compressionLevel: 9 })
      .toFile(out);
    console.log("Generated:", out);
  }
  console.log("All icons generated in:", iconsDir);
}

main().catch((err) => {
  console.error("Icon generation failed:", err);
  process.exit(1);
});
