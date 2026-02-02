#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { Resvg } from '@resvg/resvg-js';
import { glob } from 'glob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Frame configurations
const FRAMES = {
  iphone: {
    templatePath: path.join(__dirname, 'frames', 'iphone.svg'),
    screenWidth: 710,
    screenHeight: 1536,
    canvasWidth: 750,
    canvasHeight: 1576,
  },
  ipad: {
    templatePath: path.join(__dirname, 'frames', 'ipad.svg'),
    screenWidth: 1024,
    screenHeight: 1366,
    canvasWidth: 1060,
    canvasHeight: 1400,
  },
};

/**
 * Resize screenshot to fit the frame's screen dimensions
 */
async function prepareScreenshot(inputPath, targetWidth, targetHeight) {
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  
  console.log(`  Original size: ${metadata.width}×${metadata.height}`);
  
  // Resize to fit screen dimensions (cover mode - may crop edges)
  const resized = await image
    .resize(targetWidth, targetHeight, {
      fit: 'cover',
      position: 'center',
    })
    .png()
    .toBuffer();
  
  // Convert to base64 data URI
  const base64 = resized.toString('base64');
  return `data:image/png;base64,${base64}`;
}

/**
 * Generate framed screenshot
 */
async function generateFramedScreenshot(inputPath, outputPath, frameType = 'iphone') {
  const frame = FRAMES[frameType];
  if (!frame) {
    throw new Error(`Unknown frame type: ${frameType}. Available: ${Object.keys(FRAMES).join(', ')}`);
  }

  console.log(`Processing: ${path.basename(inputPath)}`);
  
  // Load SVG template
  const svgTemplate = await fs.readFile(frame.templatePath, 'utf-8');
  
  // Prepare screenshot (resize and convert to base64)
  const screenshotDataUri = await prepareScreenshot(
    inputPath,
    frame.screenWidth,
    frame.screenHeight
  );
  
  // Inject screenshot into SVG
  const svgWithScreenshot = svgTemplate.replace('{{SCREENSHOT_DATA}}', screenshotDataUri);
  
  // Render SVG to PNG
  const resvg = new Resvg(svgWithScreenshot, {
    fitTo: {
      mode: 'width',
      value: frame.canvasWidth,
    },
  });
  
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  
  // Write output
  await fs.writeFile(outputPath, pngBuffer);
  console.log(`  → Saved: ${outputPath}`);
  console.log(`  Output size: ${frame.canvasWidth}×${frame.canvasHeight}`);
}

/**
 * Process multiple screenshots
 */
async function processScreenshots(inputPattern, outputDir, frameType) {
  // Find matching files
  const files = await glob(inputPattern, { 
    nodir: true,
    absolute: true,
    windowsPathsNoEscape: true
  });
  
  if (files.length === 0) {
    // Check if the input is already a single file (shell expanded the glob)
    try {
      await fs.access(inputPattern);
      // It's a single file that exists
      files.push(inputPattern);
    } catch {
      console.error(`No files found matching: ${inputPattern}`);
      process.exit(1);
    }
  }

  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  console.log(`Found ${files.length} screenshot(s)\n`);

  for (const inputPath of files) {
    const basename = path.basename(inputPath, path.extname(inputPath));
    const outputPath = path.join(outputDir, `${basename}-framed.png`);
    
    try {
      await generateFramedScreenshot(inputPath, outputPath, frameType);
      console.log('');
    } catch (err) {
      console.error(`  Error processing ${inputPath}: ${err.message}`);
    }
  }

  console.log('Done!');
}

// CLI
function printUsage() {
  console.log(`
framemaker - Add device frames to app screenshots

Usage:
  framemaker <input> [output-dir] [--frame=<type>]

Arguments:
  input       Screenshot file or glob pattern (e.g., "screenshots/*.png")
  output-dir  Output directory (default: ./framed)
  --frame     Frame type: iphone, ipad (default: iphone)

Examples:
  framemaker screenshot.png
  framemaker "screenshots/*.png" ./output
  framemaker iphone-shot.png --frame=iphone
  framemaker ipad-shot.png --frame=ipad

Notes:
  - Screenshots are automatically resized to fit the frame
  - Output files are named <original>-framed.png
`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  // Parse arguments
  let inputPattern = args[0];
  let outputDir = './framed';
  let frameType = 'iphone';

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--frame=')) {
      frameType = arg.split('=')[1];
    } else if (!arg.startsWith('--')) {
      outputDir = arg;
    }
  }

  await processScreenshots(inputPattern, outputDir, frameType);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
