import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Copy, 
  Check, 
  Trash2, 
  Flame, 
  RefreshCw, 
  MessageSquare, 
  Cpu, 
  History, 
  ArrowRight,
  Bookmark,
  Volume2,
  Info
} from "lucide-react";
import { TranslateResponse, PresetPrompt } from "./types";
import { PRESETS } from "./presets";

// Quick phrase examples for standard English
const EXAMPLE_PHRASES = [
  { text: "I'm really tired today, I need some rest.", label: "Tired" },
  { text: "Our business strategy needs a complete review.", label: "Corporate" },
  { text: "She succeeded and did a wonderful job.", label: "Success" },
  { text: "This food tastes extremely delicious.", label: "Foodie" },
  { text: "My friend looks highly fashionable today.", label: "Fashion" }
];

export default function App() {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://breddy372--genz-translator-fastapi-app.modal.run";

  // Translate Request State
  const [inputText, setInputText] = useState("");
  const [maxNewTokens, setMaxNewTokens] = useState(150);
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(0.9);
  const [selectedPresetId, setSelectedPresetId] = useState("default");
  
  // Custom prompt matching current preset
  const [systemPrompt, setSystemPrompt] = useState(PRESETS[0].prompt);

  // Translate Response State
  const [outputResponse, setOutputResponse] = useState<TranslateResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // History Log State
  const [history, setHistory] = useState<TranslateResponse[]>([]);
  const [copyAckInput, setCopyAckInput] = useState(false);
  const [copyAckOutput, setCopyAckOutput] = useState(false);
  const [copiedHistoryIndex, setCopiedHistoryIndex] = useState<number | null>(null);
  const [audioSynthesizing, setAudioSynthesizing] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // Status simulation/metrics
  const [latency, setLatency] = useState<number | null>(null);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("genz_translations_history");
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Could not load history from localStorage", e);
    }
  }, []);

  // Save history on change
  const saveHistory = (newHistory: TranslateResponse[]) => {
    setHistory(newHistory);
    try {
      localStorage.setItem("genz_translations_history", JSON.stringify(newHistory));
    } catch (e) {
      console.warn("Could not save history to localStorage", e);
    }
  };

  // Preset switching trigger
  const handleSelectPreset = (preset: PresetPrompt) => {
    setSelectedPresetId(preset.id);
    setSystemPrompt(preset.prompt);
  };

  // Perform translation
  const handleTranslate = async () => {
    const trimmedInput = inputText.trim();
    if (!trimmedInput) {
      setErrorMsg("Input standard text cannot be empty.");
      return;
    }
    if (trimmedInput.length > 2000) {
      setErrorMsg("Whoa there, bestie! Keep it under 2000 chars.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");
    const startTime = Date.now();

    try {
      const response = await fetch(`${BACKEND_URL}/translate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: trimmedInput,
          max_new_tokens: maxNewTokens,
          temperature: temperature,
          top_p: topP,
          system_prompt: systemPrompt
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to cook up slang.");
      }

      const duration = Date.now() - startTime;
      setLatency(duration);

      const transResult: TranslateResponse = data;
      setOutputResponse(transResult);

      // Append to local history (limit to 20 entries)
      const updatedHistory = [transResult, ...history.filter(h => h.gen_z_text !== transResult.gen_z_text)].slice(0, 20);
      saveHistory(updatedHistory);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Something went wrong on the server, bestie. Check your connection!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (text: string, type: "input" | "output") => {
    navigator.clipboard.writeText(text);
    if (type === "input") {
      setCopyAckInput(true);
      setTimeout(() => setCopyAckInput(false), 2000);
    } else {
      setCopyAckOutput(true);
      setTimeout(() => setCopyAckOutput(false), 2000);
    }
  };

  const handleCopyHistory = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedHistoryIndex(idx);
    setTimeout(() => setCopiedHistoryIndex(null), 2000);
  };

  const handleDeleteHistoryItem = (idx: number) => {
    const remaining = history.filter((_, i) => i !== idx);
    saveHistory(remaining);
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to delete all historical logs? This destroys proof of your rizz.")) {
      saveHistory([]);
    }
  };

  // Speech synthesizer simulation using native SpeechSynthesis
  const speakTranslation = () => {
    if (!outputResponse?.gen_z_text) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(outputResponse.gen_z_text);
      
      // Attempt to pick a fun or energetic voice
      const voices = window.speechSynthesis.getVoices();
      const googleVoice = voices.find(v => v.name.includes("Google") && v.lang.startsWith("en"));
      if (googleVoice) {
        utterance.voice = googleVoice;
      }
      
      utterance.rate = 1.05;
      utterance.pitch = 1.1;
      
      utterance.onstart = () => setAudioSynthesizing(true);
      utterance.onend = () => setAudioSynthesizing(false);
      utterance.onerror = () => setAudioSynthesizing(false);
      
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error", e);
    }
  };

  const loadFromHistory = (item: TranslateResponse) => {
    setInputText(item.input_text);
    setOutputResponse(item);
  };

  const handleResetModifiers = () => {
    setMaxNewTokens(150);
    setTemperature(0.7);
    setTopP(0.9);
    const defaultPreset = PRESETS.find(p => p.id === "default") || PRESETS[0];
    setSystemPrompt(defaultPreset.prompt);
    setSelectedPresetId("default");
  };

  const getLoadingPhrase = () => {
    if (temperature > 1.5) return "GENERATING PEAK BRAINROT...";
    if (selectedPresetId === "brainrot") return "SLAYING INTENSELY...";
    if (selectedPresetId === "corporate") return "LOCKING IN SYNERGY...";
    return "COOKING THE TRANSLATION fr fr...";
  };

  return (
    <div className="min-h-screen w-full bg-[#0A0A0A] text-[#F0F0F0] font-sans flex items-center justify-center p-0 md:p-6 lg:p-8 select-none">
      {/* Editorial aesthetic container */}
      <div className="w-full max-w-6xl bg-[#0A0A0A] border-[12px] border-[#DFFF00] flex flex-col overflow-hidden shadow-[0_0_50px_rgba(223,255,0,0.15)]">
        
        {/* HEADER SECTION */}
        <header className="flex flex-col md:flex-row items-start md:items-end justify-between px-6 py-6 md:px-8 md:py-8 border-b border-[#333] gap-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#DFFF00] font-bold">
                AI Powered Lingua
              </span>
              <span className="bg-[#FF00FF] text-white text-[9px] uppercase tracking-wider px-1.5 py-0.5 font-bold">
                SLAY v4.2
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter leading-none text-white">
              GEN-Z<br/>TRANSLATOR
            </h1>
          </div>
          
          <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-[#333] pt-4 md:pt-0 md:pl-8 h-auto md:h-20 w-full md:w-auto">
            <div className="flex flex-col text-left">
              <div className="text-[11px] uppercase tracking-widest text-[#666] mb-1 font-bold">
                Active Translation Engine
              </div>
              <div className="text-sm md:text-lg font-mono text-[#DFFF00] flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#DFFF00] animate-pulse" />
                <span>{outputResponse?.model || "LLaMA-3.2-1B-GenZ-LoRA // server"}</span>
              </div>
            </div>
          </div>
        </header>

        {/* WORKSPACE CONTENT */}
        <main className="flex flex-col lg:flex-row min-h-[500px]">
          
          {/* LEFT SECTION: Inputs, Outputs, & Quick actions */}
          <section className="w-full lg:w-[62%] flex flex-col border-b lg:border-b-0 lg:border-r border-[#333]">
            <div className="p-6 md:p-8 flex flex-col gap-6 flex-1">
              
              {/* English Input Container */}
              <div className="flex flex-col h-auto min-h-[200px] relative">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] uppercase tracking-widest text-[#DFFF00] font-bold flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#DFFF00] animate-pulse"></span> 
                    Standard English
                  </label>
                  <span className="text-[10px] text-[#666] font-mono">
                    {inputText.length} / 2000 chars
                  </span>
                </div>
                
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value.slice(0, 2000))}
                  placeholder="Paste your vanilla formal writing here... I need rest, we should talk, let's setup a meeting..."
                  className="w-full flex-1 bg-[#151515] p-5 border border-[#333] text-lg leading-relaxed italic text-white placeholder-zinc-700 focus:outline-none focus:border-[#DFFF00] transition-colors resize-y min-h-[120px] font-sans rounded-none"
                  id="english-input-area"
                />

                {/* Example Quick-load Chips */}
                <div className="mt-2.5 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[9px] text-[#555] uppercase tracking-wider font-mono mr-1">Examples:</span>
                  {EXAMPLE_PHRASES.map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => setInputText(ex.text)}
                      className="px-2 py-1 text-[10px] bg-[#1e1e1e] border border-[#333] text-zinc-400 hover:text-[#DFFF00] hover:border-[#DFFF00] transition-all font-mono"
                    >
                      {ex.label}
                    </button>
                  ))}
                  {inputText && (
                    <button
                      onClick={() => setInputText("")}
                      className="px-2 py-1 text-[10px] bg-zinc-900 border border-red-950 text-red-500 hover:bg-red-950 transition-colors font-mono"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Gen-Z Slang Output Area */}
              <div className="flex flex-col h-auto min-h-[220px] relative mt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] uppercase tracking-widest text-[#FF00FF] font-bold flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF00FF]"></span> 
                    Slay slang Translation
                  </label>
                  
                  {outputResponse && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={speakTranslation}
                        className={`p-1 bg-[#1c1c1c] border border-zinc-800 text-zinc-400 hover:text-[#FF00FF] transition-colors rounded ${audioSynthesizing ? 'animate-bounce text-[#FF00FF]' : ''}`}
                        title="TTS: Hear that slang"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleCopyText(outputResponse.gen_z_text, "output")}
                        className="flex items-center gap-1 px-2 py-1 text-[10px] text-zinc-400 hover:text-white bg-[#151515] hover:bg-[#222] border border-[#333] font-mono"
                      >
                        {copyAckOutput ? <Check className="w-3 h-3 text-[#FF00FF]" /> : <Copy className="w-3 h-3" />}
                        <span>{copyAckOutput ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                  )}
                </div>

                {isLoading ? (
                  <div className="flex-1 bg-[#151515] p-6 border border-[#333] flex flex-col items-center justify-center text-center gap-3">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-[#DFFF00] animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-3 h-3 bg-[#FF00FF] animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-3 h-3 bg-white animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#DFFF00] animate-pulse">
                      {getLoadingPhrase()}
                    </span>
                  </div>
                ) : errorMsg ? (
                  <div className="flex-1 bg-red-950/20 p-6 border border-red-900/60 text-red-400 text-sm font-mono flex flex-col justify-center gap-2">
                    <div className="font-bold uppercase tracking-wider">⚠️ API Error back at base:</div>
                    <div>{errorMsg}</div>
                    <button 
                      onClick={handleTranslate} 
                      className="self-start mt-2 px-3 py-1.5 bg-red-900 text-white text-xs font-bold hover:bg-red-800 tracking-wider uppercase"
                    >
                      Retry Cook-up
                    </button>
                  </div>
                ) : outputResponse ? (
                  <div className="relative group/output flex-1 flex flex-col">
                    <div className="flex-1 bg-[#DFFF00] p-6 text-[#0A0A0A] text-xl sm:text-2xl font-black leading-tight flex items-center justify-center text-center uppercase skew-x-[-1.5deg] border border-[#9ebd00] select-text">
                      &ldquo;{outputResponse.gen_z_text}&rdquo;
                    </div>
                    
                    {/* Tiny slang interpretation rating */}
                    <div className="absolute bottom-2 left-2 bg-black text-[#DFFF00] px-2 py-0.5 text-[9px] uppercase font-mono tracking-wider font-bold">
                      🔥 Bussin Meter: Checked & Approved
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 bg-[#121212] p-8 border border-[#333] border-dashed text-zinc-600 text-center flex flex-col items-center justify-center">
                    <Flame className="w-8 h-8 text-zinc-700 mb-2 animate-pulse" />
                    <p className="text-xs uppercase tracking-widest font-bold text-zinc-500">Translation is Empty</p>
                    <p className="text-[11px] text-zinc-600 mt-1 max-w-sm">
                      Press that fat button below or click an example above to generate your pure authentic brainrot slang.
                    </p>
                  </div>
                )}
              </div>

            </div>

            {/* Bottom Generate Trigger Toolbar */}
            <div className="h-20 border-t border-[#333] flex items-center px-6 md:px-8 justify-between bg-[#0F0F0F] gap-4">
              <div className="flex gap-4 sm:gap-8">
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase text-[#666] font-bold tracking-wider">Generated Tokens</span>
                  <span className="text-xs font-mono text-white">
                    {outputResponse?.tokens_generated || 0} <span className="text-[#555]">/ {maxNewTokens}</span>
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase text-[#666] font-bold tracking-wider">Model Latency</span>
                  <span className="text-xs font-mono text-white">
                    {latency ? `${latency}ms` : "N/A"}
                  </span>
                </div>
              </div>

              <button
                onClick={handleTranslate}
                disabled={isLoading || !inputText.trim()}
                className={`px-6 sm:px-10 h-12 text-xs font-black uppercase tracking-widest transition-all skew-x-[-2deg] flex items-center gap-2 ${
                  isLoading || !inputText.trim() 
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700" 
                    : "bg-white text-black hover:bg-[#DFFF00] hover:scale-103 active:scale-98 shadow-[4px_4px_0px_#FF00FF] hover:shadow-[4px_4px_0px_#DFFF00]"
                }`}
              >
                <span>Slay Translation</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[3px]" />
              </button>
            </div>
          </section>

          {/* RIGHT SECTION: Modifiers & Advanced sliders controls */}
          <aside className="w-full lg:w-[38%] bg-[#0F0F0F] p-6 md:p-8 flex flex-col justify-between gap-8">
            
            <div className="flex flex-col">
              {/* Header with clear state logic */}
              <div className="flex items-center justify-between mb-6 pb-2 border-b border-[#333]">
                <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-white">
                  Modifiers & Presets
                </h3>
                <button
                  onClick={handleResetModifiers}
                  title="Restore default tuning parameters"
                  className="text-[10px] text-zinc-500 hover:text-[#DFFF00] transition-colors flex items-center gap-1 font-mono uppercase"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Persona presets container */}
              <div className="mb-8">
                <span className="text-[10px] uppercase tracking-widest text-[#666] font-bold block mb-3">
                  Persona Settings Preset
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset)}
                      className={`text-left p-3 border transition-all ${
                        selectedPresetId === preset.id
                          ? "bg-zinc-900 border-[#DFFF00] text-white"
                          : "bg-[#141414] border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs font-display">
                        <span>{preset.emoji}</span>
                        <span className="truncate">{preset.name.replace(" (Default)", "")}</span>
                      </div>
                      <div className="text-[9px] text-[#666] mt-1.5 line-clamp-1 italic font-mono">
                        {preset.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* SLIDERS METRICS */}
              <div className="space-y-6">
                
                {/* Temperature modifier */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
                    <label className="text-[#999]">Slang Temperature</label>
                    <span className="font-mono text-[#DFFF00] bg-zinc-900 px-1.5 py-0.5 border border-zinc-800">
                      {temperature.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0.0"
                      max="2.0"
                      step="0.05"
                      value={temperature}
                      onChange={(e) => {
                        setTemperature(Number(e.target.value));
                        setSelectedPresetId("custom");
                      }}
                      className="w-full h-1 bg-[#222] appearance-none cursor-pointer accent-[#DFFF00] focus:outline-none"
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                    <span>Chill (0.00)</span>
                    <span>Wild / Chaotic (2.00)</span>
                  </div>
                </div>

                {/* Nucleus top_p modifier */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
                    <label className="text-[#999]">Top-P (Nucleus)</label>
                    <span className="font-mono text-[#FF00FF] bg-zinc-900 px-1.5 py-0.5 border border-zinc-800">
                      {topP.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.05"
                      value={topP}
                      onChange={(e) => {
                        setTopP(Number(e.target.value));
                        setSelectedPresetId("custom");
                      }}
                      className="w-full h-1 bg-[#222] appearance-none cursor-pointer accent-[#FF00FF] focus:outline-none"
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                    <span>Direct (0.00)</span>
                    <span>Broad (1.00)</span>
                  </div>
                </div>

                {/* Max New Tokens modifier */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
                    <label className="text-[#999]">Max Tokens</label>
                    <span className="font-mono text-white bg-zinc-900 px-1.5 py-0.5 border border-zinc-800">
                      {maxNewTokens}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="10"
                      max="512"
                      value={maxNewTokens}
                      onChange={(e) => setMaxNewTokens(Number(e.target.value))}
                      className="w-full h-1 bg-[#222] appearance-none cursor-pointer accent-white focus:outline-none"
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                    <span>Min (10)</span>
                    <span>Max (512)</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Custom Instruction Box at bottom */}
            <div className="flex-1 flex flex-col justify-end min-h-[120px] pt-4 border-t border-zinc-900">
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[10px] uppercase tracking-widest text-[#666] font-bold">
                  System Prompt Override
                </label>
                <span className="text-[9px] text-zinc-650 font-mono">
                  {systemPrompt.length} / 500
                </span>
              </div>
              <textarea
                value={systemPrompt}
                onChange={(e) => {
                  setSystemPrompt(e.target.value.slice(0, 500));
                  setSelectedPresetId("custom");
                }}
                className="w-full bg-[#151515] border border-[#333] p-3 text-[11px] font-mono text-[#AAA] h-24 focus:outline-none focus:border-[#FF00FF] resize-none leading-normal rounded-none"
                placeholder="Give special translation instructions... Limit 500 chars"
              />
            </div>
          </aside>
        </main>

        {/* BOTTOM LEDGER: Real-time Translation Drawer History */}
        <div className="bg-[#050505] p-6 md:p-8 border-t border-[#333]">
          <div className="flex items-center justify-between mb-4 border-b border-[#222] pb-2">
            <div className="flex items-center gap-1.5">
              <History className="w-4 h-4 text-[#DFFF00]" />
              <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-white">
                RECENT COOLS & RECENT SLAYS ({history.length})
              </span>
            </div>
            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="text-[10px] text-red-500 hover:text-red-400 font-mono uppercase hover:underline"
              >
                Wipe Log History
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="py-6 text-center text-xs text-zinc-600 font-mono uppercase tracking-wider">
              No previous translations in this chamber... fr fr.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[220px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
              {history.map((item, index) => (
                <div 
                  key={index}
                  onClick={() => loadFromHistory(item)}
                  className="group relative bg-[#0C0C0C] border border-zinc-800 hover:border-zinc-700 p-4 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[8px] font-mono text-zinc-500 bg-zinc-950 px-1 py-0.5 border border-zinc-900 uppercase">
                      {item.model}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyHistory(item.gen_z_text, index);
                        }}
                        className="p-1 text-zinc-500 hover:text-white hover:bg-zinc-900"
                        title="Copy slang translation"
                      >
                        {copiedHistoryIndex === index ? (
                          <Check className="w-3 h-3 text-[#FF00FF]" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteHistoryItem(index);
                        }}
                        className="p-1 text-zinc-500 hover:text-red-500 hover:bg-zinc-900"
                        title="Delete log"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-500 italic truncate mb-1">
                    &quot;{item.input_text}&quot;
                  </p>
                  
                  <p className="text-xs font-bold text-zinc-200 line-clamp-2">
                    {item.gen_z_text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BOTTOM METADATA LEVEE BAR */}
        <footer className="h-auto md:h-12 bg-black border-t border-[#333] flex flex-col md:flex-row items-center px-6 md:px-8 py-3 md:py-0 justify-between gap-2 text-center md:text-left">
          <div className="text-[9px] text-[#555] uppercase tracking-[0.3em] font-mono">
            Verified Authentic Brainrot Slavic Engine v4.2 // 2026 Release
          </div>
          <div className="flex gap-4 items-center">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]"></div>
            <span className="text-[9px] text-emerald-500 uppercase tracking-widest font-mono font-bold">
              API Status: Active and Slaying
            </span>
          </div>
        </footer>

      </div>
    </div>
  );
}
