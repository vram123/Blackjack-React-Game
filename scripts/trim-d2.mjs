/**
 * Crop away near-white matting around d2.png and write back to public/images/d2.png.
 * Re-run after replacing the asset: npm run trim-d2
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const target = path.join(root, "public/images/d2.png");
const tmp = path.join(root, "public/images/d2-trimmed.png");

const buf = await sharp(target)
  .ensureAlpha()
  .trim({
    background: "#ffffff",
    /** Higher = more aggressive removal of off-white fringe at edges */
    threshold: 95,
  })
  .png()
  .toBuffer();

fs.writeFileSync(tmp, buf);
fs.renameSync(tmp, target);
console.log("Trimmed d2.png OK");
