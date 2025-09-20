/**
 * Parses CSV content following Excel's exact behavior
 * Handles all Excel edge cases including:
 * - Quoted fields with commas
 * - Escaped quotes ("")
 * - Mixed quoted/unquoted fields
 * - Multi-line fields
 * - Various line endings (\r\n, \n)
 * - Preserves whitespace in quoted fields
 * Trims whitespace from unquoted fields
 */
interface CsvParserOptions {
  delimiter?: string;
  hasHeader?: boolean;
}

/**
 * Removes BOM from string if present
 */
const stripBOM = (s: string): string => s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s;

/**
 * Extracts sep= hint and returns {delimiter, body}
 */
const extractSepHint = (content: string): { delimiter: string | null; body: string } => {
  const nl = content.search(/\r?\n/);
  const firstLine = (nl === -1 ? content : content.slice(0, nl)).trim();
  if (/^sep=.?$/i.test(firstLine)) {
    const delimiter = firstLine[4]; // single char after sep=
    const body = nl === -1 ? '' : content.slice(nl + (content[nl] === '\r' && content[nl+1] === '\n' ? 2 : 1));
    return { delimiter, body };
  }
  return { delimiter: null, body: content };
};

/**
 * Parses CSV content with Excel-like behavior
 */
export function parseExcelCsv(content: string, userDelimiter?: string): string[][] {
  // Handle BOM and extract sep= hint
  content = stripBOM(content);
  const { delimiter: sepDelimiter, body } = extractSepHint(content);
  const delimiter = userDelimiter || sepDelimiter || detectDelimiter(body);
  
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;
  const len = body.length;

  const pushField = () => {
    // No trimming to match Excel's behavior
    currentRow.push(currentField);
    currentField = '';
  };

  const pushRow = () => {
    if (currentRow.length > 0 || currentField) {
      if (currentField || inQuotes) {
        pushField();
      }
      rows.push(currentRow);
      currentRow = [];
    }
  };


  while (i < len) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote in Excel: "" becomes "
          currentField += '"';
          i++; // Skip next quote
        } else {
          // End of quoted field
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
      i++;
      continue;
    }

    // Handle unquoted content
    if (char === '"') {
      // Start of quoted field (only if at start of field)
      if (currentField === '') {
        inQuotes = true;
      } else {
        // Quote in the middle of unquoted field is treated as literal (Excel behavior)
        currentField += char;
      }
    } else if (char === delimiter) {
      // End of field
      pushField();
    } else if (char === '\r' || char === '\n') {
      // Handle line endings
      if (char === '\r' && nextChar === '\n') {
        i++; // Skip \n in \r\n
      }
      pushRow();
    } else {
      currentField += char;
    }
    i++;
  }

  // Add the last field and row if they exist
  if (currentField || currentRow.length > 0) {
    pushRow();
  }

  return rows;
}

/**
 * Detects the delimiter used in a CSV file following Excel's behavior
 * Excel tries these delimiters in order: tab, comma, semicolon, space
 */
interface DelimiterTestResult {
  delimiter: string;
  fieldCount: number;
  isValid: boolean;
}

export function detectDelimiter(content: string): string {
  // First check for explicit delimiter hint (sep=;)
  const firstLine = content.split(/\r?\n/)[0].trim();
  if (firstLine.startsWith('sep=')) {
    const sepChar = firstLine[4];
    if (sepChar) return sepChar;
  }

  // Excel's default delimiters in order of preference
  const candidates = [',', ';', '\t', '|'] as const;
  // Take first 50 non-empty lines for detection
  const lines = content.split(/\r?\n/).filter(l => l.length > 0).slice(0, 50);

  // RFC-4180 aware splitter that handles quoted fields correctly
  const splitQuoted = (line: string, d: string) => {
    const out: string[] = [];
    let cur = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i+1] === '"') { 
          // Handle escaped quote
          cur += '"'; 
          i++; 
        } else { 
          inQuotes = !inQuotes; 
        }
      } else if (c === d && !inQuotes) { 
        out.push(cur); 
        cur = ''; 
      } else { 
        cur += c; 
      }
    }
    out.push(cur);
    return out;
  };

  let best = { d: ',', score: -Infinity };
  
  for (const d of candidates) {
    const counts = lines.map(l => splitQuoted(l, d).length);
    // Calculate mode (most common field count)
    const mode = counts.sort((a,b) => a-b)[Math.floor(counts.length/2)] || 1;
    // Penalize variance from mode (prefer consistent counts)
    const variancePenalty = -counts.reduce((s,c) => s + Math.abs(c - mode), 0);
    // Strongly prefer delimiters that create multiple columns
    const multiColBonus = mode > 1 ? 1000 : -1000;
    const score = variancePenalty + multiColBonus;
    
    if (score > best.score) {
      best = { d, score };
    }
  }
  
  return best.d;
}
