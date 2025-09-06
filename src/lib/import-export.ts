import type { Session, Player, Round, PlayerStats } from '../types';

export interface SessionExport {
  session: Session;
  players: Player[];
  rounds: Round[];
  stats: PlayerStats[];
  exportedAt: string;
  version: string;
}

export interface ImportResult<T> {
  success: T[];
  errors: string[];
  warnings: string[];
}

export interface PlayerImportData {
  name: string;
  tags?: string[];
}

// CSV parsing utilities
export const parseCSV = (csvText: string): string[][] => {
  const lines = csvText.split('\n').map(line => line.trim()).filter(line => line);
  const result: string[][] = [];
  
  for (const line of lines) {
    // Simple CSV parser - handles quoted fields
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < line.length) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i += 2;
        } else {
          // Toggle quotes
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        fields.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }
    
    fields.push(current.trim());
    result.push(fields);
  }
  
  return result;
};

// CSV import for players
export const importPlayersFromCSV = async (
  csvText: string,
  sessionId: string
): Promise<ImportResult<PlayerImportData>> => {
  const success: PlayerImportData[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    const rows = parseCSV(csvText);
    
    if (rows.length === 0) {
      errors.push('CSVファイルが空です');
      return { success, errors, warnings };
    }
    
    // Check if first row might be headers
    const hasHeaders = rows[0]?.some(cell => 
      cell.includes('名前') || cell.includes('name') || cell.includes('Name')
    );
    
    const dataRows = hasHeaders ? rows.slice(1) : rows;
    
    if (dataRows.length === 0) {
      errors.push('データ行が見つかりません');
      return { success, errors, warnings };
    }
    
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNum = hasHeaders ? i + 2 : i + 1;
      
      if (!row || row.length === 0 || (row.length === 1 && !row[0]?.trim())) {
        continue; // Skip empty rows
      }
      
      const name = row[0]?.trim();
      if (!name) {
        errors.push(`${rowNum}行目: 名前が入力されていません`);
        continue;
      }
      
      // Extract tags from remaining columns
      const tags = row.slice(1)
        .map(tag => tag?.trim())
        .filter(tag => tag && tag.length > 0);
      
      // Check for duplicates within the CSV
      const duplicate = success.find(p => p.name.toLowerCase() === name.toLowerCase());
      if (duplicate) {
        warnings.push(`${rowNum}行目: "${name}" は重複しています`);
        continue;
      }
      
      success.push({
        name,
        tags: tags.length > 0 ? tags : undefined,
      });
    }
    
  } catch (error) {
    errors.push(`CSV解析エラー: ${error instanceof Error ? error.message : '不明なエラー'}`);
  }
  
  return { success, errors, warnings };
};

// Session export to JSON
export const exportSessionToJSON = async (
  sessionId: string
): Promise<SessionExport> => {
  // This would normally fetch from the database
  // For now, we'll use placeholder data structure
  const exportData: SessionExport = {
    session: {} as Session, // Would be populated from actual session data
    players: [],
    rounds: [],
    stats: [],
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
  };
  
  return exportData;
};

// Generate CSV content from data
export const generateCSV = (data: any[], headers: string[]): string => {
  const escapeCSVField = (field: string): string => {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  };
  
  const rows = [
    headers.map(escapeCSVField).join(','),
    ...data.map(row => 
      headers.map(header => escapeCSVField(String(row[header] || ''))).join(',')
    )
  ];
  
  return rows.join('\n');
};

// File download utilities
export const downloadFile = (content: string, filename: string, mimeType: string = 'text/plain'): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

export const downloadJSON = (data: any, filename: string): void => {
  const content = JSON.stringify(data, null, 2);
  downloadFile(content, filename, 'application/json');
};

export const downloadCSV = (data: any[], headers: string[], filename: string): void => {
  const content = generateCSV(data, headers);
  downloadFile(content, filename, 'text/csv');
};

// Validation utilities
export const validatePlayerName = (name: string): string | null => {
  if (!name || !name.trim()) {
    return '名前を入力してください';
  }
  
  if (name.trim().length > 50) {
    return '名前は50文字以内で入力してください';
  }
  
  // Basic character validation (letters, numbers, spaces, common punctuation)
  if (!/^[a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\s\-_.()（）]+$/.test(name.trim())) {
    return '名前に使用できない文字が含まれています';
  }
  
  return null;
};

export const validateTag = (tag: string): string | null => {
  if (tag.length > 20) {
    return 'タグは20文字以内で入力してください';
  }
  
  // Basic character validation for tags
  if (!/^[a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\s\-_.()（）]*$/.test(tag)) {
    return 'タグに使用できない文字が含まれています';
  }
  
  return null;
};