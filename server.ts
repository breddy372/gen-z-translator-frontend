import express from "express";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
const BACKEND_URL = process.env.BACKEND_URL || "https://breddy372--genz-translator-fastapi-app.modal.run";

app.use(express.json());

const DEFAULT_SYSTEM_PROMPT =
  "Translate standard English into authentic Gen-Z slang. Preserve the original meaning while changing tone, vocabulary, and structure. " +
  "Use energetic, contemporary slang where appropriate (for example: no cap, fr fr, slay, rizz, bussin, glow up, periodt). " +
  "Return only the translated slang text with no explanations or extra commentary.";

// Translation API endpoint - forwards to FastAPI backend
app.post("/api/translate", async (req, res) => {
  try {
    const {
      text,
      max_new_tokens = 150,
      temperature = 0.7,
      top_p = 0.9,
      system_prompt,
    } = req.body;

    // Validate request parameters as per BaseModel schema constraints
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text is required and must be a string." });
    }

    if (text.length < 1 || text.length > 2000) {
      return res.status(400).json({ error: "Text length must be between 1 and 2000 characters." });
    }

    const maxTokens = Number(max_new_tokens);
    if (isNaN(maxTokens) || maxTokens < 10 || maxTokens > 512) {
      return res.status(400).json({ error: "max_new_tokens must be an integer between 10 and 512." });
    }

    const temp = Number(temperature);
    if (isNaN(temp) || temp < 0.0 || temp > 2.0) {
      return res.status(400).json({ error: "temperature must be a float between 0.0 and 2.0." });
    }

    const topPVal = Number(top_p);
    if (isNaN(topPVal) || topPVal < 0.0 || topPVal > 1.0) {
      return res.status(400).json({ error: "top_p must be a float between 0.0 and 1.0." });
    }

    if (system_prompt && (typeof system_prompt !== "string" || system_prompt.length > 500)) {
      return res.status(400).json({ error: "system_prompt must be a string under 500 characters." });
    }

    const systemInstruction = system_prompt && system_prompt.trim() !== "" 
      ? system_prompt 
      : DEFAULT_SYSTEM_PROMPT;

    // Forward request to FastAPI backend
    const requestPayload: any = {
      text,
      max_new_tokens: maxTokens,
      temperature: temp,
      top_p: topPVal,
    };

    // Only include system_prompt if explicitly provided (not the default)
    if (system_prompt && system_prompt.trim() !== "") {
      requestPayload.system_prompt = system_prompt;
    }

    const response = await fetch(`${BACKEND_URL}/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ error: errorData.error || "Backend translation failed." });
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("Translation failed:", error);
    res.status(500).json({ error: error.message || "An unexpected error occurred during translation." });
  }
});

// Configure Vite middleware in development vs production
async function main() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
});
