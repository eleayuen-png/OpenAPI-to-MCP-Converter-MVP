import React, { useState, type ReactNode } from 'react';
import { Lock, Sparkles, X, CheckCircle2, Shield, Zap, Server, ArrowRight } from 'lucide-react';
import { usePostHog } from '@posthog/react';
// @ts-ignore
import { useApp } from '../context/AppContext';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
}

const PLANS = [
  {
    id: 'monthly',
    label: 'Monthly',
    price: '$19',
    billingNote: 'per month',
    perMonth: '$19 / mo',
    savingsVsMonthly: null,
    link: () => import.meta.env.VITE_STRIPE_PAYMENT_LINK_MONTHLY,
  },
  {
    id: 'quarterly',
    label: 'Quarterly',
    price: '$54',
    billingNote: 'every 3 months',
    perMonth: '$18 / mo',
    savingsVsMonthly: 'Save $3',
    link: () => import.meta.env.VITE_STRIPE_PAYMENT_LINK_QUARTERLY,
  },
  {
    id: 'semiannual',
    label: 'Semi-Annual',
    price: '$109',
    billingNote: 'every 6 months',
    perMonth: '~$18.17 / mo',
    savingsVsMonthly: 'Save $5',
    link: () => import.meta.env.VITE_STRIPE_PAYMENT_LINK_SEMIANNUAL,
  },
  {
    id: 'annual',
    label: 'Annual',
    price: '$219',
    billingNote: 'per year',
    perMonth: '~$18.25 / mo',
    savingsVsMonthly: 'Save $9',
    link: () => import.meta.env.VITE_STRIPE_PAYMENT_LINK_ANNUAL,
  },
] as const;

export function UpgradeModal({ isOpen, onClose, featureName }: UpgradeModalProps) {
  const { user, loginWithGoogle } = useApp() as any;
  const posthog = usePostHog();
  const [showPlans, setShowPlans] = useState(false);

  if (!isOpen) return null;

  const handleUpgradeClick = async () => {
    posthog.capture('pro_upgrade_clicked', { feature: featureName, user_is_anonymous: !!user?.isAnonymous });
    if (user?.isAnonymous) {
      await loginWithGoogle();
      return;
    }
    setShowPlans(true);
  };

  const handlePlanSelect = (plan: typeof PLANS[number]) => {
    const link = plan.link();
    if (!link) return;
    posthog.capture('plan_selected', { plan: plan.id, feature: featureName });
    window.location.href = `${link}?client_reference_id=${user?.uid}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111827] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">

        {/* Header */}
        <div className="relative bg-gradient-to-br from-blue-600 to-indigo-800 p-8 text-center overflow-hidden">
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={() => { setShowPlans(false); onClose(); }}
              className="p-2 bg-black/20 hover:bg-black/40 rounded-full text-white/80 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {showPlans && (
            <button
              onClick={() => setShowPlans(false)}
              className="absolute top-4 left-4 z-10 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white/80 hover:text-white transition-colors"
            >
              <ArrowRight className="h-5 w-5 rotate-180" />
            </button>
          )}

          <div className="relative z-10 w-16 h-16 mx-auto bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 border border-white/30 shadow-xl">
            <Lock className="h-8 w-8 text-white" />
          </div>

          <h2 className="relative z-10 text-2xl font-bold text-white mb-2 tracking-tight">
            {user?.isAnonymous
              ? 'Sign in to unlock Pro features'
              : showPlans
              ? 'Choose your plan'
              : `Unlock ${featureName}`}
          </h2>
          <p className="relative z-10 text-blue-100 text-sm max-w-xs mx-auto">
            {user?.isAnonymous
              ? 'Create an account to save your macros and access enterprise tools.'
              : showPlans
              ? 'All plans include every Pro feature. Cancel anytime.'
              : 'Upgrade to MCP Studio Pro to empower your AI agents with advanced enterprise features.'}
          </p>

          <div className="absolute top-0 left-0 w-full h-full opacity-30">
            <div className="absolute top-[-50%] left-[-20%] w-64 h-64 bg-blue-400 rounded-full mix-blend-overlay filter blur-3xl" />
            <div className="absolute bottom-[-50%] right-[-20%] w-64 h-64 bg-purple-400 rounded-full mix-blend-overlay filter blur-3xl" />
          </div>
        </div>

        {/* Body */}
        <div className="p-8">
          {!showPlans ? (
            <>
              <div className="space-y-4 mb-8">
                <FeatureRow icon={<Zap className="h-3.5 w-3.5 text-blue-500" />} title="Macro Bundling" desc="Combine multiple API calls into single tools to save tokens." />
                <FeatureRow icon={<Shield className="h-3.5 w-3.5 text-red-500" />} title="PII Data Masking" desc="Automatically redact emails and phones before they hit the LLM." />
                <FeatureRow icon={<Server className="h-3.5 w-3.5 text-purple-500" />} title="Unlimited Proxies" desc="Deploy as many private proxy servers as your team needs." />
              </div>

              <button
                onClick={handleUpgradeClick}
                className="w-full py-3.5 bg-[#141B41] dark:bg-blue-600 hover:bg-[#1a2352] dark:hover:bg-blue-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {user?.isAnonymous ? 'Sign in with Google' : 'See plans — from $18 / mo'}
                <Sparkles className="h-4 w-4" />
              </button>

              <p className="text-center text-xs text-slate-400 mt-4">
                Secure checkout via Stripe · Cancel anytime
              </p>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {PLANS.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => handlePlanSelect(plan)}
                  className="relative flex flex-col items-start p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all text-left group"
                >
                  {plan.savingsVsMonthly && (
                    <span className="absolute top-2.5 right-2.5 text-[10px] font-semibold px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                      {plan.savingsVsMonthly}
                    </span>
                  )}
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    {plan.label}
                  </span>
                  <span className="text-2xl font-bold text-[#141B41] dark:text-white">
                    {plan.price}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {plan.billingNote}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    {plan.perMonth}
                  </span>
                  <span className="mt-3 text-xs font-medium text-blue-600 dark:text-blue-400 group-hover:underline flex items-center gap-1">
                    Select <ArrowRight className="h-3 w-3" />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FeatureRow({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 bg-green-100 dark:bg-green-900/30 p-1 rounded-full">
        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
      </div>
      <div>
        <h4 className="font-semibold text-[#141B41] dark:text-white text-sm flex items-center gap-1.5">
          {icon} {title}
        </h4>
        <p className="text-slate-500 dark:text-slate-400 text-xs">{desc}</p>
      </div>
    </div>
  );
}
