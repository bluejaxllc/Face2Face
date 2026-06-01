import { useState } from "react";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { TrendingUp, Users, DollarSign, Activity, ChevronLeft, BarChart3, Zap } from "lucide-react";
import { useLocation } from "wouter";

// --- Mock Data for Investor Pitch ---
const growthData = [
  { month: "Jan", users: 1200 },
  { month: "Feb", users: 3100 },
  { month: "Mar", users: 8400 },
  { month: "Apr", users: 19500 },
  { month: "May", users: 42000 },
  { month: "Jun", users: 95000 },
];

const economicsData = [
  { month: "Jan", cac: 12.5, ltv: 15 },
  { month: "Feb", cac: 11.2, ltv: 18 },
  { month: "Mar", cac: 9.8, ltv: 24 },
  { month: "Apr", cac: 7.5, ltv: 32 },
  { month: "May", cac: 5.2, ltv: 45 },
  { month: "Jun", cac: 3.1, ltv: 68 },
];

const viralityData = [
  { week: "W1", kFactor: 0.8 },
  { week: "W2", kFactor: 0.95 },
  { week: "W3", kFactor: 1.1 },
  { week: "W4", kFactor: 1.35 },
  { week: "W5", kFactor: 1.6 },
  { week: "W6", kFactor: 1.85 },
];

export default function Analytics() {
  const [, setLocation] = useLocation();

  const kpiCards = [
    { title: "Total Users", value: "95.2k", change: "+125%", icon: <Users className="w-5 h-5 text-blue-400" /> },
    { title: "Viral Coefficient", value: "1.85", change: "+0.25", icon: <Zap className="w-5 h-5 text-amber-400" /> },
    { title: "LTV / CAC Ratio", value: "21.9x", change: "+4.1x", icon: <DollarSign className="w-5 h-5 text-emerald-400" /> },
    { title: "Avg. Daily Bumps", value: "84k", change: "+310%", icon: <Activity className="w-5 h-5 text-pink-400" /> },
  ];

  return (
    <PageTransition className="h-screen w-full page-dark flex flex-col bg-slate-950 text-slate-50">
      <Header />
      
      <div className="flex-1 overflow-y-auto pb-[80px] pt-[60px] px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <button 
                onClick={() => setLocation("/dev")}
                className="flex items-center text-slate-400 hover:text-white transition-colors mb-2 text-sm font-medium"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Diagnostics
              </button>
              <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 flex items-center gap-2">
                <BarChart3 className="w-8 h-8 text-blue-400" />
                Investor Analytics
              </h1>
              <p className="text-slate-400 mt-1 font-medium">Real-time growth and unit economics dashboard.</p>
            </div>
            
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-emerald-400 tracking-wider">LIVE DATA</span>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {kpiCards.map((kpi, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 shadow-lg backdrop-blur-sm"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-slate-800/50 rounded-xl">{kpi.icon}</div>
                  <span className="text-[10px] sm:text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                    {kpi.change}
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white mt-2">{kpi.value}</h3>
                <p className="text-xs sm:text-sm text-slate-400 font-medium">{kpi.title}</p>
              </motion.div>
            ))}
          </div>

          {/* Growth Chart */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold text-white">Cumulative User Growth</h2>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ color: '#60a5fa' }}
                  />
                  <Area type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Economics Chart */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg backdrop-blur-sm"
            >
              <div className="flex items-center gap-2 mb-6">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-white">CAC vs LTV</h2>
              </div>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={economicsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                    <Tooltip 
                      cursor={{fill: '#1e293b', opacity: 0.4}}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                    <Bar dataKey="cac" name="CAC" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="ltv" name="LTV" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Virality Chart */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg backdrop-blur-sm"
            >
              <div className="flex items-center gap-2 mb-6">
                <Zap className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold text-white">Viral Coefficient (K-Factor)</h2>
              </div>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={viralityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="week" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                    />
                    {/* The critical K=1 line */}
                    <Line type="step" dataKey={() => 1} stroke="#64748b" strokeDasharray="4 4" dot={false} activeDot={false} name="K=1 Threshold" />
                    <Line type="monotone" dataKey="kFactor" name="K-Factor" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
      <BottomNavigation />
    </PageTransition>
  );
}
