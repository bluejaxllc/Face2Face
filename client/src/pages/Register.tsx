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
import { Loader2, Smartphone, MapPin, MessageSquare, ShieldCheck, Phone } from "lucide-react";
import { Logo } from "@/components/Logo";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";

const registerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email"),
  phoneNumber: z.string().min(10, "Enter a valid phone number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  gender: z.string().default("other"),
  age: z.coerce.number().min(18, "Must be at least 18").max(99),
  selfRating: z.coerce.number().min(1).max(10).default(5),
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
      gender: "other",
      age: 18,
      selfRating: 5,
      datingPreference: "all",
    },
  });

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
      const { confirmPassword, ...registerData } = values;
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
      setTimeout(() => navigate("/map"), 500);
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

  // OTP Verification screen
  if (showVerification) {
    return (
      <div className="auth-page min-h-screen flex flex-col relative overflow-hidden">
        <div className="auth-bg" />
        <div className="auth-glow auth-glow-1" />
        <div className="auth-glow auth-glow-2" />
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
      <div className="auth-bg" />
      <div className="auth-glow auth-glow-1" />
      <div className="auth-glow auth-glow-2" />

      {/* Floating particles */}
      <div className="auth-particles">
        <div className="auth-particle" />
        <div className="auth-particle" />
        <div className="auth-particle" />
        <div className="auth-particle" />
        <div className="auth-particle" />
        <div className="auth-particle" />
        <div className="auth-particle" />
        <div className="auth-particle" />
      </div>

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
                          <Input type="password" placeholder="Enter your password" {...field} className="auth-input" />
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
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={registerForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300 text-sm font-medium">First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="First name" {...field} className="auth-input" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300 text-sm font-medium">Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Last name" {...field} className="auth-input" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 text-sm font-medium">Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Choose a username" {...field} className="auth-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 text-sm font-medium">Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter your email" {...field} className="auth-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 text-sm font-medium">Phone Number</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">+1</span>
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
                              className="auth-input pl-10"
                            />
                          </div>
                        </FormControl>
                        <FormDescription className="text-slate-400 text-[10px]">We'll send a verification code</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Face2Face-specific fields */}
                  <div className="grid grid-cols-3 gap-3">
                    <FormField
                      control={registerForm.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300 text-sm font-medium">Gender</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="auth-input">
                                <SelectValue placeholder="Gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300 text-sm font-medium">Age</FormLabel>
                          <FormControl>
                            <Input type="number" min="18" max="99" {...field} className="auth-input" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="selfRating"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300 text-sm font-medium">Rating</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" max="10" {...field} className="auth-input" />
                          </FormControl>
                          <FormDescription className="text-slate-400 text-[10px]">1-10</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={registerForm.control}
                    name="datingPreference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 text-sm font-medium">Interested In</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="auth-input">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="men">Men</SelectItem>
                            <SelectItem value="women">Women</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 text-sm font-medium">Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Create a password" {...field} className="auth-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 text-sm font-medium">Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Confirm your password" {...field} className="auth-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg shadow-pink-500/25 transition-all duration-300 hover:shadow-pink-500/40 hover:scale-[1.02] active:scale-[0.98]"
                    disabled={registerForm.formState.isSubmitting}
                  >
                    {registerForm.formState.isSubmitting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...</>
                    ) : "Create Account"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>

          <p className="text-center text-xs text-slate-400 mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </motion.div>
      </div>
    </div>
  );
}
