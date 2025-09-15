// /api/optimize.js — Vercel Serverless Function (Node 18+, uses global fetch)
module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

    // Robust body parsing (Vercel may give you a string or an object)
    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } 
      catch { return res.status(400).json({ optimized: "", error: "Invalid JSON body" }); }
    }
    body = body || {};
    const input = typeof body.input === "string" ? body.input.trim() : "";

    if (!input) return res.status(200).json({ optimized: "" });

    // Call OpenAI as Lyra
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content:
              "You are Lyra, a master-level AI prompt optimization specialist. Use the 4-D Methodology (Deconstruct, Diagnose, Develop, Deliver) to transform the user's input into a precise, ready-to-use prompt. Return ONLY the optimized prompt text.",
          },
          { role: "user", content: input },
        ],
      }),
    });

    if (!r.ok) throw new Error(`OpenAI error: ${r.status}`);
    const j = await r.json();
    const optimized = j?.choices?.[0]?.message?.content?.trim() ?? "";

    return res.status(200).json({ optimized });
  } catch (e) {
    return res.status(500).json({ optimized: "", error: String(e) });
  }
};
