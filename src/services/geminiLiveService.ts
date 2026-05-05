import { GoogleGenAI, Modality } from "@google/genai";
import { MedicalProduct, Mode } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export class GeminiLiveService {
  private session: any = null;
  // Input audio context (16 kHz for mic → Gemini)
  private inputCtx: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  // Output audio context (24 kHz for Gemini → speaker + analyser)
  private outputCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private analyserData: Uint8Array | null = null;
  private nextStartTime = 0;
  private rafId: number | null = null;
  private onVolumeChange: ((volume: number) => void) | null = null;

  async connect(
    mode: Mode,
    product: MedicalProduct,
    targetProfile: string,
    language: string,
    onMessage: (text: string, isModel: boolean) => void,
    onSpeechStart: () => void,
    onSpeechEnd: () => void,
    onVolumeChange?: (volume: number) => void,
    onClose?: () => void
  ) {
    this.onVolumeChange = onVolumeChange || null;

    const systemInstruction = `
      You are ALIA (Avatar Logique d'Interaction Artificielle), a state-of-the-art Intelligent Virtual Avatar for the pharmaceutical sector.
      
      TONE: Professional, articulate, scientifically rigorous.
      Language: ${language}
      
      LINGUISTIC RULE (CRITICAL):
      - If language is AR, you MUST use Tunisian dialect (Derja) exclusively. 
      - Do NOT use Modern Standard Arabic (Fusha). 
      - Keep medical terms accurate but the surrounding speech should be natural Tunisian (Derja).

      ${mode === 'TRAINING' ? `
        SCENARIO: You are a ${targetProfile}. 
        OBJECTIVE: Challenge the visitor with evidence-based questions. 
        BEHAVIOR: Expert HCP, limited time. Require high levels of proof.
      ` : `
        OBJECTIVE: You are the virtual presenter for ${product.name}. 
        BEHAVIOR: Deliver scientific message clearly. Focus on patient benefits and RCP.
      `}
      
      Product Data: ${JSON.stringify(product)}
      
      CONSTRAINTS:
      - You are in a LIVE real-time voice conversation.
      - Keep responses snappy and suitable for verbal interaction.
      - Always respond in ${language}.
    `;

    const sessionPromise = ai.live.connect({
      model: "gemini-2.0-flash-live-001",
      config: {
        systemInstruction,
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
        },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      },
      callbacks: {
        onopen: () => {
          console.log("[ALIA] Gemini Live connected");
          this.startMic();
          this.startAnalyserLoop();
        },
        onmessage: async (message: any) => {
          // Model transcription text
          const modelText = message.serverContent?.modelTurn?.parts
            ?.filter((p: any) => p.text)
            .map((p: any) => p.text)
            .join("");
          if (modelText) {
            onMessage(modelText, true);
            onSpeechStart();
          }

          // User transcription text
          const userText = message.serverContent?.inputAudioTranscription?.text;
          if (userText) {
            onMessage(userText, false);
          }

          // Audio chunk from Gemini
          const audioPart = message.serverContent?.modelTurn?.parts?.find(
            (p: any) => p.inlineData
          );
          if (audioPart?.inlineData?.data) {
            this.queueAudio(audioPart.inlineData.data);
          }

          // Interruption
          if (message.serverContent?.interrupted) {
            this.stopPlayback();
            onSpeechEnd();
          }

          // Turn complete / GoAway
          if (message.serverControl) {
            if (message.serverControl.turnComplete) {
              onSpeechEnd();
            } else {
              console.warn("[ALIA] GoAway signal — closing gracefully");
              this.disconnect();
            }
          }
        },
        onclose: () => {
          this.stopMic();
          this.stopAnalyserLoop();
          onSpeechEnd();
          onClose?.();
        },
        onerror: (err: any) => {
          console.error("[ALIA] Gemini Live error:", err);
        },
      },
    });

    this.session = await sessionPromise;
  }

  // ─── Microphone capture (16 kHz → Gemini) ──────────────────────────────────
  private async startMic() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.inputCtx = new AudioContext({ sampleRate: 16000 });
      this.micSource = this.inputCtx.createMediaStreamSource(stream);
      this.processor = this.inputCtx.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7fff;
        }
        const base64Data = this.uint8ArrayToBase64(new Uint8Array(pcmData.buffer));
        this.session?.sendRealtimeInput({
          audio: { data: base64Data, mimeType: "audio/pcm;rate=16000" },
        });
      };

      this.micSource.connect(this.processor);
      this.processor.connect(this.inputCtx.destination);
    } catch (e) {
      console.error("[ALIA] Mic error:", e);
    }
  }

  private stopMic() {
    this.processor?.disconnect();
    this.processor = null;
    this.micSource?.disconnect();
    this.micSource = null;
    if (this.inputCtx && this.inputCtx.state !== "closed") {
      this.inputCtx.close();
    }
    this.inputCtx = null;
  }

  // ─── Output audio + real-time AnalyserNode for lip-sync ────────────────────
  private ensureOutputCtx() {
    if (!this.outputCtx || this.outputCtx.state === "closed") {
      this.outputCtx = new AudioContext({ sampleRate: 24000 });
      this.nextStartTime = 0;

      // AnalyserNode: FFT size 256 → 128 frequency bins, ~5ms update at 24kHz
      this.analyser = this.outputCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.6;
      this.analyserData = new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.connect(this.outputCtx.destination);
    }
  }

  private queueAudio(base64Data: string) {
    this.ensureOutputCtx();
    if (!this.outputCtx || !this.analyser) return;

    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Gemini Live outputs 24 kHz mono 16-bit PCM
    const pcmData = new Int16Array(bytes.buffer);
    const floatData = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      floatData[i] = pcmData[i] / 0x7fff;
    }

    const audioBuffer = this.outputCtx.createBuffer(1, floatData.length, 24000);
    audioBuffer.getChannelData(0).set(floatData);

    const source = this.outputCtx.createBufferSource();
    source.buffer = audioBuffer;
    // Route through analyser so we can measure volume in real time
    source.connect(this.analyser);

    const startTime = Math.max(this.outputCtx.currentTime, this.nextStartTime);
    source.start(startTime);
    this.nextStartTime = startTime + audioBuffer.duration;
  }

  // ─── RAF loop: read analyser → volume callback ──────────────────────────────
  private startAnalyserLoop() {
    const tick = () => {
      this.rafId = requestAnimationFrame(tick);
      if (!this.analyser || !this.analyserData || !this.onVolumeChange) return;

      this.analyser.getByteFrequencyData(this.analyserData);

      // Focus on speech frequencies: ~80 Hz – 3 kHz
      // At 24 kHz sample rate, fftSize 256 → bin width = 24000/256 ≈ 93.75 Hz
      // Bins 1–32 cover ~93 Hz – 3 kHz (speech range)
      const speechBins = this.analyserData.slice(1, 33);
      let sum = 0;
      for (let i = 0; i < speechBins.length; i++) sum += speechBins[i];
      const avg = sum / speechBins.length; // 0–255
      const volume = Math.min(1, avg / 80); // normalize: 80/255 ≈ typical speech peak

      this.onVolumeChange(volume);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private stopAnalyserLoop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.onVolumeChange?.(0);
  }

  private stopPlayback() {
    if (this.outputCtx) {
      this.nextStartTime = this.outputCtx.currentTime;
    }
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────
  private uint8ArrayToBase64(uint8Array: Uint8Array): string {
    let binary = "";
    for (let i = 0; i < uint8Array.byteLength; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
  }

  disconnect() {
    if (this.session) {
      const s = this.session;
      this.session = null;
      try { s.close(); } catch (_) {}
    }
    this.stopAnalyserLoop();
    this.stopMic();
    if (this.outputCtx && this.outputCtx.state !== "closed") {
      this.outputCtx.close();
    }
    this.outputCtx = null;
    this.analyser = null;
    this.analyserData = null;
    this.onVolumeChange = null;
  }
}
