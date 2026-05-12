import { AlertCircle, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center page-dark px-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="h-10 w-10 text-red-400" />
        </div>
        <h1 className="text-4xl font-black text-white font-heading tracking-tight">404</h1>
        <p className="text-slate-400 mt-2 text-sm">This page doesn't exist or has been moved.</p>
        <button
          onClick={() => setLocation("/")}
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Map
        </button>
      </div>
    </div>
  );
}
