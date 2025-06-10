import { createCanvas, loadImage } from 'canvas';


async function createBlackImage(widthP, heightP) {
  const width = widthP;
  const height = heightP;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Fill entire canvas with black
  ctx.fillStyle = 'rgb(0,0,0)';
  ctx.fillRect(0, 0, width, height);

  return canvas;
}

export async function overlapTitle(inputImageBuffer, title) {
  try {
    const img = await loadImage(inputImageBuffer);
    const { width, height } = img;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    
    // Set font and style - using fallback fonts
    ctx.font = 'bold 34px Helvetica, Arial, sans-serif';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const x = width * 0.5;
    const y = height * 0.7;

    function wrapText(text, maxWidth) {
      const words = text.split(' ');
      let lines = [];
      let currentLine = words[0];
      for (let i = 1; i < words.length; i++) {
        const testLine = currentLine + ' ' + words[i];
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth) {
          lines.push(currentLine);
          currentLine = words[i];
        } else {
          currentLine = testLine;
        }
      }
      lines.push(currentLine);
      return lines;
    }

    const maxWidth = width * 0.8; // 80% of image width
    const lines = wrapText(title, maxWidth);

    // Draw each line at the calculated y position
    const lineHeight = 60;
    const padding = 15; // Add padding around text
    
    // Calculate rectangle dimensions
    const rectHeight = lines.length * lineHeight + (padding * 4);
    const rectY = y - (lines.length * lineHeight) - padding;
    
    // Draw rectangle FIRST (behind text)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, rectY, width, rectHeight);
    
    // Draw text
    ctx.fillStyle = 'rgba(0, 220, 255, 1)';
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], x, y - (lines.length - 1 - i) * lineHeight);
    }

    return canvas.toBuffer('image/png');

  } catch (error) {
    throw new Error(`Failed to overlay title on image: ${error.message}`);
  }
}

export async function overlayTextOnCanvas(
  inputImageBuffer,
  title,
  summary,
  {
    titleFontSize = 20,
    titleFontFamily = 'Helvetica, Arial, sans-serif',
    titleFontWeight = 'bold',
    titleColor = 'rgb(0, 191, 255)',
    summaryFontSize = 14,
    summaryFontFamily = 'Aptos, Arial,sans-serif, monospace',
    summaryFontWeight = 'semi-bold',
    summaryColor = 'rgb(195, 195, 195)',
    xRatio = 0.5,
    yRatio = 0.5,
    maxWidthRatio = 0.85,
    titleLineHeight = 40,
    summaryLineHeight = 30,
    gapBetweenTitleAndSummary = 30
  } = {}
) {
  try {
    // Load image from buffer
    const img = await loadImage(inputImageBuffer);

    let { width, height } = img;
    const targetAspectRatio = 9 / 16;
    const currentAspectRatio = width / height;
    
    // Create black image
    let blackImage = await createBlackImage(width, height);

    if (currentAspectRatio !== targetAspectRatio) {
      if (currentAspectRatio > targetAspectRatio) {
        // Image is wider than 9:16, crop width
        width = Math.round(height * targetAspectRatio);
      } else {
        // Image is taller than 9:16, crop height
        height = Math.round(width / targetAspectRatio);
      }
    }

    // Create canvas with 9:16 dimensions
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Draw image centered
    const offsetX = (img.width - width) / 2;
    const offsetY = (img.height - height) / 2;
    
    // Draw black background first, then crop the original image on top
    const blackCtx = blackImage.getContext('2d');
    ctx.drawImage(blackImage, offsetX, offsetY, width, height, 0, 0, width, height);

    // Text wrapping helper
    function wrapText(text, maxWidth, font) {
      ctx.font = font;
      const words = text.split(' ');
      let lines = [];
      let currentLine = words[0];
      for (let i = 1; i < words.length; i++) {
        const testLine = currentLine + ' ' + words[i];
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth) {
          lines.push(currentLine);
          currentLine = words[i];
        } else {
          currentLine = testLine;
        }
      }
      lines.push(currentLine);
      return lines;
    }

    // Calculate positions
    const x = width * xRatio;
    const maxWidth = width * maxWidthRatio;

    // Title styling and wrapping
    const titleFont = `${titleFontWeight} ${titleFontSize}px ${titleFontFamily}`;
    ctx.font = titleFont;
    ctx.fillStyle = titleColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const titleLines = wrapText(title, maxWidth, titleFont);
    const titleHeight = titleLines.length * titleLineHeight;

    // Summary styling and wrapping
    const summaryFont = `${summaryFontWeight} ${summaryFontSize}px ${summaryFontFamily}`;
    const summaryLines = wrapText(summary, maxWidth, summaryFont);
    const summaryHeight = summaryLines.length * summaryLineHeight;

    // Position calculations to avoid overlap
    const totalHeight = titleHeight + gapBetweenTitleAndSummary + summaryHeight;
    const startY = height * yRatio - totalHeight / 2 + titleLineHeight / 2;

    // Draw title
    ctx.font = titleFont;
    ctx.fillStyle = titleColor;
    for (let i = 0; i < titleLines.length; i++) {
      ctx.fillText(titleLines[i], x, startY + i * titleLineHeight);
    }

    // Draw summary below title with gap
    const summaryStartY = startY + titleHeight + gapBetweenTitleAndSummary;
    ctx.font = summaryFont;
    ctx.fillStyle = summaryColor;
    for (let i = 0; i < summaryLines.length; i++) {
      ctx.fillText(summaryLines[i], x, summaryStartY + i * summaryLineHeight);
    }
    
    // Return the canvas as a buffer
    return canvas.toBuffer('image/png');
    
  } catch (error) {
    throw new Error(`Failed to overlay text on black canvas: ${error.message}`);
  }
}