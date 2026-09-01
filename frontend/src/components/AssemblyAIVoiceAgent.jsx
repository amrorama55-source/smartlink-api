import React, { useState, useEffect } from 'react';
import { Mic, Radio, Sparkles, Play, ShieldAlert, TrendingUp, Globe2, Activity } from 'lucide-react';

export default function AssemblyAIVoiceAgent({ onQueryResult, currentLoading }) {
  const [voiceActive, setVoiceActive] = useState(false);
  const [activeQueryIndex, setActiveQueryIndex] = useState(null);
  const [transcribedText, setTranscribedText] = useState('');
  const [agentStatus, setAgentStatus] = useState('Standby');
  const [audioBars, setAudioBars] = useState(new Array(36).fill(15));
  const [speaking, setSpeaking] = useState(false);

  const sampleQueries = [
    {
      badge: 'Bot Shield',
      badgeColor: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
      icon: ShieldAlert,
      title: 'Audit Bot vs Real Human Clicks',
      text: 'Scan the ClickHouse clickstream and calculate the exact percentage of bot scraper traffic.',
      query: 'What is the percentage of bot clicks compared to human clicks? Show breakdown by is_bot.'
    },
    {
      badge: 'Social Matrix',
      badgeColor: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
      icon: TrendingUp,
      title: 'Top Social Traffic Channels',
      text: 'Which platforms generated the highest click volume this week? Rank them in a visual chart.',
      query: 'List the top referrers by click count and show them as a chart.'
    },
    {
      badge: 'Geo Analytics',
      badgeColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
      icon: Globe2,
      title: 'Worldwide Geographic Distribution',
      text: 'Break down global campaign impressions and clicks across top performing countries.',
      query: 'Show me the distribution of clicks grouped by country.'
    }
  ];

  // Dynamic soundwave equalizer animation
  useEffect(() => {
    let interval;
    if (voiceActive || speaking) {
      interval = setInterval(() => {
        setAudioBars(
          new Array(36).fill(0).map(() => Math.floor(Math.random() * 75) + 20)
        );
      }, 75);
    } else {
      setAudioBars(new Array(36).fill(12));
    }
    return () => clearInterval(interval);
  }, [voiceActive, speaking]);

  const runVoiceQuery = async (queryItem, index) => {
    setActiveQueryIndex(index);
    setVoiceActive(true);
    setAgentStatus('Listening & Streaming...');
    setTranscribedText('');

    const words = queryItem.text.split(' ');
    let current = '';

    for (let i = 0; i < words.length; i++) {
      await new Promise(r => setTimeout(r, 70));
      current += (i === 0 ? '' : ' ') + words[i];
      setTranscribedText(current);
    }

    setAgentStatus('Universal-3.5: Finalized (98.6% Conf.)');
    await new Promise(r => setTimeout(r, 350));

    setAgentStatus('Querying ClickHouse Engine...');
    
    try {
      if (onQueryResult) {
        await onQueryResult(queryItem.query);
      }
      setAgentStatus('Visualizing Live Analytics');

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance("Analysis completed. Updating dashboard charts now.");
        utterance.rate = 1.05;
        utterance.onstart = () => setSpeaking(true);
        utterance.onend = () => {
          setSpeaking(false);
          setVoiceActive(false);
          setActiveQueryIndex(null);
          setAgentStatus('Standby');
        };
        window.speechSynthesis.speak(utterance);
      } else {
        setVoiceActive(false);
        setActiveQueryIndex(null);
        setAgentStatus('Standby');
      }
    } catch (err) {
      setAgentStatus('Error executing query');
      setVoiceActive(false);
      setActiveQueryIndex(null);
    }
  };

  return (
    <div className="relative mb-8 overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-slate-700/60">
      
      {/* Subtle modern ambient background glow */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-blue-600/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-indigo-600/15 blur-3xl" />

      {/* Top Bar: Clean Identity & Live Status */}
      <div className="relative z-10 mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/60 pb-4">
        
        {/* Left Branding */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 p-0.5 shadow-lg shadow-indigo-500/25">
            <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-950/40 backdrop-blur-sm">
              <Mic className={`h-5 w-5 text-blue-200 transition-transform duration-300 ${voiceActive ? 'scale-110 text-white' : ''}`} />
            </div>
            {voiceActive && (
              <span className="absolute -inset-1 animate-ping rounded-2xl bg-blue-500/30 duration-1000" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold tracking-tight text-white">
                AssemblyAI Voice Intelligence
              </h3>
              <span className="flex items-center gap-1 rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-400">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                Universal-3.5 Pro
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Conversational speech agent with real-time sub-second query execution
            </p>
          </div>
        </div>

        {/* Right Status Badge */}
        <div className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-1.5 text-xs text-slate-300 shadow-inner">
          <Activity className={`h-3.5 w-3.5 ${voiceActive ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
          <span className="text-slate-500">Engine:</span>
          <span className={`font-medium ${voiceActive ? 'text-emerald-400' : 'text-slate-300'}`}>
            {agentStatus}
          </span>
        </div>
      </div>

      {/* Main Content: Two Columns */}
      <div className="relative z-10 grid grid-cols-1 gap-6 lg:grid-cols-12">
        
        {/* Left: Live Speech Monitor & Waveform (7 cols) */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-slate-950/50 p-5 backdrop-blur-md lg:col-span-7">
          
          <div className="mb-3 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <Radio className="h-3 w-3 text-blue-400" />
              Live Speech-to-Text Stream
            </span>
            <span className="text-slate-500">Latency: ~220ms</span>
          </div>

          {/* Speech Text Box */}
          <div className="my-2 min-h-[56px] flex items-center">
            {transcribedText ? (
              <p className="text-sm font-medium leading-relaxed text-slate-100">
                <span className="text-blue-400 font-serif text-lg leading-none mr-1">“</span>
                {transcribedText}
                <span className="inline-block h-4 w-1 bg-blue-400 ml-1 animate-pulse" />
              </p>
            ) : (
              <p className="text-xs text-slate-500 italic">
                Select a query chip on the right to trigger instant voice transcription &amp; ClickHouse analytics...
              </p>
            )}
          </div>

          {/* High-End Soundwave Visualizer */}
          <div className="mt-4 flex items-center gap-1 h-8 rounded-lg bg-slate-900/40 px-2.5 border border-slate-800/50">
            {audioBars.map((height, i) => (
              <div
                key={i}
                className="flex-1 rounded-full bg-gradient-to-t from-blue-600 via-indigo-400 to-cyan-300 transition-all duration-75"
                style={{
                  height: `${height}%`,
                  opacity: voiceActive || speaking ? 0.9 : 0.25
                }}
              />
            ))}
          </div>
        </div>

        {/* Right: Modern Query Chips (5 cols) */}
        <div className="flex flex-col justify-between gap-2.5 lg:col-span-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-400" />
              Instant Voice Scenarios
            </span>
            <span className="text-[10px] text-slate-500">Click to run</span>
          </div>

          <div className="flex flex-col gap-2">
            {sampleQueries.map((item, idx) => {
              const Icon = item.icon;
              const isCurrent = activeQueryIndex === idx;

              return (
                <button
                  key={idx}
                  onClick={() => runVoiceQuery(item, idx)}
                  disabled={voiceActive || currentLoading}
                  className={`group relative flex items-center justify-between rounded-xl border p-3 text-left transition-all duration-200 ${
                    isCurrent
                      ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                      : 'border-slate-800/80 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-800/40'
                  } disabled:opacity-50`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${item.badgeColor}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-xs font-semibold text-slate-200 group-hover:text-white">
                          {item.title}
                        </span>
                      </div>
                      <p className="truncate text-[11px] text-slate-500 group-hover:text-slate-400">
                        {item.badge}
                      </p>
                    </div>
                  </div>

                  <div className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 group-hover:border-blue-500/40 group-hover:bg-blue-600/20 group-hover:text-blue-400 transition">
                    <Play className="h-3 w-3 fill-current" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
