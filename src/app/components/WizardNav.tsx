import { Check, ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router';

const steps = [
  { path: '/', label: 'Upload', step: 1 },
  { path: '/prune', label: 'Prune', step: 2 },
  { path: '/macro-tools', label: 'Macro Tools', step: 3 },
  { path: '/auth', label: 'Auth Keys', step: 4 },
  { path: '/deploy', label: 'Deploy', step: 5 },
];

export function WizardNav() {
  const location = useLocation();
  const currentStepIndex = steps.findIndex(s => s.path === location.pathname);

  return (
    <div className="bg-white/50 dark:bg-[#0B0F19]/50 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 px-8 py-4 transition-colors">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = location.pathname === step.path;
            const isCompleted = index < currentStepIndex;
            const isClickable = index <= currentStepIndex;

            return (
              <div key={step.path} className="flex items-center flex-1 last:flex-none">
                <Link
                  to={step.path}
                  className={`flex flex-col sm:flex-row items-center gap-2 sm:gap-3 ${
                    isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                  }`}
                  onClick={(e) => {
                    if (!isClickable) e.preventDefault();
                  }}
                >
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? 'border-[#141B41] bg-[#141B41] text-white dark:border-blue-500 dark:bg-blue-500 shadow-md scale-110'
                        : isCompleted
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-slate-300 bg-transparent text-slate-400 dark:border-slate-700'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span>{step.step}</span>
                    )}
                  </div>
                  <span
                    className={`text-xs sm:text-sm font-medium hidden sm:block ${
                      isActive ? 'text-[#141B41] dark:text-blue-400' : isCompleted ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </Link>
                {index < steps.length - 1 && (
                  <div className="flex-1 mx-2 sm:mx-4 h-px bg-slate-200 dark:bg-slate-800">
                    <div 
                      className="h-full bg-green-500 transition-all duration-500 ease-in-out" 
                      style={{ width: isCompleted ? '100%' : '0%' }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}