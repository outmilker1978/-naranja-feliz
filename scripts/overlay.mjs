import sharp from 'sharp';
import fs from 'fs';

async function main() {
  const rawPath = 'docs/_raw_screenshot.png';
  
  if (!fs.existsSync(rawPath)) {
    console.error('Screenshot not found. Run Edge screenshot first.');
    process.exit(1);
  }
  
  const img = sharp(rawPath);
  const meta = await img.metadata();
  const w = meta.width;
  const h = meta.height;
  console.log(`Image: ${w}x${h}`);
  
  // Tools button: top-right of header area
  const hx = 1700, hy = 10, hw = 210, hh = 44;
  
  const svg = [
    `<svg width="${w}" height="${h}">`,
    '<defs><mask id="m">',
    `<rect width="${w}" height="${h}" fill="white"/>`,
    `<rect x="${hx}" y="${hy}" width="${hw}" height="${hh}" fill="black" rx="6"/>`,
    '</mask></defs>',
    `<rect width="${w}" height="${h}" fill="rgba(0,0,0,0.45)" mask="url(#m)"/>`,
    `<rect x="${hx-3}" y="${hy-3}" width="${hw+6}" height="${hh+6}" fill="none" stroke="#FFD93D" stroke-width="3" rx="8"/>`,
    `<path d="M${hx+hw+20} ${hy+hh+40} L${hx+hw+8} ${hy+hh+20} L${hx+hw+45} ${hy+hh+8}" fill="none" stroke="#FFD93D" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,
    `<polygon points="${hx+hw+45},${hy+hh+8} ${hx+hw+57},${hy+hh+20} ${hx+hw+33},${hy+hh-4}" fill="#FFD93D"/>`,
    `<text x="${hx+hw+55}" y="${hy+hh+10}" fill="#FFD93D" font-size="20" font-family="sans-serif" font-weight="bold">Инструментарий</text>`,
    '</svg>'
  ].join('\n');
  
  await sharp(rawPath)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toFile('docs/screenshot_tools.png');
  
  console.log('Done: docs/screenshot_tools.png');
}

main().catch(e => { console.error(e); process.exit(1); });
