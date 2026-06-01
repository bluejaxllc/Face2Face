import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Briefcase, Mail, Phone, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Waitlist {
  id: number;
  type: string;
  name: string;
  email: string;
  businessName: string | null;
  location: string | null;
  phone: string | null;
  socialLink: string | null;
  createdAt: string;
}

export default function WaitlistCRM() {
  const [waitlists, setWaitlists] = useState<Waitlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'business' | 'individual'>('all');

  useEffect(() => {
    setLoading(true);
    const url = filter === 'all' ? '/api/waitlists' : `/api/waitlists?type=${filter}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setWaitlists(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch waitlists", err);
        setLoading(false);
      });
  }, [filter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-purple-400" />
            Waitlist CRM
          </h2>
          <p className="text-sm text-slate-400">Track businesses and evangelists ready to launch.</p>
        </div>
        
        <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800 self-start sm:self-auto">
          <button 
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('business')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === 'business' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Business
          </button>
          <button 
            onClick={() => setFilter('individual')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === 'individual' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Individuals
          </button>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-xl backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-slate-950/50 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Name / Business</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Location</th>
                <th className="px-6 py-4 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Loading CRM data...
                  </td>
                </tr>
              ) : waitlists.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <Users className="w-10 h-10 mx-auto text-slate-700 mb-2" />
                    No signups found for this category.
                  </td>
                </tr>
              ) : (
                waitlists.map((entry) => (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={entry.id} 
                    className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      {entry.type === 'business' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-bold uppercase tracking-wider border border-purple-500/20">
                          <Briefcase className="w-3 h-3" /> Business
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider border border-blue-500/20">
                          <Users className="w-3 h-3" /> Evangelist
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{entry.businessName || entry.name}</div>
                      {entry.businessName && <div className="text-xs text-slate-400 mt-0.5">Contact: {entry.name}</div>}
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        <a href={`mailto:${entry.email}`} className="hover:text-blue-400 transition-colors">{entry.email}</a>
                      </div>
                      {entry.phone && (
                        <div className="flex items-center gap-2 text-slate-400 text-xs">
                          <Phone className="w-3.5 h-3.5 text-slate-600" />
                          {entry.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {entry.location || <span className="text-slate-600 italic">Unspecified</span>}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
