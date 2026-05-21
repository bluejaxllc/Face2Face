import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, Heart, Sparkles, User, Mail, Phone, Link as LinkIcon, Building, MapPin } from "lucide-react";
import { useLocation } from "wouter";

const waitlistSchema = z.object({
  name: z.string().min(2, "Contact person must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  businessName: z.string().min(2, "Business name is required"),
  location: z.string().min(2, "Location is required"),
  phone: z.string().min(5, "Contact phone is required").optional().or(z.literal("")),
  socialLink: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

type WaitlistFormData = z.infer<typeof waitlistSchema>;

export default function BusinessWaitlist() {
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const form = useForm<WaitlistFormData>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: {
      name: "",
      email: "",
      businessName: "",
      location: "",
      phone: "",
      socialLink: "",
    },
  });

  const onSubmit = async (data: WaitlistFormData) => {
    setIsSubmitting(true);
    setErrorMsg("");
    
    try {
      const waitlistData = {
        ...data,
        type: 'business'
      };

      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(waitlistData),
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.message || "Failed to join waitlist");
      }
      
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden text-slate-50 font-sans p-4 sm:p-6 md:p-8">
      {/* Dynamic Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/30 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-pink-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '10s' }} />
      
      <div className="w-full max-w-md relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl mb-6 shadow-[0_0_30px_rgba(59,130,246,0.3)] backdrop-blur-xl border border-white/10">
            <Building className="w-8 h-8 text-blue-400" />
            <Sparkles className="w-8 h-8 text-pink-400 -ml-2" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
            Business Partner
          </h1>
          <p className="text-slate-400 text-lg sm:text-xl font-medium max-w-sm mx-auto leading-relaxed">
            Join the exclusive business waitlist to connect locally on Face 2 Face.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.4 }}
              className="bg-slate-900/50 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-slate-700/50 shadow-2xl"
            >
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                
                <div className="space-y-1 relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Building className="w-5 h-5 text-slate-500" />
                  </div>
                  <input 
                    {...form.register("businessName")}
                    placeholder="Business Name *"
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                  />
                  {form.formState.errors.businessName && (
                    <p className="text-pink-500 text-sm pl-2 pt-1.5">{form.formState.errors.businessName.message}</p>
                  )}
                </div>

                <div className="space-y-1 relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <MapPin className="w-5 h-5 text-slate-500" />
                  </div>
                  <input 
                    {...form.register("location")}
                    placeholder="Location / Address *"
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                  />
                  {form.formState.errors.location && (
                    <p className="text-pink-500 text-sm pl-2 pt-1.5">{form.formState.errors.location.message}</p>
                  )}
                </div>

                <div className="space-y-1 relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-slate-500" />
                  </div>
                  <input 
                    {...form.register("name")}
                    placeholder="Contact Person *"
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                  />
                  {form.formState.errors.name && (
                    <p className="text-pink-500 text-sm pl-2 pt-1.5">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-1 relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-slate-500" />
                  </div>
                  <input 
                    {...form.register("email")}
                    type="email"
                    placeholder="Email Address *"
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                  />
                  {form.formState.errors.email && (
                    <p className="text-pink-500 text-sm pl-2 pt-1.5">{form.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1 relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Phone className="w-5 h-5 text-slate-500" />
                  </div>
                  <input 
                    {...form.register("phone")}
                    type="tel"
                    placeholder="Phone Number (Optional)"
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                  />
                  {form.formState.errors.phone && (
                    <p className="text-pink-500 text-sm pl-2 pt-1.5">{form.formState.errors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-1 relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <LinkIcon className="w-5 h-5 text-slate-500" />
                  </div>
                  <input 
                    {...form.register("socialLink")}
                    placeholder="Social Media / Website URL (Optional)"
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                  />
                   {form.formState.errors.socialLink && (
                    <p className="text-pink-500 text-sm pl-2 pt-1.5">{form.formState.errors.socialLink.message}</p>
                  )}
                </div>

                {errorMsg && (
                   <motion.div 
                     initial={{ opacity: 0, height: 0 }} 
                     animate={{ opacity: 1, height: 'auto' }}
                     className="bg-pink-500/10 border border-pink-500/20 text-pink-400 p-3 rounded-lg text-sm text-center"
                   >
                     {errorMsg}
                   </motion.div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full group relative flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-xl py-4 transition-all duration-300 shadow-[0_4px_20px_rgba(59,130,246,0.4)] hover:shadow-[0_4px_25px_rgba(59,130,246,0.6)] disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Apply as Partner</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => setLocation("/")}
                  className="w-full text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors pt-2"
                >
                  Back to App
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900/50 backdrop-blur-2xl rounded-3xl p-8 sm:p-10 border border-slate-700/50 shadow-2xl text-center"
            >
              <div className="w-20 h-20 mx-auto bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                <Sparkles className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">Welcome Aboard!</h2>
              <p className="text-slate-400 mb-8 max-w-[280px] mx-auto leading-relaxed">
                Thank you for applying to be a Face 2 Face Business Partner. We will be in touch with you shortly.
              </p>
              <button
                onClick={() => setLocation("/")}
                className="w-full max-w-[250px] mx-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium rounded-xl py-3.5 transition-all duration-300"
              >
                Back to Dashboard <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
