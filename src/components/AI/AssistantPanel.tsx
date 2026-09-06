import React, { useState, useRef, useEffect } from 'react';
import { usePersona } from '../../context/PersonaContext';
import { useMapContext } from '../../context/MapContext';
import { queryService } from '../../services/queryService';
import { ChatMessage, ChatMessageItem } from './ChatMessage';
import { QueryInput } from './QueryInput';
import { QuickPrompts } from './QuickPrompts';
import { AnalysisLoader } from './AnalysisLoader';
import { PersonaBadge } from '../Persona/PersonaBadge';
import { Bot, Sparkles, Terminal, Trash2, ShieldCheck, CornerDownRight, Crosshair, ArrowRight } from 'lucide-react';

export const AssistantPanel: React.FC = () => {
  const { persona } = usePersona();
  const { activeRegion, drawnBBox, setQueryResult } = useMapContext();

  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      id: 'init-001',
      sender: 'assistant',
      persona: 'PUBLIC_RESEARCHER',
      text: `Hello! I am your SATQUERY multimodal assistant. You can search any location, draw a survey region (AOI), or ask questions about land use, flood inundation, vegetation health, and multi-temporal satellite changes across ${activeRegion.name}.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleExecuteQuery = async (promptText: string) => {
    if (isLoading) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessageItem = {
      id: `user-${Date.now()}`,
      sender: 'user',
      persona,
      text: promptText,
      timestamp: timeStr,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const activeBBox = drawnBBox || activeRegion.bbox;
      const res = await queryService.executeQuery({
        prompt: promptText,
        viewport_bbox: activeBBox,
        persona,
      });

      setQueryResult(res);

      const assistantMsg: ChatMessageItem = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        persona,
        result: res,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const is403 = err.status === 403 || err.data?.error === 'PERMISSION_DENIED';
      const errorMsg: ChatMessageItem = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        persona,
        text: is403
          ? err.data?.message || err.message || 'Security Clearance Denied: Current persona lacks authorization for this geospatial query.'
          : `Analysis notice: ${err.message || 'We could not complete this analysis right now. Try another date range or smaller survey region.'}`,
        isError: !is403,
        permissionDenied: is403,
        requiredPermission: err.data?.required_permission,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Event listener for "Analyze This Region" action from BoundingBoxSelector
  useEffect(() => {
    const onAnalyzeAOI = (e: any) => {
      const prompt = e.detail?.prompt || `Analyze satellite imagery, vegetation canopy, and activity in this survey AOI.`;
      handleExecuteQuery(prompt);
    };

    window.addEventListener('satquery:analyze-aoi', onAnalyzeAOI);
    return () => window.removeEventListener('satquery:analyze-aoi', onAnalyzeAOI);
  }, [drawnBBox, activeRegion, persona]);

  const clearChat = () => {
    setMessages([]);
    setQueryResult(null);
  };

  const openVLMStudio = (mode: string, presetId: string) => {
    window.dispatchEvent(
      new CustomEvent('satquery:open-vlm-studio', {
        detail: { mode, presetId },
      })
    );
  };

  const lastMessage = messages[messages.length - 1];
  const hasResult = lastMessage?.result;

  return (
    <div className="flex flex-col h-full bg-space-950/90 border-l border-slate-800/80 backdrop-blur-xl font-mono text-xs select-none">
      {/* Assistant Header */}
      <div className="px-4 py-3 border-b border-slate-800/80 bg-space-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center shadow-inner">
            <Bot className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="font-bold text-slate-100 text-xs flex items-center gap-1.5 font-sans">
              <span>SATQUERY AI Multimodal Assistant</span>
            </div>
            <div className="text-[10px] text-cyan-400/80 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Mission Control Connected</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <PersonaBadge />
          <button
            onClick={clearChat}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-space-800 transition-colors"
            title="Clear Chat Stream"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ISRO RS-VLM Studio Promotion Banner */}
      <div className="mx-3 mt-3 p-2.5 rounded-xl bg-gradient-to-r from-indigo-950/90 via-space-900 to-cyan-950/90 border border-cyan-500/40 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-300 flex-shrink-0">
            <Crosshair className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-[11px] text-slate-100 flex items-center gap-1.5 font-sans truncate">
              <span>ISRO RS-VLM Studio</span>
              <span className="text-[9px] font-mono px-1 rounded bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 font-bold">
                VLM
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-sans truncate">
              Cartosat-2S &bull; RISAT-1A SAR &bull; Grounded VQA
            </div>
          </div>
        </div>
        <button
          onClick={() => openVLMStudio('OPTICAL_SAR_FUSION', 'isro-cartosat-risat')}
          className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] transition-colors shadow flex items-center gap-1 flex-shrink-0"
        >
          <span>Open</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Message Feed */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-3 scroll-smooth"
      >
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {isLoading && <AnalysisLoader />}

        {/* Dynamic Contextual Follow-up Suggestions with Deep RS-VLM Triggers */}
        {!isLoading && hasResult && (
          <div className="p-3 rounded-xl bg-space-900/60 border border-slate-800/80 space-y-1.5 animate-in fade-in duration-150">
            <div className="text-[10px] text-slate-400 font-sans font-semibold flex items-center gap-1">
              <CornerDownRight className="w-3 h-3 text-cyan-400" />
              <span>Suggested Follow-up Inquiries &amp; VLM Benchmarks:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {lastMessage.result?.intent === 'CHANGE_DETECTION' ? (
                <>
                  <button
                    onClick={() => openVLMStudio('BITEMPORAL_CHANGE', 'cdvqa-assam-flood')}
                    className="px-2 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-[10px] text-cyan-300 font-bold transition-colors flex items-center gap-1"
                  >
                    <span>🛰️ Open CDVQA Bi-Temporal Split Slider</span>
                  </button>
                  <button
                    onClick={() => handleExecuteQuery('Explain what changed in this region and why.')}
                    className="px-2 py-1 rounded-lg bg-space-850 hover:bg-space-800 border border-slate-700 text-[10px] text-slate-300 transition-colors"
                  >
                    "Explain what changed"
                  </button>
                </>
              ) : lastMessage.result?.intent === 'FLOOD_DETECTION' ? (
                <>
                  <button
                    onClick={() => openVLMStudio('OPTICAL_SAR_FUSION', 'isro-cartosat-risat')}
                    className="px-2 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-[10px] text-cyan-300 font-bold transition-colors flex items-center gap-1"
                  >
                    <span>📡 Inspect Cloud-Penetrating SAR Fusion</span>
                  </button>
                  <button
                    onClick={() => handleExecuteQuery('Why did this area experience flooding and what is the rainfall history?')}
                    className="px-2 py-1 rounded-lg bg-space-850 hover:bg-space-800 border border-slate-700 text-[10px] text-slate-300 transition-colors"
                  >
                    "Why did this area flood?"
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => openVLMStudio('SINGLE_VQA', 'vrsbench-airport')}
                    className="px-2 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-[10px] text-cyan-300 font-bold transition-colors flex items-center gap-1"
                  >
                    <span>🎯 Launch Visual Grounding Studio</span>
                  </button>
                  <button
                    onClick={() => handleExecuteQuery('Assess vegetation health index (NDVI) across this footprint.')}
                    className="px-2 py-1 rounded-lg bg-space-850 hover:bg-space-800 border border-slate-700 text-[10px] text-slate-300 transition-colors"
                  >
                    "Calculate NDVI Canopy Health"
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Area: Quick Prompts + Query Input */}
      <div className="p-3 border-t border-slate-800/80 bg-space-900/40 space-y-3">
        <QuickPrompts onSelectPrompt={handleExecuteQuery} />
        <QueryInput onSendQuery={handleExecuteQuery} isLoading={isLoading} />
      </div>
    </div>
  );
};
