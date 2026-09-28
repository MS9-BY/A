import Anthropic from "@anthropic-ai/sdk";
import express from "express";
import cors from "cors";
 
const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));
 
const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});
 
// POST /api/generate - Arbeitsblattgenerator
app.post("/api/generate", async (req, res) => {
  try {
    const { prompt, onStream } = req.body;
    let result = "";
 
    const stream = await client.messages.stream({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });
 
    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        result += event.delta.text;
        if (onStream) {
          res.write(JSON.stringify({ type: "delta", text: event.delta.text }));
          res.write("\n");
        }
      }
    }
 
    if (!onStream) {
      res.write(JSON.stringify({ type: "final", text: result }));
      res.write("\n");
    }
    res.end();
  } catch (error) {
    console.error("Generate error:", error);
    res.status(500).json({ error: error.message });
  }
});
 
// POST /api/konvert - Konvertierer
app.post("/api/konvert", async (req, res) => {
  try {
    const { prompt } = req.body;
 
    const message = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });
 
    const text =
      message.content[0].type === "text" ? message.content[0].text : "";
    res.json({ text });
  } catch (error) {
    console.error("Konvert error:", error);
    res.status(500).json({ error: error.message });
  }
});
 
// POST /api/vereinfachen - Vereinfacher
app.post("/api/vereinfachen", async (req, res) => {
  try {
    const { prompt } = req.body;
 
    const message = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    });
 
    const text =
      message.content[0].type === "text" ? message.content[0].text : "";
    res.json({ text });
  } catch (error) {
    console.error("Vereinfachen error:", error);
    res.status(500).json({ error: error.message });
  }
});
 
// POST /api/chat - Chat
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
 
    const stream = await client.messages.stream({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      messages,
    });
 
    let result = "";
    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        result += event.delta.text;
        res.write(JSON.stringify({ type: "delta", text: event.delta.text }));
        res.write("\n");
      }
    }
 
    res.write(JSON.stringify({ type: "final", text: result }));
    res.write("\n");
    res.end();
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: error.message });
  }
});
 
// POST /api/vision - Mit Bildern (Konvertierer, Vereinfacher)
app.post("/api/vision", async (req, res) => {
  try {
    const { prompt, images } = req.body;
 
    const content = [
      {
        type: "text",
        text: prompt,
      },
      ...images.map((img) => ({
        type: "image",
        source: {
          type: "base64",
          media_type: img.type,
          data: img.data,
        },
      })),
    ];
 
    const message = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      messages: [{ role: "user", content }],
    });
 
    const text =
      message.content[0].type === "text" ? message.content[0].text : "";
    res.json({ text });
  } catch (error) {
    console.error("Vision error:", error);
    res.status(500).json({ error: error.message });
  }
});
 
// Health check
app.get("/health", (req, res) => {
  res.json({ ok: true });
});
 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API Server läuft auf Port ${PORT}`);
});
