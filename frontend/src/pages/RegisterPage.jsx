import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, User,
  Sparkles, Home, Briefcase, HardHat, UserCheck, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/store";
import Logo from "@/components/layout/Logo";

const registerSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/[0-9]/, "Must contain a number"),
  phone: z.string().optional(),
});

const roles = [
  { value: "buyer", label: "Buyer", icon: Home, desc: "Looking to buy or rent property", color: "from-primary-500 to-primary-600" },
  { value: "seller", label: "Seller", icon: Briefcase, desc: "Want to sell or list property", color: "from-emerald-500 to-emerald-600" },
  { value: "builder", label: "Builder", icon: HardHat, desc: "Builder or real estate developer", color: "from-amber-500 to-amber-600" },
  { value: "agent", label: "Agent", icon: UserCheck, desc: "Licensed real estate agent", color: "from-violet-500 to-violet-600" },
];

export default function RegisterPage() {
  const [step, setStep] = useState(1); // 1: Role, 2: Details
  const [selectedRole, setSelectedRole] = useState("buyer");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { register: registerUser, isLoading, error, clearError } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { full_name: "", email: "", password: "", phone: "" },
  });

  const onSubmit = async (data) => {
    try {
      clearError();
      await registerUser({ ...data, role: selectedRole });
      navigate("/login", { state: { registered: true } });
    } catch {
      // Error handled by store
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <Logo size="lg" className="mb-10" />

          {/* Step Indicator */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                    step >= s
                      ? "bg-gradient-to-r from-primary-600 to-accent-500 text-white shadow-md"
                      : "bg-[var(--bg-secondary)] text-[var(--text-tertiary)]"
                  )}
                >
                  {s}
                </div>
                {s < 2 && (
                  <div className={cn("w-16 h-0.5 rounded-full transition-all", step > s ? "bg-primary-500" : "bg-[var(--border-primary)]")} />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              /* Step 1: Role Selection */
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Join PropVerse AI</h1>
                <p className="text-[var(--text-secondary)] mb-8">
                  How will you use the platform?
                </p>

                <div className="space-y-3 mb-8">
                  {roles.map((role) => (
                    <button
                      key={role.value}
                      onClick={() => setSelectedRole(role.value)}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer text-left",
                        selectedRole === role.value
                          ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md"
                          : "border-[var(--border-primary)] hover:border-[var(--border-primary)] hover:bg-[var(--bg-secondary)]"
                      )}
                    >
                      <div className={cn(
                        "w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0",
                        role.color
                      )}>
                        <role.icon size={20} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-[var(--text-primary)]">{role.label}</p>
                        <p className="text-xs text-[var(--text-tertiary)]">{role.desc}</p>
                      </div>
                      <ChevronRight size={18} className={cn(
                        "text-[var(--text-tertiary)] transition-colors",
                        selectedRole === role.value && "text-primary-500"
                      )} />
                    </button>
                  ))}
                </div>

                <Button
                  variant="gradient"
                  size="lg"
                  className="w-full"
                  onClick={() => setStep(2)}
                >
                  Continue <ArrowRight size={18} />
                </Button>
              </motion.div>
            ) : (
              /* Step 2: Details */
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-6 cursor-pointer"
                >
                  <ArrowLeft size={16} /> Back
                </button>

                <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Create your account</h1>
                <p className="text-[var(--text-secondary)] mb-8">
                  Signing up as <span className="font-semibold text-primary-600 dark:text-primary-400 capitalize">{selectedRole}</span>
                </p>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 rounded-xl bg-error-500/10 border border-error-500/20 text-error-500 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <Input
                    label="Full Name"
                    icon={User}
                    placeholder="John Doe"
                    error={errors.full_name?.message}
                    {...register("full_name")}
                  />
                  <Input
                    label="Email"
                    type="email"
                    icon={Mail}
                    placeholder="you@example.com"
                    error={errors.email?.message}
                    {...register("email")}
                  />
                  <div className="relative">
                    <Input
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      icon={Lock}
                      placeholder="Min 8 chars, uppercase, lowercase, number"
                      error={errors.password?.message}
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-9 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <Button
                    type="submit"
                    variant="gradient"
                    size="lg"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Create Account <ArrowRight size={18} />
                      </>
                    )}
                  </Button>
                </form>

                <p className="text-xs text-[var(--text-tertiary)] text-center mt-6 leading-relaxed">
                  By creating an account, you agree to our{" "}
                  <Link to="/terms" className="text-primary-600 dark:text-primary-400 hover:underline">Terms</Link> and{" "}
                  <Link to="/privacy" className="text-primary-600 dark:text-primary-400 hover:underline">Privacy Policy</Link>.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-center text-sm text-[var(--text-secondary)] mt-8">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary-600 dark:text-primary-400 hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right: Visual */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-[#1E1B4B]">
          <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-accent-500/20 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl animate-pulse-slow" />
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          />
        </div>
        <div className="relative z-10 flex items-center justify-center p-12">
          <div className="text-center max-w-md">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xl flex items-center justify-center mx-auto mb-8 shadow-xl border border-white/20">
                <Sparkles size={36} className="text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">
                Start Your Journey
              </h2>
              <p className="text-white/60 leading-relaxed">
                Whether you're buying your first home, selling a property, or building the next landmark,
                PropVerse AI has the intelligence to guide you every step of the way.
              </p>
              <div className="flex justify-center gap-4 mt-8">
                {["50K+ Properties", "150+ Cities", "98% AI Match"].map((stat) => (
                  <div key={stat} className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/70 text-xs">
                    {stat}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
