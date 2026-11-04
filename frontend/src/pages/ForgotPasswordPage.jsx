import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useState } from "react";
import Logo from "@/components/layout/Logo";

const schema = z.object({
  email: z.string().email("Please enter a valid email"),
});

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors }, getValues } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async () => {
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-[var(--bg-primary)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Logo size="lg" className="mb-10" />

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-6">
              <Mail size={28} className="text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-3">Check your email</h1>
            <p className="text-[var(--text-secondary)] mb-8">
              We've sent a password reset code to <strong>{getValues("email")}</strong>.
              Please check your inbox.
            </p>
            <Link to="/login">
              <Button variant="outline" size="lg" className="w-full">
                <ArrowLeft size={18} /> Back to Sign In
              </Button>
            </Link>
          </motion.div>
        ) : (
          <>
            <Link to="/login" className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-6">
              <ArrowLeft size={16} /> Back to Sign In
            </Link>

            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Forgot password?</h1>
            <p className="text-[var(--text-secondary)] mb-8">
              Enter your email and we'll send you a reset code.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                label="Email"
                type="email"
                icon={Mail}
                placeholder="you@example.com"
                error={errors.email?.message}
                {...register("email")}
              />
              <Button type="submit" variant="gradient" size="lg" className="w-full">
                Send Reset Code <ArrowRight size={18} />
              </Button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
