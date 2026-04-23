import { NextRequest, NextResponse } from 'next/server';
import { VertexAI } from '@google-cloud/vertexai';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'byteblaster-348ea';
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

const vertex_ai = new VertexAI({ project: PROJECT_ID, location: LOCATION });
const model = 'gemini-2.0-flash-001';

interface Suggestion {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  line: number;
  issue: string;
  fix?: string;
  status: 'pending';
}

interface AnalysisResult {
  suggestions: Suggestion[];
  readme: string;
  language: string;
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
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

function detectLanguage(code: string, filename?: string): string {
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

export async function POST(request: NextRequest) {
  try {
    const { code, language, filename } = await request.json();
    const detectedLang = language || detectLanguage(code, filename);

    const prompt = `You are an expert code reviewer. Analyze the following ${detectedLang} code and identify security vulnerabilities, anti-patterns, code quality issues, and potential bugs.

Return your analysis as a JSON array with this exact structure:
[
  {
    "severity": "critical" | "warning" | "info",
    "line": <line_number>,
    "issue": "<brief description of the issue>",
    "fix": "<suggested fix or code improvement>"
  }
]

Guidelines:
- "critical": Security vulnerabilities, SQL injection, XSS, hardcoded secrets, null pointer risks
- "warning": Anti-patterns, performance issues, memory leaks, code smells
- "info": Code style, documentation improvements, minor optimizations

For each finding, specify the exact line number where the issue occurs.
If no issues found, return an empty array [].

Also, generate a comprehensive README section for documentation based on this code.

Code to analyze:
\`\`\`${detectedLang}
${code}
\`\`\`

Respond with a JSON object containing exactly these fields:
{
  "suggestions": [<array of issues as described above>],
  "readme": "<2-3 sentence description of what this code does for documentation>"
}

Do not include any other text - only valid JSON.`;

    const generativeModel = vertex_ai.preview.getGenerativeModel({
      model: model,
      generation_config: {
        temperature: 0.3,
        max_output_tokens: 4000,
      },
    });

    const result = await generativeModel.generateContent(prompt);
    const response = result.response;
    const content = response.candidates?.[0]?.content?.parts?.[0]?.text || '';

    let suggestions: Suggestion[] = [];
    let readme = 'Documentation generation failed.';

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        suggestions = (parsed.suggestions || []).map((s: any, index: number) => ({
          id: generateUUID(),
          severity: s.severity || 'info',
          line: s.line || index + 1,
          issue: s.issue || '',
          fix: s.fix || '',
          status: 'pending' as const,
        }));
        readme = parsed.readme || '';
      }
    } catch (parseError) {
      console.error('Failed to parse Vertex response:', parseError);
    }

    const resultData: AnalysisResult = {
      suggestions,
      readme,
      language: detectedLang,
    };

    return NextResponse.json(resultData);
  } catch (error) {
    console.error('Vertex AI analysis error:', error);
    return NextResponse.json(
      { error: 'Analysis service unavailable' },
      { status: 500 }
    );
  }
}