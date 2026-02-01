# Framemaker

CLI tool to add device frames to app screenshots for App Store submissions.

## Installation

```bash
npm install
```

## Usage

```bash
# Single file
node index.js screenshot.png

# Multiple files with glob
node index.js "screenshots/*.png"

# Specify output directory
node index.js screenshot.png ./output

# With frame type (default: iphone)
node index.js screenshot.png --frame=iphone
```

## Output

- Screenshots are automatically resized to fit the frame
- Output files are saved as `<original-name>-framed.png`
- Default output directory: `./framed`

## Frame Specs

### iPhone
- Screen size: 710×1536
- Output size: 890×1996
- Aspect ratio matches iPhone Pro/Pro Max

## Adding New Frames

1. Add SVG template to `frames/` directory
2. Use `{{SCREENSHOT_DATA}}` as placeholder for the screenshot
3. Add configuration to `FRAMES` object in `index.js`
