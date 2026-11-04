import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, CheckCircle2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/store";
import Logo from "@/components/layout/Logo";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const registered = location.state?.registered;
  const { login, isLoading, error, clearError } = useAuthStore();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data) => {
    try {
      clearError();
      await login(data.email, data.password);
      navigate("/dashboard");
    } catch {
      // Error handled by store
    }
  };

  const fillDemoAccount = (email, password) => {
    setValue("email", email, { shouldValidate: true });
    setValue("password", password, { shouldValidate: true });
    clearError();
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

          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Welcome back</h1>
          <p className="text-[var(--text-secondary)] mb-8">
            Sign in to continue your real estate journey.
          </p>

          {/* Success Banner */}
          {registered && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2"
            >
              <CheckCircle2 size={18} />
              <span>Account created successfully! Please sign in with your credentials.</span>
            </motion.div>
          )}

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-error-500/10 border border-error-500/20 text-error-500 text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Quick Demo Credentials */}
          <div className="mb-6 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-xs">
            <p className="font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-1.5">
              <UserCheck size={14} className="text-primary-500" /> Quick Demo Login (Supabase Real-time Auth):
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fillDemoAccount("buyer@propverse.ai", "Password@123")}
                className="px-2.5 py-1 rounded-lg bg-[var(--bg-tertiary)] hover:bg-primary-500/10 text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                Buyer
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount("seller@propverse.ai", "Password@123")}
                className="px-2.5 py-1 rounded-lg bg-[var(--bg-tertiary)] hover:bg-primary-500/10 text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                Seller
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount("agent@propverse.ai", "Password@123")}
                className="px-2.5 py-1 rounded-lg bg-[var(--bg-tertiary)] hover:bg-primary-500/10 text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                Agent
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount("admin@propverse.ai", "Password@123")}
                className="px-2.5 py-1 rounded-lg bg-[var(--bg-tertiary)] hover:bg-primary-500/10 text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount("vg200431@gmail.com", "Password@123")}
                className="px-2.5 py-1 rounded-lg bg-[var(--bg-tertiary)] hover:bg-primary-500/10 text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                Vansh
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                placeholder="Enter your password"
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

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded accent-primary-600" />
                <span className="text-sm text-[var(--text-secondary)]">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
              >
                Forgot password?
              </Link>
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
                  Sign In <ArrowRight size={18} />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-[var(--text-secondary)] mt-8">
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold text-primary-600 dark:text-primary-400 hover:underline">
              Create one
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right: Visual */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-[#1E1B4B]">
          <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-accent-500/20 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl animate-pulse-slow" />
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
                AI-Powered Property Intelligence
              </h2>
              <p className="text-white/60 leading-relaxed">
                Join a platform where artificial intelligence transforms how you discover, evaluate,
                and invest in real estate. Your dream property is one smart search away.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
