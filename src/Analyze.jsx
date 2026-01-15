import React, { useEffect, useState } from "react";
import { getDocument } from "pdfjs-dist";
import { GlobalWorkerOptions } from "pdfjs-dist/build/pdf";
import workerSrc from "pdfjs-dist/build/pdf.worker.min?url";
import { supabase } from "./supabaseClient";
import { useNavigate } from "react-router-dom";
import PDFViewer from "./components/PDFViewer";
import Threads from "./components/Threads.jsx";

GlobalWorkerOptions.workerSrc = workerSrc;

const AnalyzePage = () => {
  const navigate = useNavigate();

  const [fileUrl, setFileUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const [summary, setSummary] = useState("");
  const [docType, setDocType] = useState("");
  const [keyPoints, setKeyPoints] = useState([]);
  const [contractDate, setContractDate] = useState(null);
  const [expiryDate, setExpiryDate] = useState(null);

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("summary");

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    fetchLatestFile();
  }, []);

  const fetchLatestFile = async () => {
    const { data, error } = await supabase.storage
      .from("uploads")
      .list("myfiles");

    if (error || !data?.length) return;

    const latest = data.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    )[0];

    analyzeFile(latest.name);
  };

  const analyzeFile = async (fileName) => {
    setSelectedFile(fileName);
    setLoading(true);

    try {
      const { data: fileBlob, error } = await supabase.storage
        .from("uploads")
        .download(`myfiles/${fileName}`);

      if (error) throw error;

      const url = URL.createObjectURL(fileBlob);
      setFileUrl(url); // ✅ PDF appears immediately on LEFT

      const arrayBuffer = await fileBlob.arrayBuffer();
      const pdf = await getDocument({ data: arrayBuffer }).promise;

      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((i) => i.str).join(" ") + "\n";
      }

      const res = await fetch("http://localhost:5000/api/analyze-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const result = await res.json();

      setSummary(result.summary || "No summary");
      setDocType(result.type || "Unknown");
      setKeyPoints(result.keyPoints || []);
      setContractDate(result.contractDate ? new Date(result.contractDate) : null);
      setExpiryDate(result.expiryDate ? new Date(result.expiryDate) : null);
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  const askAI = async () => {
    if (!question || !summary) return;

    const res = await fetch("http://localhost:5000/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ summary, question }),
    });

    const data = await res.json();
    setAnswer(data.answer || "No response");
  };

  return (
    <div className="relative min-h-screen bg-black text-white p-4">
      <Threads className="absolute inset-0 z-0" />

      <div className="relative z-10 flex h-[92vh] gap-4">

        {/* LEFT – PDF VIEWER */}
        <div className="w-1/2 bg-[#0e1627] rounded-xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-700 flex justify-between">
            <p className="font-semibold">{selectedFile}</p>
            <button
              onClick={() => navigate("/")}
              className="text-blue-400 text-sm"
            >
              Upload another
            </button>
          </div>

          <div className="flex-1 bg-white">
            {fileUrl && <PDFViewer fileUrl={fileUrl} />}
          </div>
        </div>

        {/* RIGHT – ANALYSIS */}
        <div className="w-1/2 bg-[#0e1627] rounded-xl flex flex-col">

          <div className="flex gap-6 px-4 py-3 border-b border-gray-700">
            <button
              onClick={() => setActiveTab("summary")}
              className={activeTab === "summary" ? "text-blue-400" : "text-gray-400"}
            >
              Summary
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={activeTab === "chat" ? "text-blue-400" : "text-gray-400"}
            >
              AI Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-5">

            {activeTab === "summary" && (
              <>
                <p className="text-sm text-gray-400">
                  <strong>Document Type:</strong> {docType}
                </p>

                {loading ? (
                  <p className="text-yellow-300">Analyzing document…</p>
                ) : (
                  <p className="text-gray-200 whitespace-pre-wrap">{summary}</p>
                )}

                {keyPoints.length > 0 && (
                  <ul className="list-disc list-inside text-gray-300">
                    {keyPoints.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                )}

                <div className="text-sm text-gray-400">
                  <p>Contract Date: {contractDate?.toDateString() || "N/A"}</p>
                  <p>Expiry Date: {expiryDate?.toDateString() || "N/A"}</p>
                </div>
              </>
            )}

            {activeTab === "chat" && (
              <>
                <div className="flex gap-2">
                  <input
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="flex-1 p-2 rounded text-black"
                    placeholder="Ask about this document"
                  />
                  <button
                    onClick={askAI}
                    className="bg-blue-600 px-4 rounded"
                  >
                    Ask
                  </button>
                </div>

                {answer && (
                  <div className="bg-black/40 p-4 rounded">
                    {answer}
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyzePage;

