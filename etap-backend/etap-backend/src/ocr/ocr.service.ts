import { Injectable, Logger } from '@nestjs/common';
import { createWorker } from 'tesseract.js';

export interface OcrExtractionResult {
  texteBrut: string;
  tauxConfiance: number; // 0-100
  champs: {
    numeroFacture?: string;
    referenceCompteur?: string;
    ancienIndex?: number;
    nouveauIndex?: number;
    montantHT?: number;
    totalTaxes?: number;
    montantTTC?: number;
    montantAPayer?: number;
    dateFacture?: string;
    dateEcheance?: string;
  };
}

/**
 * Runs Tesseract OCR (via tesseract.js — a WASM port of the real Tesseract
 * engine, no native binary install required) on a scanned STEG/SONEDE
 * invoice and extracts the fields our Facture model needs.
 *
 * IMPORTANT: the regex patterns below are a reasonable starting point based
 * on the invoice layouts already analyzed for this project, but real-world
 * OCR text is noisy — expect to tune these patterns against actual scanned
 * samples once you have a batch to test against. Confidence is a simple
 * heuristic (% of expected fields successfully matched), not Tesseract's
 * own per-word confidence — combine both once you're tuning this for real.
 */
@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  async extract(filePath: string): Promise<OcrExtractionResult> {
    const worker = await createWorker(['fra', 'ara']);
    try {
      const {
        data: { text },
      } = await worker.recognize(filePath);
      return this.parse(text);
    } catch (err) {
      this.logger.error(`OCR extraction failed: ${(err as Error).message}`);
      return { texteBrut: '', tauxConfiance: 0, champs: {} };
    } finally {
      await worker.terminate();
    }
  }

  private parse(text: string): OcrExtractionResult {
    const champs: OcrExtractionResult['champs'] = {};
    let matched = 0;
    const expected = 8;

    const numeroFactureMatch = text.match(
      /R[ée]f[ée]rence\s*:?\s*([0-9]{6,})/i,
    );
    if (numeroFactureMatch) {
      champs.numeroFacture = numeroFactureMatch[1];
      matched++;
    }

    const compteurMatch = text.match(
      /(?:N[°o]?\s*compteur|R[ée]f[ée]rence compteur)\s*:?\s*([0-9]{5,})/i,
    );
    if (compteurMatch) {
      champs.referenceCompteur = compteurMatch[1];
      matched++;
    }

    const indexMatch = text.match(
      /ancien\D{0,10}([0-9]+(?:[.,][0-9]+)?)\D{1,20}nouveau\D{0,10}([0-9]+(?:[.,][0-9]+)?)/i,
    );
    if (indexMatch) {
      champs.ancienIndex = parseFloat(indexMatch[1].replace(',', '.'));
      champs.nouveauIndex = parseFloat(indexMatch[2].replace(',', '.'));
      matched += 2;
    }

    const montantHTMatch = text.match(
      /(?:total\s*)?HT\s*:?\s*([0-9]+(?:[.,][0-9]+)?)/i,
    );
    if (montantHTMatch) {
      champs.montantHT = parseFloat(montantHTMatch[1].replace(',', '.'));
      matched++;
    }

    const taxesMatch = text.match(
      /(?:total\s*)?taxes?\s*:?\s*([0-9]+(?:[.,][0-9]+)?)/i,
    );
    if (taxesMatch) {
      champs.totalTaxes = parseFloat(taxesMatch[1].replace(',', '.'));
      matched++;
    }

    const ttcMatch = text.match(
      /(?:montant\s*)?TTC\s*:?\s*([0-9]+(?:[.,][0-9]+)?)/i,
    );
    if (ttcMatch) {
      champs.montantTTC = parseFloat(ttcMatch[1].replace(',', '.'));
      matched++;
    }

    const aPayerMatch = text.match(
      /(?:montant\s*[àa]\s*payer)\s*:?\s*([0-9]+(?:[.,][0-9]+)?)/i,
    );
    if (aPayerMatch) {
      champs.montantAPayer = parseFloat(aPayerMatch[1].replace(',', '.'));
      matched++;
    }

    const dateFactureMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateFactureMatch) {
      champs.dateFacture = dateFactureMatch[1];
      matched++;
    }

    const tauxConfiance = Math.round((matched / expected) * 100);

    return { texteBrut: text, tauxConfiance, champs };
  }
}
