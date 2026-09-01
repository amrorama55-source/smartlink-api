import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import Navbar from '../components/Navbar';
import AssemblyAIVoiceAgent from '../components/AssemblyAIVoiceAgent';
import {
  Sparkles,
  Terminal,
  Send,
  Database,
  Shield,
  TrendingUp,
  Globe,
  Smartphone,
  Info,
  Play
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];

export default function CinemaAnalytics() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      role: 'model',
      content: "🎬 Welcome to CinemaLink AI! I am your autonomous blockbuster marketing analyst. Ask me anything about your campaigns, referrers, regional interest, or bot shields, and I will query ClickHouse to give you real-time insights!"
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [toolLogs, setToolLogs] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [chartTitle, setChartTitle] = useState('Campaign Link Clicks by Referrer');
  const [totalClicks, setTotalClicks] = useState(0);
  const [botPercentage, setBotPercentage] = useState(0);
  
  // Custom manual query runner state
  const [manualSql, setManualSql] = useState('SELECT referrer, count(*) as clicks FROM clicks GROUP BY referrer ORDER BY clicks DESC');
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState('');

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Initial ClickHouse query to get basic dashboard stats
  useEffect(() => {
    runDashboardQueries();
  }, []);

  const runDashboardQueries = async () => {
    try {
      // Get total clicks
      const resTotal = await api.post('/ai/cinema-chat', {
        message: "Run a query to get the total count of clicks and the percentage of clicks where is_bot = 1. Return a JSON structure or summarize it."
      });
      
      // Run direct dashboard queries via backend
      const resReferrer = await api.post('/ai/cinema-chat', {
        message: "Provide a raw breakdown of referrer counts as a SQL query."
      });

      if (resReferrer.data?.toolExecutions?.length > 0) {
        const rows = resReferrer.data.toolExecutions[0].data?.rows || [];
        setChartData(rows.map(r => ({
          name: r.referrer || 'Direct',
          value: Number(r.clicks || r.count || 0)
        })));
      }
    } catch (err) {
      console.warn('Dashboard initialization warning:', err.message);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || loading) return;

    const userMsg = message;
    setMessage('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await api.post('/ai/cinema-chat', {
        message: userMsg,
        chatHistory: chatHistory
      });

      if (res.data?.reply) {
        setChatHistory(prev => [...prev, { role: 'model', content: res.data.reply }]);
      }

      if (res.data?.toolExecutions && res.data.toolExecutions.length > 0) {
        setToolLogs(prev => [...prev, ...res.data.toolExecutions]);
        
        // Dynamically update main chart if analytical rows are returned
        const targetExec = res.data.toolExecutions.find(x => x.tool === 'query_clicks_analytics' && x.data?.rows?.length > 0);
        if (targetExec) {
          const rows = targetExec.data.rows;
          // Dynamically map fields to Recharts format
          const keys = Object.keys(rows[0]);
          const labelKey = keys.find(k => k !== 'count' && k !== 'clicks' && k !== 'is_bot') || keys[0];
          const valKey = keys.find(k => k === 'count' || k === 'clicks') || keys[1] || keys[0];

          setChartData(rows.map(r => ({
            name: String(r[labelKey]),
            value: Number(r[valKey])
          })));
          setChartTitle(`AI Generated View: Clicks grouped by ${labelKey}`);
        }
      }
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'model', content: `❌ Error: ${err.response?.data?.error || err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleRunManualSql = async () => {
    if (!manualSql.trim() || manualLoading) return;
    setManualLoading(true);
    setManualError('');
    try {
      const res = await api.post('/ai/cinema-chat', {
        message: `Run this exact SQL query on clicks table and return the results: ${manualSql}`
      });

      if (res.data?.toolExecutions && res.data.toolExecutions.length > 0) {
        const exec = res.data.toolExecutions[0];
        if (exec.status === 'failed') {
          setManualError(exec.error || 'Query execution failed');
        } else {
          const rows = exec.data?.rows || [];
          if (rows.length > 0) {
            const keys = Object.keys(rows[0]);
            const labelKey = keys[0];
            const valKey = keys[1] || keys[0];

            setChartData(rows.map(r => ({
              name: String(r[labelKey]),
              value: Number(r[valKey])
            })));
            setChartTitle(`Manual SQL View: ${labelKey} vs ${valKey}`);
            setToolLogs(prev => [...prev, exec]); // Append to execution logs
          }
        }
      } else {
        setManualError('No SQL logs returned. Make sure query targets the clicks table.');
      }
    } catch (err) {
      setManualError(err.response?.data?.error || err.message);
    } finally {
      setManualLoading(false);
    }
  };

  const handleVoiceQuery = async (queryText) => {
    setMessage(queryText);
    setChatHistory(prev => [...prev, { role: 'user', content: `🎙️ [Voice Query via AssemblyAI]: ${queryText}` }]);
    setLoading(true);

    try {
      const res = await api.post('/ai/cinema-chat', {
        message: queryText,
        chatHistory: chatHistory
      });

      if (res.data?.reply) {
        setChatHistory(prev => [...prev, { role: 'model', content: res.data.reply }]);
      }

      if (res.data?.toolExecutions && res.data.toolExecutions.length > 0) {
        setToolLogs(prev => [...prev, ...res.data.toolExecutions]);
        
        const targetExec = res.data.toolExecutions.find(x => x.tool === 'query_clicks_analytics' && x.data?.rows?.length > 0);
        if (targetExec) {
          const rows = targetExec.data.rows;
          const keys = Object.keys(rows[0]);
          const labelKey = keys.find(k => k !== 'count' && k !== 'clicks' && k !== 'is_bot') || keys[0];
          const valKey = keys.find(k => k === 'count' || k === 'clicks') || keys[1] || keys[0];

          setChartData(rows.map(r => ({
            name: String(r[labelKey]),
            value: Number(r[valKey])
          })));
          setChartTitle(`Voice Agent View: ${labelKey} Breakdown`);
        }
      }
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'model', content: `❌ Error: ${err.response?.data?.error || err.message}` }]);
    } finally {
      setLoading(false);
      setMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Modern Clean Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-400 text-xs font-semibold rounded-full border border-blue-500/20 backdrop-blur-md">
                ⚡ AssemblyAI Universal-3.5 &amp; Google Cloud Partner Track
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              🎬 CinemaLink &amp; Voice Intelligence
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Autonomous marketing intelligence agent with sub-second voice interactions and ClickHouse big data analytics.
            </p>
          </div>
        </div>

        {/* AssemblyAI Voice Agent Interactive Panel */}
        <AssemblyAIVoiceAgent onQueryResult={handleVoiceQuery} currentLoading={loading} />

        {/* Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-black">ClickHouse DB Status</p>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white">Active (Connected)</h4>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-xl">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-black">Bot Shield Coverage</p>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white">Enabled (Real-time filtering)</h4>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-black">Campaigns Tracked</p>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white">Live Blockbusters</h4>
            </div>
          </div>
        </div>

        {/* Main Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: AI Assistant Chat */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col h-[600px]">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 dark:text-white">Gemini Agent Analyst</h3>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping"></span>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {chatHistory.map((h, i) => (
                <div key={i} className={`flex ${h.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-4 text-sm ${
                    h.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none'
                  }`}>
                    {h.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-none p-4 flex items-center gap-2 text-sm text-gray-500">
                    <div className="animate-bounce">●</div>
                    <div className="animate-bounce delay-100">●</div>
                    <div className="animate-bounce delay-200">●</div>
                    <span>Agent analyzing...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Box Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/20">
              <div className="relative">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask the AI, e.g. 'Compare Twitter vs TikTok clicks'"
                  className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !message.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: ClickHouse Visualizer */}
          <div className="flex flex-col gap-6">
            
            {/* Chart Widget */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white text-base">{chartTitle}</h3>
                <span className="text-[10px] uppercase font-black bg-blue-50 dark:bg-blue-900/20 text-blue-600 px-2 py-0.5 rounded">
                  Recharts Rendered
                </span>
              </div>

              <div className="h-[240px] w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="name" stroke="#888888" fontSize={10} />
                      <YAxis stroke="#888888" fontSize={10} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center text-center text-gray-400 dark:text-gray-600 text-sm">
                    <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No query data loaded. Ask the AI agent above to load data.
                  </div>
                )}
              </div>
            </div>

            {/* SQL Terminal Console */}
            <div className="bg-gray-900 text-gray-100 p-6 rounded-2xl shadow-sm border border-gray-800">
              <div className="flex items-center justify-between mb-3 border-b border-gray-800 pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-amber-500" />
                  <span className="font-bold text-xs uppercase tracking-wider text-amber-500 font-mono">
                    ClickHouse SQL Query Console
                  </span>
                </div>
                <button
                  onClick={handleRunManualSql}
                  disabled={manualLoading}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-bold text-xs rounded flex items-center gap-1 transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  Run
                </button>
              </div>

              <div className="space-y-4">
                <textarea
                  value={manualSql}
                  onChange={(e) => setManualSql(e.target.value)}
                  className="w-full bg-gray-950 text-emerald-400 font-mono text-xs p-3 rounded-lg border border-gray-800 focus:outline-none focus:border-amber-500 h-20"
                  placeholder="SELECT * FROM clicks"
                />
                
                {manualError && (
                  <div className="text-xs text-red-400 bg-red-950/20 border border-red-900/30 p-2 rounded font-mono">
                    Error: {manualError}
                  </div>
                )}

                {/* Execution Logs */}
                <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase">Live SQL Execution Logs</h4>
                  {toolLogs.length > 0 ? (
                    toolLogs.map((log, index) => (
                      <div key={index} className="text-[10px] font-mono border-l-2 border-amber-500 pl-2 py-1 bg-gray-950/50">
                        <div className="text-gray-400">[{new Date().toLocaleTimeString()}] tool call: {log.tool}</div>
                        <div className="text-emerald-500">{log.sql || 'SCHEMA FETCH'}</div>
                        <div className="text-gray-500">Rows returned: {log.data?.rows?.length || 0}</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-gray-600 italic">No SQL executed yet.</p>
                  )}
                </div>
              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
