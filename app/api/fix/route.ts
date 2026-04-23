import { NextRequest, NextResponse } from 'next/server';
import { VertexAI } from '@google-cloud/vertexai';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'byteblaster-348ea';
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

const vertex_ai = new VertexAI({ project: PROJECT_ID, location: LOCATION });
const model = 'gemini-2.0-flash-001';

export async function POST(request: NextRequest) {
  try {
    const { code, issue, language } = await request.json();

    const prompt = `You are an expert code reviewer. Generate a fixed version of the code that addresses this issue:

Issue: ${issue}

Original code:
\`\`\`${language}
${code}
\`\`\`

Provide only the fixed code, no explanations or markdown.`;

    const generativeModel = vertex_ai.preview.getGenerativeModel({
      model: model,
      generation_config: {
        temperature: 0.2,
        max_output_tokens: 2000,
      },
    });

    const result = await generativeModel.generateContent(prompt);
    const response = result.response;
    const content = response.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const codeMatch = content.match(/```[\s\S]*?```/);
    let fixedCode = content;
    if (codeMatch) {
      fixedCode = codeMatch[0].replace(/```\w*\n?|```/g, '').trim();
    }

    return NextResponse.json({ fixedCode });
  } catch (error) {
    console.error('Vertex AI fix generation error:', error);
    return NextResponse.json(
      { error: 'Fix generation failed', fixedCode: '' },
      { status: 500 }
    );
  }
}