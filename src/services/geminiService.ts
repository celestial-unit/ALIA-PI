import { GoogleGenAI, Type, Modality } from "@google/genai";
import { EvaluationResult, Language, MedicalProduct, Message } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export class GeminiService {
  /**
   * Generates a conversational response based on user input and session context.
   */
  static async getAvatarResponse(
    messages: Message[],
    mode: "TRAINING" | "COMMERCIAL",
    language: Language,
    product: MedicalProduct,
    targetProfile?: string
  ) {
    const systemInstruction = `
      You are ALIA (Avatar Logique d'Interaction Artificielle), an state-of-the-art Intelligent Virtual Avatar for the high-end pharmaceutical and medical sector.
      
      TONE & STYLE:
      - Extremely professional, articulate, and scientifically rigorous.
      - Use precise medical terminology.
      - Avoid generic conversational fillers; be direct yet courteous.
      - Maintain a "Medical-Premium" persona: sophisticated, authoritative, and reliable.

      CONTEXT:
      Mode: ${mode}
      Language: ${language}
      Product: ${product.name} (${product.indication})
      Data: ${JSON.stringify(product)}
      
      LINGUISTIC RULE (CRITICAL):
      - If language is AR, you MUST use Tunisian dialect (Derja) exclusively for conversation. 
      - Do NOT use Modern Standard Arabic (Fusha) for social or conversational parts.
      - Use "Cava?", "Chnouwa el a7wel?", "Behi", "Aywa", etc. 
      - Keep medical technical terms accurate but explain them in Derja if asked.

      ${mode === 'TRAINING' ? `
        SCENARIO: You are a ${targetProfile}. 
        OBJECTIVE: You are an expert healthcare professional with limited time. 
        BEHAVIOR: Challenge the visitor with evidence-based questions. Ask about clinical data, side effects, or comparisons with competitors. Do not be overly aggressive, but require high levels of scientific proof to be convinced.
      ` : `
        OBJECTIVE: You are the virtual presenter for ${product.name}. 
        BEHAVIOR: Deliver the scientific message with absolute clarity and conviction. Focus on patient benefits, safety profiles, and adherence to regulatory standards (RCP).
      `}
      
      CONSTRAINTS:
      - Always respond in ${language}.
      - Responses must be concise (suitable for a virtual face talking).
      - Never hallucinate data. If you don't have the info in the product JSON, defer to the official RCP.
    `;

    const chatContents = messages.length > 0 
      ? messages.map(m => ({ role: m.role, parts: [{ text: m.content }] }))
      : [{ role: "user", parts: [{ text: "Bonjour, veuillez commencer la simulation ou la présentation." }] }];

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: chatContents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text || "I'm sorry, I couldn't process that.";
  }

  /**
   * Generates audio from text using Gemini TTS.
   */
  static async generateSpeech(text: string) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' }, 
            },
          },
        },
      });

      const part = response.candidates?.[0]?.content?.parts?.[0];
      return {
        data: part?.inlineData?.data,
        mimeType: part?.inlineData?.mimeType
      };
    } catch (error) {
      console.error("Gemini TTS Error:", error);
      return null;
    }
  }

  /**
   * Evaluates a training session performance.
   */
  static async evaluateSession(
    history: Message[],
    product: MedicalProduct,
    language: Language
  ): Promise<EvaluationResult> {
    const systemInstruction = `
      You are the ALIA Training Evaluation Agent.
      Analyze the transcript between a Medical Visitor (user) and a Doctor (model).
      
      CRITERIA:
      1. Clarity and Structure: Was the presentation logical?
      2. Scientific Accuracy: Did they misrepresent ${product.name}?
      3. Compliance: Did they mention RCP/notice constraints?
      4. Objection Handling: How well did they answer the doctor's doubts?
      
      Respond STRICTLY in JSON format following this schema:
      {
        "globalScore": number (0-100),
        "clarity": number (0-100),
        "accuracy": number (0-100),
        "compliance": number (0-100),
        "objectionHandling": number (0-100),
        "feedback": {
          "strengths": string[],
          "improvements": string[],
          "recommendations": string[]
        }
      }
    `;

    const transcript = history.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n");

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [{ role: "user", parts: [{ text: `Evaluate this transcript:\n${transcript}` }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      console.error("Failed to parse evaluation result", e);
      throw new Error("Evaluation failed.");
    }
  }
}
