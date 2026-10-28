import React from 'react';
import {
  Briefcase,
  Database,
  Plus,
  RefreshCw,
  Sparkles,
  Cpu,
  Clock
} from 'lucide-react';
import { OllamaHealthStatus } from '../types';

interface NavbarProps {
  onOpenAddModal: () => void;
  onOpenAtsCalculator: () => void;
  onTriggerSweep: () => void;
  isSweeping: boolean;
  ollamaStatus: OllamaHealthStatus | null;
  staleCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAddModal,
  onOpenAtsCalculator,
  onTriggerSweep,
  isSweeping,
  ollamaStatus,
  staleCount
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl text-white shadow-lg shadow-blue-500/25">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                  Job Application Tracker
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Task 3
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-slate-400">
                100% Offline • Pure TS TF-IDF Scorer • Local Ollama LLM • 24h Cron
              </p>
            </div>
          </div>

          {/* System Status Indicators */}
          <div className="hidden lg:flex items-center gap-2 text-xs">
            {/* PostgreSQL 18 Indicator */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300"
              title="PostgreSQL 18 Connected via native pg-pool"
            >
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-medium">Postgres 18</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>

            {/* Local Ollama Indicator */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300"
              title={
                ollamaStatus?.online
                  ? `Ollama Llama 3 Online at ${ollamaStatus.url}`
                  : 'Ollama is offline (Local Fallback Engine active). Run "ollama run llama3"'
              }
            >
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-medium">Ollama Llama 3</span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  ollamaStatus?.online ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
            </div>

            {/* 24h Stale Cron Monitor */}
            <button
              onClick={onTriggerSweep}
              disabled={isSweeping}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors disabled:opacity-50"
              title="24h Background Stale Cron Worker (Sweeps for applications >14d without interview). Click to run manual sweep."
            >
              <Clock className={`w-3.5 h-3.5 ${isSweeping ? 'text-amber-400 animate-spin' : 'text-slate-400'}`} />
              <span className="font-medium">24h Cron</span>
              {staleCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {staleCount} stale
                </span>
              )}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            {/* Standalone ATS Tool */}
            <button
              type="button"
              onClick={onOpenAtsCalculator}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all shadow-sm"
              title="Test any resume vs job description using the pure TypeScript TF-IDF engine"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">ATS Scorer</span>
            </button>

            {/* Manual Sweep button for small screens */}
            <button
              type="button"
              onClick={onTriggerSweep}
              disabled={isSweeping}
              className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
              title="Trigger Stale Sweep"
            >
              <RefreshCw className={`w-4 h-4 ${isSweeping ? 'animate-spin text-amber-400' : ''}`} />
            </button>

            {/* New Application Button */}
            <button
              type="button"
              onClick={onOpenAddModal}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Application</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
