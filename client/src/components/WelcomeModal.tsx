import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, RotateCw, Heart, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { Logo } from "./Logo";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const stepVariants = {
  hidden: { opacity: 0, x: -20 },
  show: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.15 * i, type: "spring", stiffness: 300, damping: 24 }
  })
};

export default function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-slate-900 border border-slate-700/50">
        <div className="sr-only">
          <DialogTitle>Welcome to Face2Face</DialogTitle>
          <DialogDescription>Meet people in real life, your way</DialogDescription>
        </div>
        <div className="bg-gradient-to-br from-blue-600/30 via-pink-500/20 to-slate-900 p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.15),transparent_70%)]" />
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="relative z-10"
          >
            <Logo className="w-16 h-14 mx-auto mb-3 drop-shadow-lg" />
          </motion.div>
          <h2 className="text-3xl font-black text-white font-heading tracking-tight relative z-10">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-pink-500">Face2Face</span>
          </h2>
          <p className="text-slate-300 mt-2 text-sm tracking-wide relative z-10">Meet people in real life, your way</p>
        </div>

        <div className="p-6 space-y-5">
          {[
            { icon: MapPin, color: "text-blue-400", bg: "from-blue-500/20 to-blue-500/5", title: "Location-Based Discovery", desc: "Find people near you on the live map" },
            { icon: RotateCw, color: "text-pink-400", bg: "from-pink-500/20 to-pink-500/5", title: "Connect with Real People", desc: "Spam-free, bot-free — only genuine connections nearby" },
            { icon: Heart, color: "text-rose-400", bg: "from-rose-500/20 to-rose-500/5", title: "Choose Your Style", desc: "Select \"Casual\" for hanging out or \"Intimate\" for more" },
            { icon: ShieldCheck, color: "text-emerald-400", bg: "from-emerald-500/20 to-emerald-500/5", title: "100% Real People", desc: "No bots, no fake accounts, no inactive profiles — ever" },
          ].map((step, i) => (
            <motion.div
              key={step.title}
              custom={i}
              variants={stepVariants}
              initial="hidden"
              animate="show"
              className="flex items-center"
            >
              <div className={`rounded-xl bg-gradient-to-br ${step.bg} p-3 mr-4 border border-slate-700/50`}>
                <step.icon className={`h-5 w-5 ${step.color}`} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 text-sm">{step.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{step.desc}</p>
              </div>
            </motion.div>
          ))}

          <div className="border border-slate-700/50 rounded-xl p-4 bg-slate-800/30">
            <p className="text-sm text-slate-300 text-center italic">
              "Every profile is a real person nearby — no bots, no ghost accounts"
            </p>
          </div>

          <Button
            className="w-full bg-gradient-to-r from-blue-500 to-pink-500 hover:from-blue-600 hover:to-pink-600 text-white font-bold shadow-lg shadow-blue-500/25 rounded-xl h-12"
            onClick={onClose}
          >
            Get Started
          </Button>

          <p className="text-xs text-slate-500 text-center">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
