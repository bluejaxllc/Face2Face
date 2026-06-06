import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Smartphone, MapPin, MessageSquare, ShieldCheck, Phone, Eye, EyeOff, Gauge, AlertTriangle } from "lucide-react";
import { Logo } from "@/components/Logo";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";

const registerSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  username: z.string().min(3, "Too short").regex(/^[a-zA-Z0-9_]+$/, "Alphanumeric only"),
  email: z.string().email("Invalid email"),
  phoneNumber: z.string().min(10, "Invalid phone"),
  password: z.string().min(6, "Min 6 chars"),
  confirmPassword: z.string(),
  sex: z.string().min(1, "Required"),
  customSex: z.string().optional(),
  dateOfBirth: z.string().optional().or(z.literal("")),
  age: z.number().min(18, "You must be 18 or older to use Face 2 Face"),
  datingPreference: z.string().default("all"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;
type LoginFormValues = z.infer<typeof loginSchema>;

export default function Register() {
  const [activeTab, setActiveTab] = useState("login");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [regStep, setRegStep] = useState(0);
  const [_, navigate] = useLocation();
  const { login, register } = useAuth();

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
      sex: "",
      customSex: "",
      dateOfBirth: "",
      age: 18,
      datingPreference: "all",
    },
  });

  // Calculate age when DOB changes
  const dobValue = registerForm.watch("dateOfBirth");
  useEffect(() => {
    if (dobValue) {
      const birthDate = new Date(dobValue);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      registerForm.setValue("age", age);
    }
  }, [dobValue, registerForm]);

  const nextStep = async (fields: (keyof RegisterFormValues)[]) => {
    const isValid = await registerForm.trigger(fields);
    if (isValid) {
      setRegStep(prev => prev + 1);
    }
  };

  const prevStep = () => setRegStep(prev => Math.max(0, prev - 1));

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Verification state
  const [showVerification, setShowVerification] = useState(false);
  const [verifyPhone, setVerifyPhone] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const onRegisterSubmit = async (values: RegisterFormValues) => {
    try {
      const finalSex = values.sex === "custom" ? values.customSex || "other" : values.sex;
      const { confirmPassword, customSex, ...registerData } = { ...values, sex: finalSex };
      
      await register(registerData);

      // Send verification code
      setVerifyPhone(values.phoneNumber);
      setIsSendingCode(true);
      try {
        await apiRequest("POST", "/api/verify/send", {
          phoneNumber: values.phoneNumber,
          firstName: values.firstName,
        });
        setShowVerification(true);
        setResendCooldown(60);
      } catch (err) {
        // Still show verification screen, user can resend
        setShowVerification(true);
      } finally {
        setIsSendingCode(false);
      }
    } catch (error) {
      console.error("Registration error:", error);
    }
  };

  const onLoginSubmit = async (values: LoginFormValues) => {
    try {
      await login(values.username, values.password);
      navigate("/map");
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleVerifyCode = async () => {
    if (verifyCode.length !== 6) return;
    setIsVerifying(true);
    setVerifyError("");
    try {
      const res = await apiRequest("POST", "/api/verify/check", {
        phoneNumber: verifyPhone,
        code: verifyCode,
      });
      const data = await res.json();
      if (data.verified) {
        navigate("/map");
      }
    } catch (error: any) {
      setVerifyError("Invalid or expired code. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setIsSendingCode(true);
    try {
      await apiRequest("POST", "/api/verify/send", {
        phoneNumber: verifyPhone,
        firstName: "",
      });
      setResendCooldown(60);
    } catch (error) {
      setVerifyError("Failed to resend code. Please try again.");
    } finally {
      setIsSendingCode(false);
    }
  };

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (showVerification) {
    return (
      <div className="auth-page min-h-screen flex flex-col relative overflow-hidden">
        {/* Dev Diagnostics Bypass Button - Only in development */}
        {import.meta.env.DEV && (
          <button
            onClick={() => navigate("/dev")}
            className="absolute top-4 right-4 z-50 p-3 rounded-full bg-slate-800/80 border border-slate-700/50 hover:bg-slate-700/80 transition-colors shadow-lg"
            aria-label="Developer Diagnostics"
          >
            <Gauge className="w-5 h-5 text-amber-400 animate-pulse" />
          </button>
        )}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center flex flex-col items-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center mb-6">
              <Phone className="w-10 h-10 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Verify Your Phone</h2>
            <p className="text-slate-400 text-sm max-w-xs">
              We sent a 6-digit code to <span className="text-blue-400 font-semibold">{verifyPhone}</span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="auth-card w-full max-w-sm"
          >
            <div className="space-y-5">
              <div>
                <label className="text-slate-300 text-sm font-medium block mb-2">Verification Code</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={verifyCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setVerifyCode(val);
                    setVerifyError("");
                  }}
                  className="auth-input text-center text-2xl tracking-[0.5em] font-bold h-14"
                  autoFocus
                />
              </div>

              {verifyError && (
                <p className="text-red-400 text-sm text-center">{verifyError}</p>
              )}

              <Button
                onClick={handleVerifyCode}
                disabled={verifyCode.length !== 6 || isVerifying}
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25"
              >
                {isVerifying ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</>
                ) : "Verify Phone"}
              </Button>

              <div className="text-center">
                <button
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || isSendingCode}
                  className={`text-sm transition-colors ${resendCooldown > 0 ? 'text-slate-600 cursor-not-allowed' : 'text-blue-400 hover:text-blue-300 cursor-pointer'}`}
                >
                  {isSendingCode ? "Sending..." : resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
                </button>
              </div>

              <p className="text-center text-xs text-slate-400 mt-2">
                Code expires in 5 minutes
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page min-h-screen flex flex-col relative overflow-hidden">
      {/* Dev Diagnostics Bypass Button - Only in development */}
      {import.meta.env.DEV && (
        <button
          onClick={() => navigate("/dev")}
          className="absolute top-4 right-4 z-50 p-3 rounded-full bg-slate-800/80 border border-slate-700/50 hover:bg-slate-700/80 transition-colors shadow-lg"
          aria-label="Developer Diagnostics"
        >
          <Gauge className="w-5 h-5 text-amber-400 animate-pulse" />
        </button>
      )}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-4 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 md:mb-8 text-center flex flex-col items-center"
        >
          <Logo className="w-16 h-16 md:w-24 md:h-24 mb-3 md:mb-4 logo-breathe" />
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-500 title-shimmer">Face2Face</span>
          </h1>
          <p className="text-slate-400 text-sm tracking-wide">Meet Someone.</p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 text-[11px] font-semibold tracking-wide">No bots. No inactive profiles. Real people only.</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="hidden md:flex gap-3 mb-8 flex-wrap justify-center"
        >
          {[
            { icon: Smartphone, text: "Connect instantly" },
            { icon: MapPin, text: "Find nearby" },
            { icon: MessageSquare, text: "Chat instantly" },
            { icon: ShieldCheck, text: "100% real people" },
          ].map((item, i) => (
            <motion.div
              key={item.text}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
              className="feature-pill"
            >
              <item.icon className="w-3.5 h-3.5" />
              <span>{item.text}</span>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="auth-card w-full max-w-md"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-6 bg-slate-800/50 border border-slate-700/50 rounded-xl p-1">
              <TabsTrigger
                value="login"
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 text-slate-400 transition-all duration-300"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-pink-500/25 text-slate-400 transition-all duration-300"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-0">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 text-sm font-medium">Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your username" {...field} className="auth-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 text-sm font-medium">Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type={showLoginPassword ? "text" : "password"} placeholder="Enter your password" {...field} className="auth-input pr-10" />
                            <button
                              type="button"
                              onClick={() => setShowLoginPassword(!showLoginPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                              tabIndex={-1}
                            >
                              {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]"
                    disabled={loginForm.formState.isSubmitting}
                  >
                    {loginForm.formState.isSubmitting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</>
                    ) : "Sign In"}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="register" className="mt-0">
              <Form {...registerForm}>
                <form
                  onSubmit={(e) => {
                    if (regStep < 4) {
                      e.preventDefault();
                    } else {
                      registerForm.handleSubmit(onRegisterSubmit)(e);
                    }
                  }}
                  className="space-y-4"
                >
                  {regStep === 0 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 text-center">
                      <div className="py-6">
                        <h2 className="text-2xl font-black text-white mb-2">First, pick a username</h2>
                        <p className="text-slate-400 text-sm">This is how you'll be identified on the map</p>
                      </div>
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Enter username" {...field} className="auth-input h-14 text-lg text-center" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="button" onClick={() => nextStep(["username"])} className="w-full h-14 bg-pink-500 hover:bg-pink-600 text-white font-black text-lg rounded-2xl shadow-lg shadow-pink-500/20">Next</Button>
                    </motion.div>
                  )}

                  {regStep === 1 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 text-center">
                      <div className="py-6">
                        <h2 className="text-2xl font-black text-white mb-2">Create a password</h2>
                        <p className="text-slate-400 text-sm">Make it strong to keep your profile secure</p>
                      </div>
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="relative">
                                <Input type={showRegisterPassword ? "text" : "password"} placeholder="Enter password" {...field} className="auth-input h-14 text-lg text-center pr-12" />
                                <button
                                  type="button"
                                  onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                                >
                                  {showRegisterPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex gap-4">
                        <Button type="button" onClick={prevStep} variant="ghost" className="h-14 px-6 text-slate-400">Back</Button>
                        <Button type="button" onClick={() => nextStep(["password"])} className="flex-1 h-14 bg-pink-500 hover:bg-pink-600 text-white font-black text-lg rounded-2xl shadow-lg shadow-pink-500/20">Next</Button>
                      </div>
                    </motion.div>
                  )}

                  {regStep === 2 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 text-center">
                      <div className="py-6">
                        <h2 className="text-2xl font-black text-white mb-2">Confirm your password</h2>
                        <p className="text-slate-400 text-sm">Just to make sure there are no typos</p>
                      </div>
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="relative">
                                <Input type={showConfirmPassword ? "text" : "password"} placeholder="Confirm password" {...field} className="auth-input h-14 text-lg text-center pr-12" />
                                <button
                                  type="button"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                                >
                                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex gap-4">
                        <Button type="button" onClick={prevStep} variant="ghost" className="h-14 px-6 text-slate-400">Back</Button>
                        <Button type="button" onClick={() => nextStep(["confirmPassword"])} className="flex-1 h-14 bg-pink-500 hover:bg-pink-600 text-white font-black text-lg rounded-2xl shadow-lg shadow-pink-500/20">Next</Button>
                      </div>
                    </motion.div>
                  )}

                  {regStep === 3 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 text-center">
                      <div className="py-6">
                        <h2 className="text-2xl font-black text-white mb-2">What is your first name?</h2>
                        <p className="text-slate-400 text-sm">Tell us what to call you</p>
                      </div>
                      <FormField
                        control={registerForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Enter first name" {...field} className="auth-input h-14 text-lg text-center" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex gap-4">
                        <Button type="button" onClick={prevStep} variant="ghost" className="h-14 px-6 text-slate-400">Back</Button>
                        <Button type="button" onClick={() => nextStep(["firstName"])} className="flex-1 h-14 bg-pink-500 hover:bg-pink-600 text-white font-black text-lg rounded-2xl shadow-lg shadow-pink-500/20">Next</Button>
                      </div>
                    </motion.div>
                  )}

                  {regStep === 4 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 text-center">
                      <div className="py-6">
                        <h2 className="text-2xl font-black text-white mb-2">And your last name?</h2>
                        <p className="text-slate-400 text-sm">For your full professional or personal profile</p>
                      </div>
                      <FormField
                        control={registerForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Enter last name" {...field} className="auth-input h-14 text-lg text-center" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex gap-4">
                        <Button type="button" onClick={prevStep} variant="ghost" className="h-14 px-6 text-slate-400">Back</Button>
                        <Button type="button" onClick={() => nextStep(["lastName"])} className="flex-1 h-14 bg-pink-500 hover:bg-pink-600 text-white font-black text-lg rounded-2xl shadow-lg shadow-pink-500/20">Next</Button>
                      </div>
                    </motion.div>
                  )}

                  {regStep === 5 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 text-center">
                      <div className="py-6">
                        <h2 className="text-2xl font-black text-white mb-2">Your email address?</h2>
                        <p className="text-slate-400 text-sm">We'll use this for account recovery</p>
                      </div>
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input type="email" placeholder="you@example.com" {...field} className="auth-input h-14 text-lg text-center" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex gap-4">
                        <Button type="button" onClick={prevStep} variant="ghost" className="h-14 px-6 text-slate-400">Back</Button>
                        <Button type="button" onClick={() => nextStep(["email"])} className="flex-1 h-14 bg-pink-500 hover:bg-pink-600 text-white font-black text-lg rounded-2xl shadow-lg shadow-pink-500/20">Next</Button>
                      </div>
                    </motion.div>
                  )}

                  {regStep === 6 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 text-center">
                      <div className="py-6">
                        <h2 className="text-2xl font-black text-white mb-2">Phone number?</h2>
                        <p className="text-slate-400 text-sm">Required for verification and safety</p>
                      </div>
                      <FormField
                        control={registerForm.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 text-lg font-bold">+1</span>
                                <Input
                                  type="tel"
                                  inputMode="numeric"
                                  placeholder="(555) 000-0000"
                                  {...field}
                                  onChange={(e) => {
                                    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                                    field.onChange(digits);
                                  }}
                                  value={field.value ? field.value.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3") : ""}
                                  className="auth-input h-14 text-lg text-center pl-16"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex gap-4">
                        <Button type="button" onClick={prevStep} variant="ghost" className="h-14 px-6 text-slate-400">Back</Button>
                        <Button type="button" onClick={() => nextStep(["phoneNumber"])} className="flex-1 h-14 bg-pink-500 hover:bg-pink-600 text-white font-black text-lg rounded-2xl shadow-lg shadow-pink-500/20">Next</Button>
                      </div>
                    </motion.div>
                  )}

                  {regStep === 7 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 text-center">
                      <div className="py-6">
                        <h2 className="text-2xl font-black text-white mb-2">When is your birthday?</h2>
                        <p className="text-slate-400 text-sm">This confirms you're eligible for all app features</p>
                      </div>

                      {/* 18+ Age Gate Notice */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/25"
                      >
                        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                        <p className="text-amber-300 text-xs font-semibold text-left">You must be 18 or older to create an account on Face 2 Face.</p>
                      </motion.div>

                      <FormField
                        control={registerForm.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input type="date" {...field} className="auth-input h-14 text-lg text-center" />
                            </FormControl>
                            <FormDescription className="text-slate-500 text-sm mt-2">Current age: {registerForm.watch("age")}</FormDescription>
                            {registerForm.watch("age") < 18 && dobValue && (
                              <motion.p
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-red-400 text-sm font-semibold mt-2"
                              >
                                You must be 18 or older to use Face 2 Face
                              </motion.p>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex gap-4">
                        <Button type="button" onClick={prevStep} variant="ghost" className="h-14 px-6 text-slate-400">Back</Button>
                        <Button
                          type="button"
                          onClick={() => nextStep(["dateOfBirth"])}
                          disabled={!dobValue || registerForm.watch("age") < 18}
                          className="flex-1 h-14 bg-pink-500 hover:bg-pink-600 text-white font-black text-lg rounded-2xl shadow-lg shadow-pink-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                        >Next</Button>
                      </div>
                    </motion.div>
                  )}

                  {regStep === 8 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 text-center">
                      <div className="py-6">
                        <h2 className="text-2xl font-black text-white mb-2">How do you identify?</h2>
                        <p className="text-slate-400 text-sm">Select your sex for profile matching</p>
                      </div>
                      <FormField
                        control={registerForm.control}
                        name="sex"
                        render={({ field }) => (
                          <FormItem>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="auth-input h-14 text-lg text-center">
                                  <SelectValue placeholder="Select Sex" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-slate-900 border-slate-800">
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="custom">Custom</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {registerForm.watch("sex") === "custom" && (
                        <FormField
                          control={registerForm.control}
                          name="customSex"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder="Type your preference" {...field} className="auth-input text-center h-14" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      <div className="flex gap-4">
                        <Button type="button" onClick={prevStep} variant="ghost" className="h-14 px-6 text-slate-400">Back</Button>
                        <Button type="button" onClick={() => nextStep(["sex", "customSex"])} className="flex-1 h-14 bg-pink-500 hover:bg-pink-600 text-white font-black text-lg rounded-2xl shadow-lg shadow-pink-500/20">Next</Button>
                      </div>
                    </motion.div>
                  )}

                  {regStep === 9 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 text-center">
                      <div className="py-6">
                        <h2 className="text-2xl font-black text-white mb-2">Last step!</h2>
                        {registerForm.watch("age") >= 18 ? (
                          <p className="text-slate-400 text-sm">Who are you interested in meeting?</p>
                        ) : (
                          <p className="text-slate-400 text-sm">You're almost there!</p>
                        )}
                      </div>
                      
                      {registerForm.watch("age") >= 18 ? (
                        <FormField
                          control={registerForm.control}
                          name="datingPreference"
                          render={({ field }) => (
                            <FormItem>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="auth-input h-14 text-lg text-center">
                                    <SelectValue placeholder="I'm interested in..." />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-slate-900 border-slate-800">
                                  <SelectItem value="men">Men</SelectItem>
                                  <SelectItem value="women">Women</SelectItem>
                                  <SelectItem value="all">Everyone</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : (
                        <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                          <p className="text-blue-400 text-sm font-medium">Dating features are restricted to adults. You'll have access to Friends and Business modes!</p>
                        </div>
                      )}

                      <div className="flex gap-4 pt-4">
                        <Button type="button" onClick={prevStep} variant="ghost" className="h-14 px-6 text-slate-400">Back</Button>
                        <Button
                          type="submit"
                          className="flex-1 h-14 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-black text-lg rounded-2xl shadow-lg shadow-pink-500/25 transition-all"
                          disabled={registerForm.formState.isSubmitting}
                        >
                          {registerForm.formState.isSubmitting ? (
                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Finalizing...</>
                          ) : "Create Account"}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </form>
              </Form>
            </TabsContent>
          </Tabs>

          <p className="text-center text-xs text-slate-400 mt-6">
            By continuing, you agree to our <a href="/tos" className="underline hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">Terms of Service</a> and <a href="/privacy" className="underline hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
