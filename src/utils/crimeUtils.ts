import { isValid, parseISO, format, getYear, parse } from 'date-fns';
import { CrimeCategory } from "../types";

/**
 * Robustly parses a date string into a Date object.
 * Handles various formats common in Indian crime records.
 */
export function flexibleParseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  const s = String(dateStr).trim();
  if (!s) return null;

  // Try ISO first
  let date = parseISO(s);
  if (isValid(date)) return date;

  // Try common formats
  const formats = [
    'yyyy-MM-dd HH:mm:ss',
    'yyyy-MM-dd HH:mm:ss.SSSSSSX',
    'dd-MM-yyyy HH:mm:ss',
    'dd/MM/yyyy HH:mm:ss',
    'dd-MM-yyyy HH:mm',
    'dd/MM/yyyy HH:mm',
    'yyyy-MM-dd',
    'dd-MM-yyyy',
    'dd/MM/yyyy',
    'dd.MM.yyyy',
    'yyyy/MM/dd',
    'yyyy.MM.dd',
    'MM-dd-yyyy',
    'MM/dd/yyyy',
    'MM.dd.yyyy',
    'dd MMM yyyy',
    'dd MMMM yyyy',
    'yyyy-MM-dd\'T\'HH:mm',
    'yyyy-MM-dd\'T\'HH:mm:ss',
    'dd-MM-yy',
    'dd/MM/yy',
    'dd.MM.yy',
    'MM-dd-yy',
    'MM/dd/yy',
    'MM.dd.yy'
  ];

  for (const fmt of formats) {
    try {
      const parsed = parse(s, fmt, new Date());
      if (isValid(parsed)) return parsed;
    } catch (e) {
      // Continue to next format
    }
  }

  // Last resort: native Date constructor
  const native = new Date(s);
  if (isValid(native)) return native;

  return null;
}

/**
 * Maps IPC and BNS sections to crime categories.
 */
export function categorizeCrime(sections: string, year?: number): CrimeCategory {
  const s = sections.toLowerCase();
  const isBNS = s.includes('bns') || (year !== undefined && year >= 2025);
  const isIPC = s.includes('ipc') || (year !== undefined && year < 2024);
  
  // 1. Murder: IPC 302, BNS 103
  if (s.includes('murder')) return 'Murder';
  
  if (isBNS && !s.includes('ipc')) {
    if (/\b103\b/.test(s)) return 'Murder';
  } else if (isIPC && !s.includes('bns')) {
    if (/\b302\b/.test(s)) return 'Murder';
  } else {
    // If ambiguous or no law specified, check both
    // But if it's 2025 and they wrote 302, it's likely snatching (Theft)
    if (year !== undefined && year >= 2025 && /\b302\b/.test(s)) {
      // Fall through to theft
    } else if (/\b(103|302)\b/.test(s)) {
      return 'Murder';
    }
  }
  
  // 2. Culpable Homicide: IPC 304, BNS 105
  if (s.includes('homicide')) return 'Culpable Homicide';
  if (isBNS) {
    if (/\b105\b/.test(s)) return 'Culpable Homicide';
  } else {
    if (/\b304\b/.test(s)) return 'Culpable Homicide';
  }

  // 4. Dacoity: IPC 395, 396, BNS 310(2), 311
  if (s.includes('dacoity')) return 'Dacoity';
  if (isBNS) {
    if (/\b311\b/.test(s) || s.includes('310(2)')) return 'Dacoity';
  } else {
    if (/\b(395|396)\b/.test(s)) return 'Dacoity';
  }
  
  // 3. Robbery: IPC 392, 394, BNS 309, 310
  if (s.includes('robbery') || s.includes('loot')) return 'Robbery';
  if (isBNS) {
    if (/\b(309|310)\b/.test(s)) return 'Robbery';
  } else {
    if (/\b(392|394)\b/.test(s)) return 'Robbery';
  }
  
  // 5. Extortion: IPC 384, BNS 308
  if (s.includes('extortion')) return 'Extortion';
  if (isBNS) {
    if (/\b308\b/.test(s)) return 'Extortion';
  } else {
    if (/\b384\b/.test(s)) return 'Extortion';
  }

  // 6. Kidnapping for Ransom: IPC 364A, BNS 140
  if (s.includes('ransom') || s.includes('kidnap')) return 'Ransom';
  if (isBNS) {
    if (/\b140\b/.test(s)) return 'Ransom';
  } else {
    if (/\b364a\b/.test(s)) return 'Ransom';
  }
  
  // 7. Theft: IPC 379, BNS 303
  if (s.includes('theft')) return 'Theft';
  if (isBNS) {
    if (/\b303\b/.test(s)) return 'Theft';
    if (/\b302\b/.test(s)) return 'Theft'; // Snatching (BNS 302)
  } else {
    if (/\b379\b/.test(s)) return 'Theft';
  }

  // Assault fallback
  if (/\b(323|324|354|115|74)\b/i.test(s) || s.includes('assault')) {
    return 'Assault';
  }

  // Fraud fallback
  if (/\b(420|318)\b/i.test(s) || s.includes('fraud') || s.includes('cheating')) {
    return 'Fraud';
  }

  return 'Other';
}
