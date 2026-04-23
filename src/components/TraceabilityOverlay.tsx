/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '../lib/utils';

export default function TraceabilityOverlay({ isOpen }: { isOpen: boolean }) {
  const steps = [
    { id: 'UR', name: 'User Requirements', status: 'verified' },
    { id: 'SR', name: 'System Requirements', status: 'verified' },
    { id: 'SS', name: 'Subsystem Specs', status: 'verified' },
    { id: 'MD', name: 'Module Specs', status: 'verified' },
  ];

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ x: -400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -400, opacity: 0 }}
      className="absolute top-32 left-12 z-30 w-72 p-8 bg-[#121212] border border-white/5 shadow-2xl pointer-events-auto"
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-[#c5a059]" />
      
      <div className="text-[10px] uppercase tracking-[0.2em] text-[#c5a059] font-bold mb-6">
        System Traceability Matrix
      </div>
      
      <div className="space-y-4">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center justify-between group border-b border-white/5 pb-3">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-2 h-2 rounded-full",
                step.status === 'verified' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-white/10"
              )}>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest leading-none mb-1">{step.id} Index</span>
                <span className="text-xs text-white group-hover:text-[#c5a059] transition-colors uppercase tracking-wider font-light">
                  {step.name}
                </span>
              </div>
            </div>
            {step.status === 'verified' && (
              <CheckCircle2 className="w-3 h-3 text-green-500/50" />
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 pt-4">
        <div className="text-[9px] text-gray-600 uppercase tracking-[0.1em] font-mono leading-relaxed">
          Verification: <span className="text-green-500">OPTIMAL</span><br />
          Frame Rate: <span className="text-white">60.03 hz</span><br />
          Latency: <span className="text-white">8.4 ms</span>
        </div>
      </div>
    </motion.div>
  );
}
