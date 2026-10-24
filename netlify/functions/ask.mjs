
export default async (req) => {
  if (req.method !== "POST") {
    return Response.json(
      { error: "Use POST to ask a question." },
      { status: 405 }
    );
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "AI is not configured yet. Please try again later." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const question = body.question;

    if (
      typeof question !== "string" ||
      !question.trim() ||
      question.length > 10000
    ) {
      return Response.json(
        { error: "Please enter a valid question." },
        { status: 400 }
      );
    }

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          instructions:
            "You are Xavisol, a helpful university academic assistant. " +
            "Answer the student's question directly before giving explanations. " +
            "Explain difficult concepts in simple language, show calculations " +
            "step by step when useful, and organize longer answers with headings. " +
            "If the question is clear, do not ask unnecessary follow-up questions. " +
            "If essential information is genuinely missing, explain your assumption " +
            "or ask one focused question. Never invent facts or references.",
          input: question.trim(),
          max_output_tokens: 1200
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("AI provider error:", response.status);
      return Response.json(
        { error: "Xavisol couldn't generate an answer. Please try again." },
        { status: 502 }
      );
    }

    const answer = (data.output || [])
      .flatMap(item => item.content || [])
      .filter(item => item.type === "output_text")
      .map(item => item.text)
      .join("\n");

    if (!answer) {
      return Response.json(
        { error: "No answer was generated. Please try again." },
        { status: 502 }
      );
    }

    return Response.json({ answer });
  } catch {
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
};
