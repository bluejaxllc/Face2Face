import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, UserX, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Report {
  id: number;
  reporterId: number;
  reportedId: number;
  reason: string;
  details: string;
  status: string;
  createdAt: string;
}

export default function SafetyHub() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = () => {
    setLoading(true);
    fetch("/api/reports")
      .then((res) => res.json())
      .then((data) => {
        setReports(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch reports", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await fetch(`/api/reports/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchReports();
    } catch (err) {
      console.error(err);
    }
  };

  const handleBanUser = async (userId: number, reportId: number) => {
    try {
      await fetch(`/api/users/${userId}/ban`, { method: "POST" });
      await handleUpdateStatus(reportId, "action_taken");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-pink-500" />
            Safety & Moderation Hub
          </h2>
          <p className="text-sm text-slate-400">Review flagged content and manage user bans.</p>
        </div>
        <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-sm font-medium text-white">
          <span className="text-pink-400 mr-2">{reports.filter(r => r.status === 'pending').length}</span>
          Pending Reports
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-xl backdrop-blur-sm">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <CheckCircle className="w-12 h-12 text-emerald-500/50 mb-3" />
            <p>No active reports to review.</p>
            <p className="text-xs mt-1">The community is safe and clean.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {reports.map((report) => (
              <motion.div 
                key={report.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-4 sm:p-6 hover:bg-slate-800/30 transition-colors ${report.status === 'pending' ? 'bg-slate-800/20' : ''}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                        report.status === 'pending' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        report.status === 'dismissed' ? 'bg-slate-500/20 text-slate-400 border border-slate-500/30' :
                        'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                      }`}>
                        {report.status.replace('_', ' ')}
                      </span>
                      <span className="text-sm font-medium text-slate-300">
                        Reason: <span className="text-white">{report.reason}</span>
                      </span>
                    </div>
                    
                    <p className="text-sm text-slate-400">
                      User <span className="text-blue-400 font-mono">#{report.reporterId}</span> reported User <span className="text-pink-400 font-mono">#{report.reportedId}</span>
                    </p>
                    {report.details && (
                      <p className="text-sm text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800 mt-2">
                        "{report.details}"
                      </p>
                    )}
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Clock className="w-3 h-3" />
                      {new Date(report.createdAt).toLocaleString()}
                    </div>
                  </div>

                  {report.status === 'pending' && (
                    <div className="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0 mt-4 sm:mt-0">
                      <Button 
                        onClick={() => handleBanUser(report.reportedId, report.id)}
                        className="flex-1 sm:flex-none h-9 text-xs bg-pink-600 hover:bg-pink-700 text-white"
                      >
                        <UserX className="w-3.5 h-3.5 mr-2" /> Ban User
                      </Button>
                      <Button 
                        onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                        variant="outline"
                        className="flex-1 sm:flex-none h-9 text-xs border-slate-700 hover:bg-slate-800 text-slate-300"
                      >
                        Dismiss
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
