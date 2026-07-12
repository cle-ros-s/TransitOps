import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Truck, Eye, EyeOff, Lock, Mail, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { loginApi } from '../../mockApi/authApi';
import { useAuthStore } from '../../store/authStore';
import { DEMO_USERS, ROLES } from '../../config/constants';
import type { UserRole } from '../../types';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst']),
  rememberMe: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

const ROLE_COLORS: Record<UserRole, string> = {
  fleet_manager: 'bg-brand-500',
  dispatcher: 'bg-blue-500',
  safety_officer: 'bg-emerald-500',
  financial_analyst: 'bg-purple-500',
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((s) => s.setSession);
  const [showPassword, setShowPassword] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [forgotPw, setForgotPw] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'fleet_manager', rememberMe: false },
  });

  const selectedRole = watch('role');

  function fillDemo(user: typeof DEMO_USERS[0]) {
    setValue('email', user.email);
    setValue('password', user.password);
    setValue('role', user.role);
  }

  async function onSubmit(data: FormData) {
    if (lockedUntil && Date.now() < lockedUntil) {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      toast.error(`Account locked. Try again in ${remaining}s`);
      return;
    }

    setIsLoading(true);
    try {
      const session = await loginApi(data);
      setSession(session.user, session.token);
      setFailedAttempts(0);
      toast.success(`Welcome back, ${session.user.name}!`);
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard';
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const newFails = failedAttempts + 1;
      setFailedAttempts(newFails);
      if (newFails >= 5) {
        setLockedUntil(Date.now() + 30_000);
        toast.error('Too many failed attempts. Locked for 30 seconds.');
        setTimeout(() => { setLockedUntil(null); setFailedAttempts(0); }, 30_000);
      } else {
        toast.error((err as Error).message ?? 'Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  }

  const isLocked = lockedUntil ? Date.now() < lockedUntil : false;

  return (
    <div className="w-full">
      {/* Card */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-glass">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-500 flex items-center justify-center mb-4 shadow-lg">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">TransitOps</h1>
          <p className="text-gray-400 text-sm mt-1">Smart Transport Operations Platform</p>
        </div>

        {forgotPw ? (
          <div className="text-center">
            <ShieldCheck className="w-12 h-12 text-brand-400 mx-auto mb-4" />
            <h2 className="text-white font-semibold text-lg mb-2">Password Recovery</h2>
            <p className="text-gray-400 text-sm mb-6">Contact your system administrator to reset your password. For demo purposes, all credentials are listed below.</p>
            <button onClick={() => setForgotPw(false)} className="btn-primary w-full justify-center">Back to Login</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Failed attempts warning */}
            {failedAttempts > 0 && failedAttempts < 5 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-xs">{5 - failedAttempts} attempts remaining before lockout</p>
              </div>
            )}
            {isLocked && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                <Lock className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-xs">Account temporarily locked. Please wait 30 seconds.</p>
              </div>
            )}

            {/* Role selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Select Role</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(ROLES) as UserRole[]).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setValue('role', role)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      selectedRole === role
                        ? 'border-brand-500 bg-brand-500/20 text-brand-400'
                        : 'border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-300'
                    }`}
                  >
                    {ROLES[role]}
                  </button>
                ))}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  placeholder="you@company.com"
                  autoComplete="email"
                  {...register('email')}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors"
                />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register('password')}
                  className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {/* Remember me + forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('rememberMe')} className="w-4 h-4 rounded border-white/20 bg-white/5 accent-brand-500" />
                <span className="text-xs text-gray-400">Remember me</span>
              </label>
              <button type="button" onClick={() => setForgotPw(true)} className="text-xs text-brand-400 hover:underline">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading || isLocked}
              className="btn-primary w-full justify-center py-2.5 text-sm"
            >
              {isLoading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in...</>
              ) : 'Sign In'}
            </button>
          </form>
        )}
      </div>

      {/* Demo credentials */}
      <div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-4">
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Demo Credentials — Click to fill</p>
        <div className="grid grid-cols-2 gap-2">
          {DEMO_USERS.map((u) => (
            <button
              key={u.role}
              onClick={() => fillDemo(u)}
              className="text-left p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors group"
            >
              <div className={`inline-block w-2 h-2 rounded-full ${ROLE_COLORS[u.role]} mb-1`} />
              <p className="text-white text-xs font-semibold leading-tight">{ROLES[u.role]}</p>
              <p className="text-gray-500 text-[10px] leading-tight truncate">{u.email}</p>
              <p className="text-gray-500 text-[10px] leading-tight">{u.password}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
