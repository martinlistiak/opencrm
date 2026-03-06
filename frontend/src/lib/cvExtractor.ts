import { createWorker } from 'tesseract.js';
import { getDocument, GlobalWorkerOptions, version as pdfjsVersion } from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';

GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;

export interface ExtractionProgress {
  stage: 'loading' | 'extracting_text' | 'ocr_processing' | 'parsing';
  progress: number;
  message: string;
}

export interface ExtractionResult {
  text: string;
  /** Name detected from the largest-font text line in the PDF layout. */
  nameFromLayout?: string;
}

type ProgressCallback = (progress: ExtractionProgress) => void;

// -------------------------------------------------------------------
// PDF line reconstruction
// -------------------------------------------------------------------

interface LayoutLine {
  text: string;
  y: number;
  maxHeight: number;
}

/**
 * Joins text fragments from a PDF line, avoiding spurious spaces inside
 * URLs and email addresses where PDF renderers may split tokens at
 * hyphens, slashes, or dots.
 */
function joinTextFragments(fragments: string[]): string {
  if (fragments.length === 0) return '';
  let result = fragments[0];
  for (let i = 1; i < fragments.length; i++) {
    const prev = result;
    const next = fragments[i];
    const needsNoSpace =
      prev.endsWith('/') ||
      prev.endsWith('-') ||
      prev.endsWith('.') ||
      prev.endsWith('@') ||
      next.startsWith('/') ||
      next.startsWith('-') ||
      next.startsWith('.') ||
      next.startsWith('@');
    result += needsNoSpace ? next : ` ${next}`;
  }
  return result;
}

/**
 * Groups raw PDF text items into lines based on their Y coordinate.
 * Items that share approximately the same Y are merged into a single line
 * and sorted left-to-right by X.
 */
function groupIntoLines(items: unknown[]): LayoutLine[] {
  const textItems = (items as TextItem[]).filter(
    (item) => 'str' in item && item.str.trim().length > 0,
  );

  if (textItems.length === 0) return [];

  // Sort: Y descending (PDF coords go upward), then X ascending
  const sorted = [...textItems].sort((a, b) => {
    const yA = a.transform[5];
    const yB = b.transform[5];
    const yDiff = yB - yA;
    // Use a relative threshold so different font sizes don't collapse
    const avgH = (a.height + b.height) / 2 || 6;
    if (Math.abs(yDiff) > avgH * 0.45) return yDiff;
    return a.transform[4] - b.transform[4];
  });

  const lines: Array<{ texts: string[]; y: number; maxHeight: number }> = [];
  let current = {
    texts: [sorted[0].str],
    y: sorted[0].transform[5],
    maxHeight: sorted[0].height,
  };

  for (let i = 1; i < sorted.length; i++) {
    const item = sorted[i];
    const y = item.transform[5];
    const avgH = (current.maxHeight + item.height) / 2 || 6;
    const threshold = Math.max(avgH * 0.45, 2);

    if (Math.abs(y - current.y) > threshold) {
      lines.push({ ...current });
      current = { texts: [item.str], y, maxHeight: item.height };
    } else {
      current.texts.push(item.str);
      current.maxHeight = Math.max(current.maxHeight, item.height);
    }
  }
  lines.push(current);

  return lines.map((l) => ({
    text: joinTextFragments(l.texts).trim(),
    y: l.y,
    maxHeight: l.maxHeight,
  }));
}

/**
 * Finds the person's name by picking the non-trivial line rendered in
 * the largest font. LinkedIn PDFs always render the name in the biggest
 * font on the page, so this is very reliable for that format.
 */
function detectNameFromLayout(allLines: LayoutLine[]): string | undefined {
  if (allLines.length === 0) return undefined;

  // Compute median height to filter out decoration / page-number noise
  const heights = allLines.map((l) => l.maxHeight).sort((a, b) => a - b);
  const medianHeight = heights[Math.floor(heights.length / 2)] || 10;

  let bestLine: string | undefined;
  let bestHeight = 0;

  for (const line of allLines) {
    // Must be noticeably larger than the median body text
    if (line.maxHeight <= medianHeight * 1.3) continue;

    // Skip empty or too-long lines (headings, not names)
    const trimmed = line.text.trim();
    if (trimmed.length < 3 || trimmed.length > 60) continue;

    // A name should be 2-4 words
    const words = trimmed.split(/\s+/);
    if (words.length < 2 || words.length > 5) continue;

    // Skip lines that look like section headings or URLs
    if (/^(contact|experience|education|summary|skills|languages|certifications|honors|projects)/i.test(trimmed)) continue;
    if (trimmed.includes('@') || trimmed.includes('http') || trimmed.includes('www.')) continue;

    if (line.maxHeight > bestHeight) {
      bestHeight = line.maxHeight;
      bestLine = trimmed;
    }
  }

  return bestLine;
}

// -------------------------------------------------------------------
// PDF extraction
// -------------------------------------------------------------------

async function extractTextFromPdf(
  file: File,
  onProgress?: ProgressCallback,
): Promise<ExtractionResult> {
  onProgress?.({
    stage: 'loading',
    progress: 10,
    message: 'Loading PDF...',
  });

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;

  const pageTexts: string[] = [];
  const allLayoutLines: LayoutLine[] = [];
  const numPages = pdf.numPages;

  onProgress?.({
    stage: 'extracting_text',
    progress: 20,
    message: 'Extracting text from PDF...',
  });

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();

    const lines = groupIntoLines(textContent.items);
    allLayoutLines.push(...lines);

    const pageText = lines.map((l) => l.text).join('\n');
    pageTexts.push(pageText);

    onProgress?.({
      stage: 'extracting_text',
      progress: 20 + (60 * i) / numPages,
      message: `Extracting text from page ${i}/${numPages}...`,
    });
  }

  const fullText = pageTexts.join('\n\n');
  const nameFromLayout = detectNameFromLayout(allLayoutLines);

  // If we got meaningful text, use it (no OCR needed)
  if (fullText.trim().length > 50) {
    onProgress?.({
      stage: 'parsing',
      progress: 95,
      message: 'Text extracted successfully',
    });
    return { text: fullText, nameFromLayout };
  }

  // Scanned PDF with no text layer — fall back to OCR
  onProgress?.({
    stage: 'ocr_processing',
    progress: 30,
    message: 'Scanned PDF detected, starting OCR...',
  });

  const ocrText = await ocrFromPdf(pdf, numPages, onProgress);
  return { text: ocrText };
}

// -------------------------------------------------------------------
// OCR helpers
// -------------------------------------------------------------------

async function ocrFromPdf(
  pdf: Awaited<ReturnType<typeof getDocument>['promise']>,
  numPages: number,
  onProgress?: ProgressCallback,
): Promise<string> {
  const worker = await createWorker('eng');
  const textParts: string[] = [];
  const pagesToProcess = Math.min(numPages, 5);

  for (let i = 1; i <= pagesToProcess; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvas, viewport }).promise;

    const result = await worker.recognize(canvas);
    textParts.push(result.data.text);

    onProgress?.({
      stage: 'ocr_processing',
      progress: 30 + (55 * i) / pagesToProcess,
      message: `OCR processing page ${i}/${pagesToProcess}...`,
    });
  }

  await worker.terminate();

  return textParts.join('\n');
}

async function extractTextFromImage(
  file: File,
  onProgress?: ProgressCallback,
): Promise<ExtractionResult> {
  onProgress?.({
    stage: 'ocr_processing',
    progress: 10,
    message: 'Starting OCR on image...',
  });

  const worker = await createWorker('eng', undefined, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        onProgress?.({
          stage: 'ocr_processing',
          progress: 10 + 80 * m.progress,
          message: `OCR: ${Math.round(m.progress * 100)}% complete`,
        });
      }
    },
  });

  const result = await worker.recognize(file);
  await worker.terminate();

  onProgress?.({
    stage: 'parsing',
    progress: 95,
    message: 'OCR complete, parsing text...',
  });

  return { text: result.data.text };
}

// -------------------------------------------------------------------
// Public API
// -------------------------------------------------------------------

export async function extractTextFromFile(
  file: File,
  onProgress?: ProgressCallback,
): Promise<ExtractionResult> {
  const type = file.type;
  const name = file.name.toLowerCase();

  if (type === 'application/pdf' || name.endsWith('.pdf')) {
    return extractTextFromPdf(file, onProgress);
  }

  if (
    type.startsWith('image/') ||
    /\.(jpg|jpeg|png|gif|bmp|tiff|webp)$/.test(name)
  ) {
    return extractTextFromImage(file, onProgress);
  }

  throw new Error(
    `Unsupported file type: ${type || name}. Please drop a PDF or image file.`,
  );
}
