import { Product } from '../types';

export interface CSVParseResult {
  products: Product[];
  totalParsed: number;
  errors: string[];
}

/**
 * Robust CSV parser that handles quotes, custom delimiters (, or ; or \t) and maps headers.
 */
export function parseCSV(csvText: string): CSVParseResult {
  const products: Product[] = [];
  const errors: string[] = [];
  
  if (!csvText.trim()) {
    return { products, totalParsed: 0, errors: ['El archivo CSV está vacío'] };
  }

  // Split into lines and filter empty rows
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) {
    return { products, totalParsed: 0, errors: ['El archivo no contiene líneas'] };
  }

  // Auto-detect delimiter
  const firstLine = lines[0];
  let delimiter = ',';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;

  if (semicolonCount > commaCount && semicolonCount > tabCount) {
    delimiter = ';';
  } else if (tabCount > commaCount && tabCount > semicolonCount) {
    delimiter = '\t';
  }

  // Parse CSV line by line with simple state machine to handle quotes
  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const firstRowCells = parseLine(lines[0]).map(c => c.toLowerCase().replace(/["']/g, '').trim());
  
  // Detect if there's a header
  // Common headers are: cod, codigo, code, descrip, descripcion, un, um, uom, sku, articulo, etc.
  const headerKeywords = ['cod', 'codigo', 'código', 'desc', 'descrip', 'descripcion', 'descripción', 'sku', 'art', 'articulo', 'artículo', 'um', 'uom', 'un', 'unidad', 'medida'];
  
  const matchesKeyword = firstRowCells.some(cell => 
    headerKeywords.some(keyword => cell === keyword || cell.includes(keyword))
  );

  // If first cell of first row is purely numeric, or if we don't have header keywords, it's probably actual data!
  const firstCellIsNumber = /^\d+$/.test(firstRowCells[0] || '');
  const isHeader = matchesKeyword && !firstCellIsNumber;

  let codeIndex = -1;
  let descIndex = -1;
  let uomIndex = -1;

  if (isHeader) {
    codeIndex = firstRowCells.findIndex(h => h.includes('cod') || h.includes('id') || h.includes('sku') || h.includes('articulo_id') || h.includes('ref'));
    descIndex = firstRowCells.findIndex(h => h.includes('desc') || h.includes('art') || h.includes('nom') || h.includes('item'));
    uomIndex = firstRowCells.findIndex(h => h.includes('med') || h.includes('uom') || h.includes('uni') || h.includes('cant') || h.includes('um') || h === 'un');
  }

  // Fallbacks if indices are not found, or if there is no header row
  if (codeIndex === -1) codeIndex = 0;
  if (descIndex === -1) descIndex = 1 < firstRowCells.length ? 1 : 0;
  if (uomIndex === -1) uomIndex = 2 < firstRowCells.length ? 2 : -1;

  const startLineIndex = isHeader ? 1 : 0;

  for (let i = startLineIndex; i < lines.length; i++) {
    const line = lines[i];
    const cells = parseLine(line);
    if (cells.length === 0 || (cells.length === 1 && !cells[0])) continue;

    const code = cells[codeIndex]?.replace(/["']/g, '').trim() || '';
    const description = cells[descIndex]?.replace(/["']/g, '').trim() || '';
    let uom = uomIndex !== -1 && cells[uomIndex] ? cells[uomIndex].replace(/["']/g, '').trim() : 'UN';

    if (!code) {
      errors.push(`Línea ${i + 1}: Código de artículo ausente.`);
      continue;
    }
    if (!description) {
      errors.push(`Línea ${i + 1}: Descripción de artículo ausente para el código "${code}".`);
      continue;
    }

    products.push({
      code: code.toUpperCase(),
      description,
      uom: uom || 'UN',
      source: 'imported'
    });
  }

  return {
    products,
    totalParsed: products.length,
    errors: errors.slice(0, 100) // limit errors feedback to avoid crashing the view
  };
}
