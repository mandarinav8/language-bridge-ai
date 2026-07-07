export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "POST 요청만 사용할 수 있어." });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return response.status(500).json({
      error: "GEMINI_API_KEY가 아직 설정되지 않았어. Vercel 환경 변수에 API 키를 넣어야 해."
    });
  }

  const { question, answerLanguage = "Korean" } = request.body || {};

  if (!question || typeof question !== "string") {
    return response.status(400).json({ error: "질문이 비어 있어." });
  }

const today = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Seoul' });

const prompt = `
CRITICAL INSTRUCTION: The current date is ${today}. You must base all your answers on this current date. Never state that your knowledge is limited to 2023 or any past year.

Return your answer as strict JSON only.
Do not wrap it in markdown.
Do not include extra commentary outside JSON.

JSON shape:
{
  "englishQuestion": "...",
  "finalAnswer": "..."
}

User question:
${question}
`;

  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      }
    );

    const geminiData = await geminiResponse.json();

    if (!geminiResponse.ok) {
      return response.status(geminiResponse.status).json({
        error: geminiData.error?.message || "Gemini API 요청에 실패했어."
      });
    }

    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return response.status(502).json({
        error: "Gemini가 빈 답변을 보냈어."
      });
    }

    const parsed = JSON.parse(text);

    return response.status(200).json({
      englishQuestion: parsed.englishQuestion || "",
      finalAnswer: parsed.finalAnswer || ""
    });
  } catch (error) {
    return response.status(500).json({
      error: error.message || "서버에서 문제가 생겼어."
    });
  }
}