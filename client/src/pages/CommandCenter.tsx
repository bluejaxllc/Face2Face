import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { Gauge, ShieldAlert, Briefcase, Globe, BarChart3 } from "lucide-react";

import Analytics from "./Analytics"; // We can embed the content or just import it 
// Actually, since Analytics is a full page, it might have its own Header. 
// We will build a clean tab layout and import the components.
import EcosystemMap from "@/components/admin/EcosystemMap";
import SafetyHub from "@/components/admin/SafetyHub";
import WaitlistCRM from "@/components/admin/WaitlistCRM";

// Import Analytics but wrap it to hide its Header/BottomNav if needed, 
// or just use an iframe. Since Analytics is just a component, we can 
// render its inner content if we extract it. For now, let's just link to it
// or build a unified master layout.

export default function CommandCenter() {
  const [activeTab, setActiveTab] = useState<"map" | "safety" | "crm">("map");

  return (
    <PageTransition className="h-screen w-full page-dark flex flex-col bg-slate-950 text-slate-50">
      <Header />
      
      <div className="flex-1 flex flex-col overflow-hidden pb-[64px] pt-[60px]">
        {/* Top Navigation / Tabs */}
        <div className="px-4 sm:px-6 pt-4 pb-2 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl z-10">
          <div className="max-w-5xl mx-auto flex items-center justify-between mb-4">
            <h1 className="text-2xl sm:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 flex items-center gap-2">
              <Gauge className="w-7 h-7 text-blue-400" />
              Master Command Center
            </h1>
            
            <a 
              href="/analytics" 
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-colors rounded-xl text-sm font-bold text-white"
            >
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              View Investor Analytics
            </a>
          </div>

          <div className="flex overflow-x-auto hide-scrollbar gap-2 max-w-5xl mx-auto">
            <button
              onClick={() => setActiveTab("map")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === "map" 
                  ? "bg-slate-900/80 text-blue-400 border-t border-x border-slate-800" 
                  : "text-slate-400 hover:text-slate-200 border-transparent"
              }`}
            >
              <Globe className="w-4 h-4" /> Live Map
            </button>
            <button
              onClick={() => setActiveTab("safety")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === "safety" 
                  ? "bg-slate-900/80 text-pink-400 border-t border-x border-slate-800" 
                  : "text-slate-400 hover:text-slate-200 border-transparent"
              }`}
            >
              <ShieldAlert className="w-4 h-4" /> Safety Hub
            </button>
            <button
              onClick={() => setActiveTab("crm")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === "crm" 
                  ? "bg-slate-900/80 text-purple-400 border-t border-x border-slate-800" 
                  : "text-slate-400 hover:text-slate-200 border-transparent"
              }`}
            >
              <Briefcase className="w-4 h-4" /> Waitlist CRM
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-slate-950 px-4 sm:px-6 py-6">
          <div className="max-w-5xl mx-auto">
            <AnimatePresence mode="wait">
              {activeTab === "map" && (
                <motion.div
                  key="map"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <EcosystemMap />
                </motion.div>
              )}

              {activeTab === "safety" && (
                <motion.div
                  key="safety"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <SafetyHub />
                </motion.div>
              )}

              {activeTab === "crm" && (
                <motion.div
                  key="crm"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <WaitlistCRM />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      <BottomNavigation />
    </PageTransition>
  );
}
