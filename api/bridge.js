export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "POST 요청만 사용할 수 있어." });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return response.status(500).json({
      error: "GEMINI_API_KEY가 아직 설정되지 않았어."
    });
  }

  const { question, answerLanguage = "Korean" } = request.body || {};

  if (!question || typeof question !== "string") {
    return response.status(400).json({ error: "질문이 비어 있어." });
  }

  const now = new Date();
  const currentDateKorea = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  }).format(now);

  const prompt = `
You are Language Bridge AI.

Current date in Korea: ${currentDateKorea}.
Use this date as authoritative for all date-related reasoning.
Do not claim this date is impossible because of your training cutoff.

The user may write in any language.
Your job is to:
1. Detect the user's input language.
2. Rewrite the user's question into clear, natural, precise English.
3. Answer based on the English version of the question.
4. Return the final answer in ${answerLanguage}.
5. If the question depends on current facts, recent events, laws, prices, schedules, software versions, or market data, use Google Search grounding.
6. Clearly say when something is uncertain.
7. Explain English-language concepts that may be easy for a non-native English speaker to misunderstand.

Return strict JSON only.
Do not wrap it in markdown.
Do not include commentary outside JSON.

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
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro:generateContent?key=${apiKey}`,
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

    const cleaned = text
      .replace(/^```json/i, "")
      .replace(/^```/, "")
      .replace(/```$/, "")
      .trim();

    let parsed;

try {
  parsed = JSON.parse(cleaned);
} catch {
  return response.status(200).json({
    englishQuestion: "Gemini returned an answer, but it was not valid JSON.",
    finalAnswer: cleaned
  });
}

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