# FrameMaker

CLI tool to add realistic device frames to app screenshots for App Store submissions.

## Installation

```bash
git clone https://github.com/mfishmansd/FrameMaker.git
cd FrameMaker
npm install
npm link
```

## Usage

```bash
# iPhone screenshots (default)
framemaker screenshot.png
framemaker "screenshots/*.png"

# iPad screenshots
framemaker screenshot.png --frame=ipad

# Custom output directory
framemaker screenshot.png ./output
```

## Output

- Screenshots are automatically resized to fit the frame
- Output files are saved as `<original-name>-framed.png`
- Default output directory: `./framed`

## Supported Frames

| Frame | Output Size | Screen Size |
|-------|-------------|-------------|
| iPhone | 750×1576 | 710×1536 |
| iPad | 1060×1400 | 1024×1366 |

## Uninstall

```bash
npm unlink -g framemaker
```
