import { PDFDocument } from 'pdf-lib';

/**
 * Optimizes a PDF buffer:
 * - Compresses object streams
 * - Cleans unreferenced objects and unused metadata
 * - Ensures fast, lightweight loading
 * @param {Buffer} buffer 
 * @returns {Promise<Buffer>}
 */
export async function optimizePdfBuffer(buffer) {
  if (!buffer || buffer.length === 0) return buffer;

  try {
    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });

    // Clear bloated or redundant metadata
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer('Fix IT Portal');
    pdfDoc.setCreator('Fix IT Portal');

    // Save with compressed object streams (Flate compression)
    const optimizedBytes = await pdfDoc.save({ useObjectStreams: true });
    const optimizedBuffer = Buffer.from(optimizedBytes);

    if (optimizedBuffer.length < buffer.length) {
      const savedPercent = ((1 - optimizedBuffer.length / buffer.length) * 100).toFixed(1);
      console.log(`[PDF Optimizer] Reduced size from ${(buffer.length / 1024).toFixed(1)}KB to ${(optimizedBuffer.length / 1024).toFixed(1)}KB (saved ${savedPercent}%)`);
      return optimizedBuffer;
    }

    return buffer;
  } catch (err) {
    console.warn('[PDF Optimizer] Optimization skipped (using original):', err.message);
    return buffer;
  }
}
