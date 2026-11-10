import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  UserCheck,
  ArrowRight,
  Activity,
  Landmark,
  KeyRound,
  FileCheck,
  CheckCircle2,
  Server,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const handleQuickDemoLogin = async (email: string, pass: string) => {
    try {
      const loggedUser = await login(email, pass);
      if (loggedUser.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/user/dashboard');
      }
    } catch (err: any) {
      alert(err.message || 'Quick login failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#173B75] text-white rounded-xl shadow-md border border-blue-500/20">
              <Landmark className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-[#173B75]">BalanceVault</span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                ENTERPRISE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {user ? (
              <Link
                to={user.role === 'ADMIN' ? '/admin/dashboard' : '/user/dashboard'}
                className="px-5 py-2.5 text-sm font-bold text-white bg-[#173B75] hover:bg-[#122e5c] rounded-xl shadow-sm hover:shadow transition inline-flex items-center gap-2"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-[#173B75] transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 text-sm font-bold text-white bg-[#173B75] hover:bg-[#122e5c] rounded-xl shadow-sm hover:shadow transition"
                >
                  Open Account
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="pt-20 pb-16 md:pt-28 md:pb-24 px-6 max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 mb-6 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-blue-600" /> Bank-Grade Account Management & Compliance Onboarding
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
            Manage Your Financial Accounts with <span className="text-[#2563EB]">Confidence</span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-3xl mx-auto font-normal leading-relaxed">
            A secure and transparent platform for account management, onboarding, and administrative control.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 bg-[#173B75] text-white font-bold rounded-xl shadow-md hover:bg-[#122e5c] flex items-center justify-center gap-2 text-sm transition"
            >
              Start Account Onboarding <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 bg-white text-slate-700 font-bold rounded-xl border border-slate-300 hover:bg-slate-50 text-sm shadow-xs transition"
            >
              Sign In to Console
            </Link>
          </div>

          {/* Quick Demo Credentials Box for Hiring Evaluators */}
          <div className="mt-12 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm max-w-3xl mx-auto text-left">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Instant Evaluator Demo Access (1-Click Login)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">Compliance Administrator</div>
                  <div className="text-[11px] text-slate-500 font-mono">admin@balancevault.internal</div>
                </div>
                <button
                  onClick={() => handleQuickDemoLogin('admin@balancevault.internal', 'VaultAdmin@2026!')}
                  className="px-3 py-1.5 bg-[#173B75] hover:bg-[#122e5c] text-white text-xs font-bold rounded-lg transition shadow-xs"
                >
                  Login as Admin
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">Account Holder (Pending Review)</div>
                  <div className="text-[11px] text-slate-500 font-mono">michael.vance@example.com</div>
                </div>
                <button
                  onClick={() => handleQuickDemoLogin('michael.vance@example.com', 'VaultClient@2026!')}
                  className="px-3 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition shadow-xs"
                >
                  Login as Client
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="py-20 bg-white border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">Platform Standards</span>
              <h2 className="text-3xl font-extrabold text-slate-900 mt-2">Enterprise Standard Reliability</h2>
              <p className="mt-2 text-slate-500 text-sm">
                Built from the ground up for data integrity, strict access control, and complete auditability.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-8 rounded-2xl bg-[#F5F7FB] border border-slate-200 hover:shadow-md transition">
                <div className="p-3.5 bg-white w-fit rounded-xl border border-slate-200 text-[#173B75] shadow-xs mb-5">
                  <UserCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Controlled Onboarding Workflow</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Rigorous multi-stage identity verification. Compliance staff review submitted documentation, approve accounts, or reject with detailed feedback.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-[#F5F7FB] border border-slate-200 hover:shadow-md transition">
                <div className="p-3.5 bg-white w-fit rounded-xl border border-slate-200 text-[#2563EB] shadow-xs mb-5">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Immutable Audit Trails</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Real-time recording of every login, state modification, permission alteration, and review decision. Sensitive secrets and tokens are strictly scrubbed.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-[#F5F7FB] border border-slate-200 hover:shadow-md transition">
                <div className="p-3.5 bg-white w-fit rounded-xl border border-slate-200 text-emerald-600 shadow-xs mb-5">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Hardened Security & RBAC</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Rate-limited endpoints, Bcrypt password hashing, backend-enforced RBAC, and zero trust in frontend-supplied roles.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 max-w-6xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">Workflow</span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-2">How BalanceVault Works</h2>
            <p className="mt-2 text-slate-500 text-sm">Four seamless steps from initial registration to verified active status.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Register Profile',
                desc: 'Client creates an account holder profile with personal and contact details.',
              },
              {
                step: '02',
                title: 'Submit Identity',
                desc: 'Upload proof of address and official government identification details.',
              },
              {
                step: '03',
                title: 'Compliance Review',
                desc: 'Authorized administrators inspect records and approve or request revisions.',
              },
              {
                step: '04',
                title: 'Account Activated',
                desc: 'Account Reference transitions to ACTIVE with full platform credentials.',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden"
              >
                <div className="text-3xl font-black text-slate-200 mb-3 font-mono">{item.step}</div>
                <h4 className="text-base font-bold text-slate-900 mb-2">{item.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#101D36] text-slate-400 py-12 px-6 border-t border-slate-800 text-center text-xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-white text-sm">BalanceVault Financial Systems</span>
          </div>
          <p>© 2026 BalanceVault. Financial Account Management Demonstration.</p>
          <div className="flex items-center gap-4 text-slate-400 text-xs">
            <span>RBAC Protected</span>
            <span>•</span>
            <span>Audit-Logged</span>
            <span>•</span>
            <span>Zero-Trust Architecture</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
