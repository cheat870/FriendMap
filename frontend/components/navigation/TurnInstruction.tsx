'use client';

import {
  ArrowUp,
  CornerUpLeft,
  CornerUpRight,
  ArrowUpLeft,
  ArrowUpRight,
  RotateCcw,
  Flag,
  Navigation,
} from 'lucide-react';
import { RouteStep } from '@/types';
import { formatDistance } from '@/services/location.service';

interface TurnInstructionProps {
  step: RouteStep | null;
  nextStep?: RouteStep | null;
  remainingDistanceM?: number;
}

export default function TurnInstruction({
  step,
  nextStep,
  remainingDistanceM,
}: TurnInstructionProps) {
  if (!step) {
    return (
      <div className="bg-emerald-700 text-white p-4 rounded-2xl shadow-xl flex items-center gap-3">
        <Navigation className="w-8 h-8 animate-pulse text-emerald-200" />
        <div>
          <h2 className="text-lg font-bold">កំពុងរៀបចំផ្លូវ (Calculating route)...</h2>
          <p className="text-xs text-emerald-200">សូមរង់ចាំបន្តិច</p>
        </div>
      </div>
    );
  }

  const getManeuverIcon = (maneuver: string = '') => {
    const m = maneuver.toLowerCase();
    if (m.includes('left')) return <CornerUpLeft className="w-9 h-9" />;
    if (m.includes('right')) return <CornerUpRight className="w-9 h-9" />;
    if (m.includes('slight-left') || m.includes('bear-left')) return <ArrowUpLeft className="w-9 h-9" />;
    if (m.includes('slight-right') || m.includes('bear-right')) return <ArrowUpRight className="w-9 h-9" />;
    if (m.includes('uturn')) return <RotateCcw className="w-9 h-9" />;
    if (m.includes('arrive')) return <Flag className="w-9 h-9 text-amber-300" />;
    return <ArrowUp className="w-9 h-9" />;
  };

  return (
    <div className="bg-emerald-700 text-white rounded-3xl shadow-2xl p-4 overflow-hidden border border-emerald-600">
      <div className="flex items-start gap-4">
        {/* Turn maneuver icon */}
        <div className="w-14 h-14 bg-emerald-800 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-600/60 shadow-inner">
          {getManeuverIcon(step.maneuver)}
        </div>

        {/* Current maneuver description */}
        <div className="flex-1 min-w-0">
          <div className="text-2xl font-black tracking-tight text-white flex items-baseline gap-1">
            <span>{formatDistance(remainingDistanceM || step.distance)}</span>
          </div>
          <h3 className="text-base font-bold text-emerald-100 truncate mt-0.5">
            {step.instruction}
          </h3>
        </div>
      </div>

      {/* Next maneuver preview if available */}
      {nextStep && (
        <div className="mt-3 pt-2.5 border-t border-emerald-600/50 flex items-center gap-2 text-xs text-emerald-200">
          <span className="font-semibold text-emerald-100">បន្ទាប់ (Then):</span>
          <span className="truncate">{nextStep.instruction}</span>
        </div>
      )}
    </div>
  );
}
