import React from 'react';
import { Lock, Sparkles, X, CheckCircle2, Shield, Zap, Server } from 'lucide-react';
// @ts-ignore
import { useApp } from '../context/AppContext';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
}

export function UpgradeModal({ isOpen, onClose, featureName }: UpgradeModalProps) {
  const { user, loginWithGoogle } = useApp() as any;

  if (!isOpen) return null;

  const handleUpgradeClick = async () => {
    // If they are anonymous, force them to create a permanent account first so we don't lose their subscription!
    if (user?.isAnonymous) {
      await loginWithGoogle();
      return;
    }

    // Redirect to the Stripe checkout, passing their Firebase UID so the backend knows who paid
    const stripePaymentLink = `https://buy.stripe.com/test_6oU00jbfRcjV2Vk97Sew800?client_reference_id=${user?.uid}`;
    window.location.href = stripePaymentLink;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111827] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
        
        {/* Header Graphic */}
        <div className="relative bg-gradient-to-br from-blue-600 to-indigo-800 p-8 text-center overflow-hidden">
          <div className="absolute top-4 right-4 z-10">
            <button onClick={onClose} className="p-2 bg-black/20 hover:bg-black/40 rounded-full text-white/80 hover:text-white transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="relative z-10 w-16 h-16 mx-auto bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 border border-white/30 shadow-xl">
            <Lock className="h-8 w-8 text-white" />
          </div>
          
          <h2 className="relative z-10 text-2xl font-bold text-white mb-2 tracking-tight">
            Unlock {featureName}
          </h2>
          <p className="relative z-10 text-blue-100 text-sm max-w-xs mx-auto">
            Upgrade to MCP Studio Pro to empower your AI agents with advanced enterprise features.
          </p>

          {/* Decorative background shapes */}
          <div className="absolute top-0 left-0 w-full h-full opacity-30">
            <div className="absolute top-[-50%] left-[-20%] w-64 h-64 bg-blue-400 rounded-full mix-blend-overlay filter blur-3xl"></div>
            <div className="absolute bottom-[-50%] right-[-20%] w-64 h-64 bg-purple-400 rounded-full mix-blend-overlay filter blur-3xl"></div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 bg-green-100 dark:bg-green-900/30 p-1 rounded-full"><CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" /></div>
              <div>
                <h4 className="font-semibold text-[#141B41] dark:text-white text-sm flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-blue-500" /> Macro Bundling</h4>
                <p className="text-slate-500 dark:text-slate-400 text-xs">Combine multiple API calls into single tools to save tokens.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="mt-0.5 bg-green-100 dark:bg-green-900/30 p-1 rounded-full"><CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" /></div>
              <div>
                <h4 className="font-semibold text-[#141B41] dark:text-white text-sm flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-red-500" /> PII Data Masking</h4>
                <p className="text-slate-500 dark:text-slate-400 text-xs">Automatically redact emails and phones before they hit the LLM.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 bg-green-100 dark:bg-green-900/30 p-1 rounded-full"><CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" /></div>
              <div>
                <h4 className="font-semibold text-[#141B41] dark:text-white text-sm flex items-center gap-1.5"><Server className="h-3.5 w-3.5 text-purple-500" /> Unlimited Proxies</h4>
                <p className="text-slate-500 dark:text-slate-400 text-xs">Deploy as many private proxy servers as your team needs.</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleUpgradeClick}
            className="w-full py-3.5 bg-[#141B41] dark:bg-blue-600 hover:bg-[#1a2352] dark:hover:bg-blue-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {user?.isAnonymous ? 'Sign in to Upgrade' : 'Upgrade to Pro - $19/mo'}
            <Sparkles className="h-4 w-4" />
          </button>
          
          <p className="text-center text-xs text-slate-400 mt-4">
            Secure payment powered by Stripe.
          </p>
        </div>
      </div>
    </div>
  );
}