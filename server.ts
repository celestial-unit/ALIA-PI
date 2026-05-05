import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- MOCK KNOWLEDGE BASE ---
  const KNOWLEDGE_BASE = {
    products: [
      {
        id: "cardio-guard",
        name: "CardioGuard Forte",
        indication: "Hypertension and heart failure prevention",
        mechanism: "ACE inhibitor combined with metabolic support",
        posology: "1 tablet daily, preferably in the morning",
        clinicalBenefits: "25% reduction in cardiovascular events vs baseline",
        studies: "PROTECT-2024 Study involving 5000 patients",
        rcp: "Full Summary of Product Characteristics (v1.2)",
      },
      {
        id: "neuro-zen",
        name: "NeuroZen",
        indication: "Mild cognitive impairment",
        mechanism: "Cholinergic pathway enhancement",
        posology: "5mg twice daily",
        clinicalBenefits: "Improved memory retention scores in 6 months",
        studies: "Cogni-Trial 2023",
        rcp: "Full RCP (v2.0)",
      }
    ]
  };

  // --- API ROUTES ---
  app.get("/api/knowledge/products", (req, res) => {
    res.json(KNOWLEDGE_BASE.products);
  });

  app.post("/api/tavus/session", async (req, res) => {
    const { context, replicaId = "r55e6793f10f" } = req.body;
    
    const apiKey = process.env.TAVUS_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'TAVUS_API_KEY not configured' });
    }

    try {
      const response = await fetch("https://tavusapi.com/v2/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey
        },
        body: JSON.stringify({
          replica_id: replicaId,
          conversation_name: 'ALIA HD Session',
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText };
        }
        console.error("Tavus API Error Response:", errorData);
        throw new Error(errorData.message || errorData.error || `Tavus API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      res.json({
        conversation_id: data.conversation_id,
        conversation_url: data.conversation_url
      });
    } catch (error: any) {
      console.error("Tavus Session Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/tavus/session/:conversationId", async (req, res) => {
    const { conversationId } = req.params;
    const apiKey = process.env.TAVUS_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'TAVUS_API_KEY not configured' });
    }

    try {
      await fetch(`https://tavusapi.com/v2/conversations/${conversationId}`, {
        method: "DELETE",
        headers: {
          "x-api-key": apiKey
        }
      });
      res.json({ success: true });
    } catch (error: any) {
      console.error("Tavus Delete Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/crm/log-interaction", (req, res) => {
    const { productId, userId, score, feedback, duration } = req.body;
    console.log(`[CRM LOG] Interaction for ${productId} by user ${userId}. Score: ${score}/100`);
    res.json({ status: "success", transactionId: `TRX-${Date.now()}` });
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== "production") {
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
    console.log(`ALIA Server running on http://localhost:${PORT}`);
  });
}

startServer();
