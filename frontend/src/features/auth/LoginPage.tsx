import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

import { loginApi } from '../../mockApi/authApi';
import { useAuthStore } from '../../store/authStore';
import { DEMO_USERS, ROLES } from '../../config/constants';
import type { UserRole } from '../../types';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst']),
  rememberMe: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

const ROLE_INFO: Record<UserRole, { label: string; scopes: string[] }> = {
  fleet_manager: {
    label: ROLES.fleet_manager,
    scopes: ['Fleet', 'Maintenance'],
  },
  dispatcher: {
    label: ROLES.dispatcher,
    scopes: ['Dashboard', 'Trips'],
  },
  safety_officer: {
    label: ROLES.safety_officer,
    scopes: ['Drivers', 'Compliance'],
  },
  financial_analyst: {
    label: ROLES.financial_analyst,
    scopes: ['Fuel & Expenses', 'Analytics'],
  },
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

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
    defaultValues: { role: 'dispatcher', rememberMe: false },
  });

  const selectedRole = watch('role');
  const currentRoleInfo = ROLE_INFO[selectedRole];

  const isLocked = lockedUntil ? Date.now() < lockedUntil : false;

  const lockSecondsRemaining = useMemo(() => {
    if (!lockedUntil || !isLocked) return 0;
    return Math.ceil((lockedUntil - Date.now()) / 1000);
  }, [isLocked, lockedUntil]);

  // Tick while locked so countdown updates.
  const [lockTick, setLockTick] = useState(0);
  useEffect(() => {
    if (!isLocked) return;
    const id = window.setInterval(() => setLockTick((v) => v + 1), 250);
    return () => window.clearInterval(id);
  }, [isLocked]);
  // lockTick is used only to retrigger render for countdown.
  void lockTick;

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
        setTimeout(() => {
          setLockedUntil(null);
          setFailedAttempts(0);
        }, 30_000);
      } else {
        toast.error((err as Error).message ?? 'Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  }

  const showErrorPanel = failedAttempts > 0 || isLocked;

  return (
    <div className="min-h-screen w-screen flex overflow-hidden bg-[#F8F9FB]">
      {/* LEFT PANEL */}
      <motion.aside
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="hidden lg:flex lg:w-[38%] relative overflow-hidden"
        style={{ background: '#0F172A' }}
      >
        <div className="absolute inset-0">
          <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-[#F4B400]/10 blur-2xl" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#0B1226] to-[#0F172A]" />
        </div>

        <div className="relative z-10 w-full pl-12 pr-10 pt-12 pb-12 flex flex-col">
          <div className="flex items-start gap-4">
            <div className="h-11 w-11 rounded-xl bg-white/5 backdrop-blur border border-white/10 flex items-center justify-center">
              <div className="h-4 w-4 rounded bg-[#F4B400]" />
            </div>
            <div>
              <div className="text-white text-xl font-semibold whitespace-nowrap">TransitOps</div>
              <div className="text-[#6B7280] text-sm mt-1 line-clamp-2">Smart Transport Operations Platform</div>
            </div>
          </div>

          <div className="mt-10">
            <div className="text-white/90 text-sm font-semibold">One login, four roles:</div>
            <ul className="mt-3 space-y-2">
              {[
                'Fleet Manager',
                'Dispatcher',
                'Safety Officer',
                'Financial Analyst',
              ].map((label) => (
                <li key={label} className="flex items-center gap-3 text-sm whitespace-nowrap">
                  <span className="h-2 w-2 rounded-full bg-[#F4B400]" />
                  <span className="text-white/90">{label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-auto text-xs text-white/60 tracking-wide">TRANSITOPS © 2026 · RBAC ENABLED</div>
        </div>
      </motion.aside>

      {/* MOBILE HERO */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="lg:hidden block relative overflow-hidden"
        style={{ background: '#0F172A' }}
      >
        <div className="absolute inset-0">
          <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-[#F4B400]/10 blur-2xl" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#0B1226] to-[#0F172A]" />
        </div>

        <div className="relative z-10 p-7">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/5 backdrop-blur border border-white/10 flex items-center justify-center">
              <div className="h-4 w-4 rounded bg-[#F4B400]" />
            </div>
            <div>
              <div className="text-white text-lg font-semibold whitespace-nowrap">TransitOps</div>
              <div className="text-[#6B7280] text-sm mt-1 line-clamp-2">Smart Transport Operations Platform</div>
            </div>
          </div>

          <div className="mt-7 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur">
            <div className="text-white/90 text-sm font-semibold">One login, four roles:</div>
            <ul className="mt-3 space-y-2">
              {[
                'Fleet Manager',
                'Dispatcher',
                'Safety Officer',
                'Financial Analyst',
              ].map((label) => (
                <li key={label} className="flex items-center gap-3 text-sm whitespace-nowrap">
                  <span className="h-2 w-2 rounded-full bg-[#F4B400]" />
                  <span className="text-white/90">{label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 text-xs text-white/60 tracking-wide">TRANSITOPS © 2026 · RBAC ENABLED</div>
        </div>
      </motion.div>

      {/* RIGHT PANEL */}
      <motion.main
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full lg:w-[62%] flex items-center justify-center px-4 py-10 lg:py-0"
      >
        <div className="w-full max-w-[520px] relative">
          <AnimatePresence>
            {showErrorPanel && (
              <motion.div
                initial={{ opacity: 0, y: 10, x: 10 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, y: 10, x: 10 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-4 w-[380px] max-w-[86vw] bg-[#EF4444]/10 border border-dashed border-[#EF4444]/60 rounded-xl px-4 py-3"
              >
                <div className="text-[#EF4444] text-sm font-medium flex items-start gap-2">
                  <span className="pt-0.5">❌</span>
                  <div>
                    <div>Invalid credentials.</div>
                    <div className="text-[#EF4444]/90 font-normal mt-0.5">Account locked after 5 failed attempts.</div>
                    {isLocked && <div className="text-xs mt-2 text-[#EF4444]">Try again in {lockSecondsRemaining}s</div>}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="bg-[#FFFFFF] rounded-[28px] shadow-[0_20px_60px_rgba(15,23,42,0.12)] p-12"
          >
            {!forgotPw ? (
              <>
                <div className="text-center">
                  <div className="text-[#111827] text-[40px] font-bold leading-tight">Sign in to your account</div>
                  <div className="text-[#6B7280] text-[16px] mt-2">Enter your credentials to continue</div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-[#6B7280] uppercase tracking-[0.08em] mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        placeholder="raven.k@transitops.in"
                        autoComplete="email"
                        {...register('email')}
                        className={cx(
                          'w-full rounded-[14px] border bg-[#FFFFFF] pl-10 pr-4 h-[56px] text-sm',
                          'border-[#E5E7EB] text-[#111827] placeholder:text-gray-400',
                          'focus:outline-none focus:ring-2 focus:ring-[#F4B400]/40 focus:border-[#F4B400] transition'
                        )}
                      />
                    </div>
                    {errors.email && <p className="text-[#EF4444] text-xs mt-1">{errors.email.message}</p>}
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-[#6B7280] uppercase tracking-[0.08em] mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        {...register('password')}
                        className={cx(
                          'w-full rounded-[14px] border bg-[#FFFFFF] pl-10 pr-14 h-[56px] text-sm',
                          'border-[#E5E7EB] text-[#111827] placeholder:text-gray-400',
                          'focus:outline-none focus:ring-2 focus:ring-[#F4B400]/40 focus:border-[#F4B400] transition'
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-gray-500 hover:text-gray-700 transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-[#EF4444] text-xs mt-1">{errors.password.message}</p>}
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-[#6B7280] uppercase tracking-[0.08em] mb-2">Role</label>
                    <select
                      {...register('role')}
                      className={cx(
                        'w-full rounded-[14px] border bg-[#FFFFFF] pl-4 pr-3 h-[56px] text-sm',
                        'border-[#E5E7EB] text-[#111827]',
                        'focus:outline-none focus:ring-2 focus:ring-[#F4B400]/40 focus:border-[#F4B400] transition'
                      )}
                    >
                      <option value="fleet_manager">Fleet Manager</option>
                      <option value="dispatcher">Dispatcher</option>
                      <option value="safety_officer">Safety Officer</option>
                      <option value="financial_analyst">Financial Analyst</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('rememberMe')}
                        className="h-4 w-4 rounded border-[#E5E7EB] accent-[#F4B400]"
                      />
                      <span className="text-sm text-[#111827]">Remember Me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setForgotPw(true)}
                      className="text-sm text-[#111827] hover:text-[#F4B400] transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={isLoading || isLocked}
                    className={cx(
                      'w-full rounded-[14px] h-[56px] text-[16px] font-semibold text-white transition',
                      'bg-[#F4B400] hover:bg-[#E6A800]',
                      'disabled:opacity-60 disabled:cursor-not-allowed'
                    )}
                  >
                    {isLoading ? (
                      <span className="inline-flex items-center justify-center gap-2">
                        <span className="h-4 w-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                        Signing in...
                      </span>
                    ) : (
                      'Sign In'
                    )}
                  </motion.button>

                  <div className="mt-8 leading-[1.8]">
                    <div className="text-[12px] font-medium text-[#6B7280]">Access is scoped by role after login:</div>
                    <ul className="mt-2 space-y-1">
                      {currentRoleInfo.scopes.map((s) => (
                        <li key={s} className="text-sm text-[#111827]/90 whitespace-nowrap">
                          • {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center">
                <div className="text-[#111827] font-semibold text-lg">Password Recovery</div>
                <div className="text-[#6B7280] text-sm mt-2">
                  Contact your system administrator to reset your password. For demo purposes, all credentials are listed below.
                </div>
                <button
                  type="button"
                  onClick={() => setForgotPw(false)}
                  className="mt-6 w-full rounded-xl border border-[#E5E7EB] bg-white py-2.5 text-sm font-medium text-[#111827] hover:bg-[#F9FAFB] transition"
                >
                  Back to Login
                </button>

                <div className="mt-5">
                  <div className="bg-[#F8F9FB] border border-[#E5E7EB] rounded-2xl p-4">
                    <p className="text-[#6B7280] text-xs font-semibold uppercase tracking-wider mb-3">Demo Credentials — Click to fill</p>
                    <div className="grid grid-cols-2 gap-2">
                      {DEMO_USERS.map((u) => (
                        <button
                          key={u.role}
                          type="button"
                          onClick={() => fillDemo(u)}
                          className="text-left p-2.5 bg-white hover:bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl transition-colors"
                        >
                          <div className="h-1.5 w-1.5 rounded-full bg-[#F4B400] mb-1" />
                          <p className="text-[#111827] text-xs font-semibold leading-tight">{ROLES[u.role]}</p>
                          <p className="text-[#6B7280] text-[10px] leading-tight truncate">{u.email}</p>
                          <p className="text-[#6B7280] text-[10px] leading-tight">{u.password}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </motion.main>
    </div>
  );
}