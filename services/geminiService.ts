const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface GenerateVariationsParams {
  baseText: string;
  count: number;
  language: 'id' | 'en';
  tone: 'casual' | 'formal' | 'slang';
}

export async function generateVariations(params: GenerateVariationsParams): Promise<string[]> {
  const { baseText, count, language, tone } = params;

  const langLabel = language === 'id' ? 'Bahasa Indonesia' : 'English';
  const toneDesc: Record<string, string> = {
    casual: 'santai dan natural, seperti chat biasa antar teman',
    formal: 'sopan dan formal, seperti chat profesional',
    slang: 'gaul, pakai bahasa slang/singkatan anak muda',
  };

  const prompt = `Kamu adalah generator variasi kalimat untuk DM (Direct Message) media sosial.

Tugas: Buatkan ${count} variasi kalimat DM yang maknanya sama atau mirip dengan "${baseText}".

Aturan:
- Bahasa: ${langLabel}
- Gaya bahasa: ${toneDesc[tone]}
- Setiap variasi harus berbeda satu sama lain (jangan ada yang sama persis)
- Panjang kalimat bervariasi (ada yang pendek, ada yang lebih panjang)
- Boleh pakai emoji tapi jangan berlebihan (1-2 emoji per kalimat, atau tanpa emoji)
- Kalimat harus terdengar natural seperti pesan DM asli dari orang sungguhan
- Jangan beri nomor atau bullet point

PENTING: Balas HANYA dalam format JSON array of strings, tanpa penjelasan apapun.
Contoh format: ["variasi 1", "variasi 2", "variasi 3"]`;

  let response;
  let retries = 3;
  let delay = 2000; // 2 seconds

  while (retries > 0) {
    response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 1.0,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (response.ok) {
      break;
    }

    if (response.status === 429) {
      console.warn(`Gemini API 429 error. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      retries--;
      delay *= 2; // Exponential backoff
    } else {
      const errorBody = await response.text();
      console.error('Gemini API error:', errorBody);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }
  }

  if (!response || !response.ok) {
    throw new Error(`Gemini API error: Failed after retries (429 Too Many Requests)`);
  }

  const data = await response.json();

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('No response from Gemini API');
  }

  // Extract JSON array from the response (handle markdown code blocks)
  let cleanedText = text.trim();
  // Remove markdown code block wrapper if present
  if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  try {
    const parsed = JSON.parse(cleanedText);
    if (Array.isArray(parsed) && parsed.every((item: unknown) => typeof item === 'string')) {
      return parsed.slice(0, count);
    }
    throw new Error('Response is not a string array');
  } catch (e) {
    console.error('Failed to parse Gemini response:', cleanedText);
    // Fallback: try to extract strings manually from the text
    const matches = cleanedText.match(/"([^"]+)"/g);
    if (matches && matches.length > 0) {
      return matches.map((m: string) => m.replace(/"/g, '')).slice(0, count);
    }
    throw new Error('Could not parse AI response into messages');
  }
}
