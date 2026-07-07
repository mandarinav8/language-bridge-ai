const questionInput = document.querySelector("#question");
const answerLanguage = document.querySelector("#answerLanguage");
const askButton = document.querySelector("#askButton");
const statusText = document.querySelector("#status");
const englishQuestion = document.querySelector("#englishQuestion");
const finalAnswer = document.querySelector("#finalAnswer");

askButton.addEventListener("click", async () => {
  const question = questionInput.value.trim();

  if (!question) {
    statusText.textContent = "질문을 먼저 입력해줘.";
    questionInput.focus();
    return;
  }

  askButton.disabled = true;
  statusText.textContent = "영어 기준으로 질문을 정리하고 답변을 만드는 중...";
  englishQuestion.textContent = "처리 중...";
  finalAnswer.textContent = "처리 중...";

  try {
    const response = await fetch("/api/bridge", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        question,
        answerLanguage: answerLanguage.value
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "답변을 가져오지 못했어.");
    }

    englishQuestion.textContent = data.englishQuestion || "영어 질문을 찾지 못했어.";
    finalAnswer.textContent = data.finalAnswer || "답변을 찾지 못했어.";
    statusText.textContent = "완료!";
  } catch (error) {
    englishQuestion.textContent = "오류가 발생했어.";
    finalAnswer.textContent = error.message;
    statusText.textContent = "문제가 생겼어. 잠시 뒤 다시 시도해줘.";
  } finally {
    askButton.disabled = false;
  }
});