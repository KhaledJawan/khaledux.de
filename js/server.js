import express from "express";
import cors from "cors";
import OpenAI from "openai";
import "dotenv/config";
import { KHALED_PROFILE } from "./profile.js";

const app = express();
app.use(cors());
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(express.json());

app.post("/api/chat", async (req, res) => {
  try {
    const userMessage = (req.body.message || "").trim();
    if (!userMessage) {
      return res
        .status(400)
        .json({ error: "Please provide a message for the assistant." });
    }

    const prompt = `
${KHALED_PROFILE}

User message:
${userMessage}

Respond as Khaled. Mirror the user’s language.
`;

    const response = await openai.responses.create({
      model: "gpt-5-nano",
      input: prompt,
    });

    const reply =
      response?.output_text?.trim() ||
      "Thanks for reaching out! I’ll review your message and get back to you.";

    res.json({ reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "OpenAI request failed" });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server on http://localhost:${port}`));
