import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-2.0-flash-001';

export async function POST(request: NextRequest) {
  const { code, issue, language, apiKey } = await request.json();
  
  const GEMINI_API_KEY = apiKey || process.env.GEMINI_API_KEY || '';
  
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'No API key provided. Please add your Gemini API key in settings.' },
      { status: 401 }
    );
  }

  try {
    const prompt = `You are an expert code reviewer. Generate a fixed version of the code that addresses this issue:

Issue: ${issue}

Original code:
\`\`\`${language}
${code}
\`\`\`

Provide only the fixed code, no explanations or markdown.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generation_config: {
            temperature: 0.2,
            max_output_tokens: 2000,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const codeMatch = content.match(/```[\s\S]*?```/);
    let fixedCode = content;
    if (codeMatch) {
      fixedCode = codeMatch[0].replace(/```\w*\n?|```/g, '').trim();
    }

    return NextResponse.json({ fixedCode });
  } catch (error) {
    console.error('Gemini AI fix generation error:', error);
    return NextResponse.json(
      { error: 'Fix generation failed', fixedCode: '' },
      { status: 500 }
    );
  }
}