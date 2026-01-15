const askAI = async () => {
  if (!summary || !question) return;
  try {
    const res = await fetch("http://localhost:5000/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ summary, question }),
    });
    const data = await res.json();
    setAnswer(data.answer || "No answer available");
  } catch (err) {
    toast.error("AI Q&A failed.");
    console.error(err);
  }
};
