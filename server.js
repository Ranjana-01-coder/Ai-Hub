// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import chrono from "chrono-node";
import fs from "fs";
import path from "path";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" })); // allow larger PDF text payloads

// ----------------- Analyze PDF Text -----------------
app.post("/api/analyze-pdf", (req, res) => {
  try {
    console.log("📩 Incoming request at /api/analyze-pdf");

    const { text } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "No text provided or invalid format" });
    }

    // 1️⃣ Summary
    const normalizedWhitespace = text.replace(/\s+/g, " ").trim();
    const summary = normalizedWhitespace.length > 600
      ? normalizedWhitespace.slice(0, 600) + "..."
      : normalizedWhitespace;

    // 2️⃣ Document Type (headers + keywords)
    let type = "Unknown";
    const header = text.split(/\n|\r/).slice(0, 10).join(" ").toLowerCase();
    const lowered = text.toLowerCase();
    const typeRules = [
      { label: "Invoice", tests: [/invoice/, /bill to/, /invoice no\.?/, /amount due/] },
      { label: "Contract/Agreement", tests: [/contract/, /agreement/, /party a/, /party b/, /hereby/] },
      { label: "Report", tests: [/report/, /executive summary/, /findings/, /methodology/] },
      { label: "Purchase Order", tests: [/purchase order/, /po\s?#?\d+/, /vendor/] },
      { label: "Receipt", tests: [/receipt/, /payment received/, /transaction id/] },
      { label: "Resume/CV", tests: [/curriculum vitae/, /resume/, /work experience/, /education/] },
    ];
    for (const rule of typeRules) {
      if (rule.tests.some((r) => r.test(header) || r.test(lowered))) {
        type = rule.label;
        break;
      }
    }

    // 3️⃣ Dates (robust)
    let contractDate = null;
    let expiryDate = null;

    // Use chrono-node for broad parsing
    const parsedDates = chrono.parse(text);
    if (parsedDates.length > 0) {
      // Prefer dates near words like effective/commencement for contractDate
      const effectiveIdx = lowered.indexOf("effective");
      const commenceIdx = lowered.indexOf("commence");
      const expireIdx = lowered.indexOf("expire");

      const scored = parsedDates.map((pd) => {
        const idx = pd.index ?? 0;
        const distEff = effectiveIdx >= 0 ? Math.abs(idx - effectiveIdx) : Infinity;
        const distCom = commenceIdx >= 0 ? Math.abs(idx - commenceIdx) : Infinity;
        const distExp = expireIdx >= 0 ? Math.abs(idx - expireIdx) : Infinity;
        return {
          start: pd?.start?.date() || null,
          index: idx,
          scoreStart: Math.min(distEff, distCom),
          scoreExpire: distExp,
        };
      });

      // Pick the closest to effective/commence as contractDate
      const startCandidate = scored
        .filter((s) => s.start)
        .sort((a, b) => a.scoreStart - b.scoreStart || a.index - b.index)[0];
      if (startCandidate) contractDate = startCandidate.start;

      // Pick the closest to expire as expiryDate
      const expireCandidate = scored
        .filter((s) => s.start)
        .sort((a, b) => a.scoreExpire - b.scoreExpire || a.index - b.index)[0];
      if (expireCandidate) expiryDate = expireCandidate.start;
    }

    // Regex fallbacks for common formats
    const monthName = "January|February|March|April|May|June|July|August|September|October|November|December";
    const longDateRegex = new RegExp(`(?:${monthName})\\s+\\d{1,2},\\s+\\d{4}`, "gi");
    const isoDateRegex = /\b\d{4}-\d{2}-\d{2}\b/g; // 2024-09-15
    const shortDateRegex = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g; // 09/15/2025 or 9-15-25

    const fallbackMatches = (
      (text.match(longDateRegex) || [])
        .concat(text.match(isoDateRegex) || [])
        .concat(text.match(shortDateRegex) || [])
    );
    if (!contractDate && fallbackMatches.length > 0) {
      contractDate = new Date(fallbackMatches[0]);
    }
    if (!expiryDate && fallbackMatches.length > 1) {
      expiryDate = new Date(fallbackMatches[1]);
    }

    // Relative duration e.g., "for 2 years" or "for a period of 12 months"
    const yearsMatch = text.match(/(\d+)\s+year/i);
    const monthsMatch = text.match(/(\d+)\s+month/i);
    if (contractDate) {
      if (yearsMatch) {
        const years = parseInt(yearsMatch[1], 10);
        expiryDate = new Date(contractDate);
        expiryDate.setFullYear(expiryDate.getFullYear() + years);
      } else if (monthsMatch) {
        const months = parseInt(monthsMatch[1], 10);
        expiryDate = new Date(contractDate);
        expiryDate.setMonth(expiryDate.getMonth() + months);
      }
    }

    // 4️⃣ Extract key clauses
    const importantKeywords = [
      "confidential",
      "obligation",
      "term",
      "termination",
      "payment",
      "breach",
      "liability",
      "agreement",
      "responsibility",
      "rights",
      "conditions",
      "damages",
      "warranty",
      "indemnity",
      "governing law",
      "jurisdiction",
      "force majeure",
    ];

    const lines = text
      .split(/\n|\. /)
      .map((l) => l.trim())
      .filter((l) => l.length > 5);

    const keyPoints = lines.filter((line) =>
      importantKeywords.some((keyword) => line.toLowerCase().includes(keyword))
    ).slice(0, 50);

    console.log("🔎 Type:", type);
    console.log("📅 ContractDate:", contractDate);
    console.log("📅 ExpiryDate:", expiryDate);
    console.log("📌 KeyPoints count:", keyPoints.length);

    res.json({
      summary,
      type,
      contractDate,
      expiryDate,
      keyPoints,
      images: [],
    });
  } catch (err) {
    console.error("🔥 Server error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ----------------- Download Analysis as TXT -----------------
app.post("/api/download-analysis", (req, res) => {
  try {
    const { summary, type, contractDate, expiryDate, keyPoints } = req.body;
    if (!summary) {
      return res.status(400).json({ error: "No summary provided" });
    }

        const content = `Document Type: ${type || "Unknown"}
    Contract Date: ${contractDate ? new Date(contractDate).toDateString() : "N/A"}
    Expiry Date: ${expiryDate ? new Date(expiryDate).toDateString() : "N/A"}
    
    Summary:
    ${summary}
    
    Key Clauses / Important Lines:
    ${(keyPoints || []).join('\n')}
    `;

    const filePath = path.join(process.cwd(), "analysis.txt");
    fs.writeFileSync(filePath, content, "utf8");

    res.download(filePath, "analysis.txt", (err) => {
      if (err) {
        console.error("Download error:", err);
        res.status(500).send("Failed to download file");
      } else {
        fs.unlinkSync(filePath); // delete after download
      }
    });
  } catch (err) {
    console.error("🔥 Server error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ----------------- Ask AI -----------------
app.post("/api/ask", (req, res) => {
  try {
    const { summary, question } = req.body;
    if (!summary || !question) {
      return res.status(400).json({ error: "Missing summary or question" });
    }

    // Mock AI response
    res.json({
      answer: `🤖 You asked: "${question}". Document summary length: ${summary.length} characters.`,
    });
  } catch (err) {
    console.error("🔥 Server error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ----------------- Start Server -----------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});