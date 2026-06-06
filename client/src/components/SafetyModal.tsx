import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldAlert, AlertTriangle, Users, MapPin, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

interface SafetyModalProps {
    isOpen: boolean;
    onAccept: () => void;
    isUpdating: boolean;
}

const stepVariants = {
    hidden: { opacity: 0, x: -20 },
    show: (i: number) => ({
        opacity: 1,
        x: 0,
        transition: { delay: 0.1 * i, type: "spring", stiffness: 300, damping: 24 }
    })
};

export default function SafetyModal({ isOpen, onAccept, isUpdating }: SafetyModalProps) {
    const [agreed, setAgreed] = useState(false);

    // Prevent closing by clicking outside or pressing escape
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            // Do nothing to prevent closing
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent
                className="sm:max-w-md p-0 bg-slate-900 border border-slate-700/50 max-h-[90vh] overflow-y-auto [&>button]:hidden"
                onInteractOutside={(e) => { e.preventDefault(); }}
                onEscapeKeyDown={(e) => { e.preventDefault(); }}
            >
                <div className="sr-only">
                    <DialogTitle>Safety Recommendations</DialogTitle>
                    <DialogDescription>Important safety guidelines for using Face2Face</DialogDescription>
                </div>

                <div className="bg-gradient-to-br from-orange-600/30 via-red-500/20 to-slate-900 p-8 text-center relative overflow-hidden pb-6">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,0.15),transparent_70%)]" />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                        className="relative z-10 flex justify-center mb-4"
                    >
                        <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.5)]">
                            <ShieldAlert className="w-8 h-8 text-orange-400" />
                        </div>
                    </motion.div>
                    <h2 className="text-2xl font-black text-white font-heading tracking-tight relative z-10">
                        Real World <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Safety</span>
                    </h2>
                    <p className="text-slate-300 mt-2 text-sm tracking-wide relative z-10">
                        Please read these guidelines before connecting
                    </p>
                </div>

                <div className="p-6 space-y-5">
                    {[
                        { icon: MapPin, color: "text-amber-400", bg: "from-amber-500/20 to-amber-500/5", title: "Meet in Public", desc: "Always arrange first meetings in populated, public spaces." },
                        { icon: Users, color: "text-blue-400", bg: "from-blue-500/20 to-blue-500/5", title: "Tell a Friend", desc: "Let someone know where you're going and who you're meeting." },
                        { icon: EyeOff, color: "text-rose-400", bg: "from-rose-500/20 to-rose-500/5", title: "Protect Personal Info", desc: "Never share financial details, home addresses, or sensitive info." },
                        { icon: AlertTriangle, color: "text-orange-400", bg: "from-orange-500/20 to-orange-500/5", title: "Trust Your Instincts", desc: "If a situation feels unsafe or uncomfortable, leave immediately." },
                    ].map((step, i) => (
                        <motion.div
                            key={step.title}
                            custom={i}
                            variants={stepVariants}
                            initial="hidden"
                            animate="show"
                            className="flex items-start"
                        >
                            <div className={`rounded-xl bg-gradient-to-br ${step.bg} p-2.5 mr-4 border border-slate-700/50 shrink-0 mt-0.5`}>
                                <step.icon className={`h-4 w-4 ${step.color}`} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-200 text-sm">{step.title}</h3>
                                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{step.desc}</p>
                            </div>
                        </motion.div>
                    ))}

                    <div className="mt-6 pt-5 border-t border-slate-800">
                        <div className="flex items-start space-x-3 mb-5 bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
                            <Checkbox
                                id="safety-agree"
                                checked={agreed}
                                onCheckedChange={(checked) => setAgreed(checked === true)}
                                className="mt-0.5 border-slate-500 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                            />
                            <label
                                htmlFor="safety-agree"
                                className="text-xs text-slate-300 leading-tight cursor-pointer select-none"
                            >
                                I have read the safety guidelines and understand that I am responsible for my own safety when meeting people in the real world.
                            </label>
                        </div>

                        <Button
                            className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold shadow-lg shadow-orange-500/25 rounded-xl h-12 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            onClick={onAccept}
                            disabled={!agreed || isUpdating}
                        >
                            {isUpdating ? "Saving..." : "I Agree & Continue"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
