import React, { useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, Sparkles, XCircle } from 'lucide-react';

interface AtsScoreBarProps {
  score: number | string;
  matchedKeywords?: string[];
  missingKeywords?: string[];
  showDetails?: boolean;
}

export const AtsScoreBar: React.FC<AtsScoreBarProps> = ({
  score,
  matchedKeywords = [],
  missingKeywords = [],
  showDetails = false
}) => {
  const [expanded, setExpanded] = useState(showDetails);
  const numericScore = typeof score === 'string' ? parseFloat(score) || 0 : score;

  // Determine color theme based on score thresholds
  const getColor = (s: number) => {
    if (s >= 80) return { bar: 'bg-emerald-500', text: 'text-emerald-400', badge: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' };
    if (s >= 60) return { bar: 'bg-amber-500', text: 'text-amber-400', badge: 'bg-amber-500/10 border-amber-500/30 text-amber-300' };
    return { bar: 'bg-rose-500', text: 'text-rose-400', badge: 'bg-rose-500/10 border-rose-500/30 text-rose-300' };
  };

  const colors = getColor(numericScore);

  return (
    <div className="w-full space-y-2">
      {/* Score Header */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-medium text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>ATS Match Score</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full font-semibold border ${colors.badge}`}>
            {numericScore.toFixed(1)}%
          </span>
          {(matchedKeywords.length > 0 || missingKeywords.length > 0) && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-slate-400 hover:text-slate-200 transition-colors p-0.5"
              title="Toggle keyword breakdown"
              type="button"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden border border-slate-700/60 shadow-inner">
        <div
          className={`h-full ${colors.bar} transition-all duration-700 ease-out rounded-full`}
          style={{ width: `${Math.min(100, Math.max(0, numericScore))}%` }}
        />
      </div>

      {/* Collapsible Keywords Breakdown */}
      {expanded && (matchedKeywords.length > 0 || missingKeywords.length > 0) && (
        <div className="pt-2 text-xs border-t border-slate-800/80 space-y-2 animate-fadeIn">
          {matchedKeywords.length > 0 && (
            <div>
              <span className="text-slate-400 flex items-center gap-1 mb-1 font-medium">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 inline" /> Matched ({matchedKeywords.length}):
              </span>
              <div className="flex flex-wrap gap-1">
                {matchedKeywords.map((kw, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 rounded text-[11px]"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {missingKeywords.length > 0 && (
            <div>
              <span className="text-slate-400 flex items-center gap-1 mb-1 font-medium">
                <XCircle className="w-3 h-3 text-rose-400 inline" /> Missing ({missingKeywords.length}):
              </span>
              <div className="flex flex-wrap gap-1">
                {missingKeywords.map((kw, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 bg-rose-950/60 border border-rose-800/50 text-rose-300 rounded text-[11px]"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
