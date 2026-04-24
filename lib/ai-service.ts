'use client';

import { Suggestion } from '../hooks/useSocket';
import { useApiKey } from '../hooks/useApiKey';

const API_BASE = '/api';

export interface AnalysisResult {
  suggestions: Suggestion[];
  readme: string;
  language: string;
}

const LANGUAGE_EXTENSIONS: Record<string, string> = {
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.py': 'python',
  '.java': 'java',
  '.cpp': 'cpp',
  '.c': 'c',
  '.go': 'go',
  '.rs': 'rust',
  '.rb': 'ruby',
  '.php': 'php',
  '.cs': 'csharp',
  '.swift': 'swift',
  '.kt': 'kotlin',
  '.scala': 'scala',
  '.html': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.json': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.md': 'markdown',
  '.sql': 'sql',
  '.sh': 'bash',
  '.bash': 'bash',
};

export function detectLanguage(code: string, filename?: string): string {
  if (filename) {
    const ext = filename.substring(filename.lastIndexOf('.'));
    if (LANGUAGE_EXTENSIONS[ext.toLowerCase()]) {
      return LANGUAGE_EXTENSIONS[ext.toLowerCase()];
    }
  }

  const patterns: Record<string, RegExp[]> = {
    typescript: [/:\s*(string|number|boolean|any|void|never)\s*[=;,)]/],
    python: [/^\s*(def|class|import|from|if __name__|print\(|async def)/m],
    java: [/^\s*(public|private|protected)\s+(static\s+)?(class|void|int|String)/m],
    go: [/^\s*package\s+\w+|func\s+\w+\(|:=|go\s+func/m],
    rust: [/^\s*(fn|let\s+mut|impl|struct|enum|pub|use)\s/m],
    ruby: [/^\s*(def|class|module|end|require|attr_)/m],
    php: [/<\?php|\\$\w+\s*=|function\s+\w+\s*\(/m],
    csharp: [/^\s*(using|namespace|public|private|class)\s/m],
    swift: [/^\s*(func|var|let|struct|class|import\s+Foundation)/m],
    cpp: [/^\s*#include|std::|cout|cin|malloc/m],
  };

  for (const [lang, regexps] of Object.entries(patterns)) {
    for (const regexp of regexps) {
      if (regexp.test(code)) {
        return lang;
      }
    }
  }

  return 'javascript';
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export async function analyzeCode(code: string, language?: string, apiKey?: string): Promise<AnalysisResult> {
  const detectedLang = language || detectLanguage(code);

  try {
    const response = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language: detectedLang, apiKey }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Analysis error:', error);
    return {
      suggestions: [],
      readme: error instanceof Error ? error.message : 'Analysis service unavailable.',
      language: detectedLang,
    };
  }
}

export async function generateFix(code: string, issue: string, language: string, apiKey?: string): Promise<string> {
  try {
    const response = await fetch(`${API_BASE}/fix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, issue, language, apiKey }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();
    return data.fixedCode || code;
  } catch (error) {
    console.error('Fix generation error:', error);
    return code;
  }
}

export async function importFromGitHub(url: string): Promise<string> {
  const rawUrl = url
    .replace('github.com', 'raw.githubusercontent.com')
    .replace('/blob/', '/');

  try {
    const response = await fetch(rawUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.error('GitHub import error:', error);
    throw error;
  }
}