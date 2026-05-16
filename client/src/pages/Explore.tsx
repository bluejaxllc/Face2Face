import { PageTransition } from "@/components/PageTransition";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { Users, Search } from "lucide-react";

export default function Explore() {
    return (
        <PageTransition className="h-screen w-full page-dark relative overflow-hidden backdrop-blur-md">
            <Header />
            <div className="fixed left-0 right-0 overflow-y-auto px-4" style={{ top: "40px", bottom: "64px" }}>
                <div className="w-full max-w-md mx-auto h-full flex flex-col pt-4">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Groups & Lists</span>
                        </h1>
                    </div>
                    
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50 mt-10">
                        <Users className="w-16 h-16 text-slate-600 mb-4" />
                        <h2 className="text-xl font-bold text-slate-300">Coming Soon</h2>
                        <p className="text-slate-400 mt-2">
                            Discover curated groups and lists of interesting people nearby. This feature is currently under development.
                        </p>
                    </div>
                </div>
            </div>
            
            <BottomNavigation />
        </PageTransition>
    );
}
