import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Mail,
  Building,
  Briefcase,
  AlertTriangle,
  Info
} from 'lucide-react';
import { JobApplication, OllamaFollowUpResponse } from '../types';
import { api } from '../services/api';

interface FollowUpModalProps {
  application: JobApplication;
  isOpen: boolean;
  onClose: () => void;
}

export const FollowUpModal: React.FC<FollowUpModalProps> = ({
  application,
  isOpen,
  onClose
}) => {
  const [tone, setTone] = useState<'professional' | 'enthusiastic' | 'direct' | 'executive'>('professional');
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [subject, setSubject] = useState<string>('');
  const [emailBody, setEmailBody] = useState<string>('');
  const [responseMeta, setResponseMeta] = useState<OllamaFollowUpResponse | null>(null);

  // Calculate elapsed days
  const diffTime = Math.abs(Date.now() - new Date(application.applied_date).getTime());
  const daysAgo = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const handleGenerate = async (selectedTone = tone) => {
    setLoading(true);
    setError(null);
    setCopied(false);

    try {
      const res = await api.generateFollowUp({
        applicationId: application.id,
        company: application.company,
        role: application.role,
        contactName: application.contact_name || undefined,
        appliedDate: application.applied_date,
        notes: application.notes || undefined,
        jobDescription: application.job_description || undefined,
        resumeText: application.resume_text || undefined,
        tone: selectedTone
      });

      setResponseMeta(res);
      setSubject(res.subject);
      setEmailBody(res.emailBody);
    } catch (err: any) {
      setError(err.message || 'Failed to generate follow-up email');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      handleGenerate();
    }
  }, [isOpen, application.id]);

  const handleCopy = () => {
    const fullText = `Subject: ${subject}\n\n${emailBody}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Local LLM Follow-Up Generator
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
                  Ollama Llama 3
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Drafting personalized follow-up for stale application ({daysAgo} days old)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm flex-1">
          {/* Target Info Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Building className="w-4 h-4 text-slate-400" />
              <span className="truncate font-medium">{application.company}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Briefcase className="w-4 h-4 text-slate-400" />
              <span className="truncate font-medium">{application.role}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Mail className="w-4 h-4 text-slate-400" />
              <span className="truncate">{application.contact_name || 'Hiring Team'}</span>
            </div>
          </div>

          {/* Tone Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Select Desired Email Tone:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['professional', 'enthusiastic', 'direct', 'executive'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTone(t);
                    handleGenerate(t);
                  }}
                  disabled={loading}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize border transition-all text-center ${
                    tone === t
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Diagnostics / Connection Alert Banner */}
          {responseMeta && !responseMeta.isLocalLlm && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-amber-300">Offline Fallback Engine Active</p>
                <p className="text-amber-200/80 mt-0.5">
                  Local Ollama is offline at <code className="bg-black/30 px-1 py-0.5 rounded">http://127.0.0.1:11434</code>. 
                  To activate real-time Llama 3 inference, start Ollama: <code className="bg-black/30 px-1 py-0.5 rounded font-mono">ollama run llama3</code>.
                </p>
              </div>
            </div>
          )}

          {responseMeta && responseMeta.isLocalLlm && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-200 text-xs flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Generated natively by offline model: <strong>{responseMeta.model}</strong>
              </span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Output Fields */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">
                Subject Line
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white font-medium text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-400">
                  Email Body
                </label>
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Info className="w-3 h-3" /> Fully editable before copying
                </span>
              </div>
              <textarea
                rows={9}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-200 text-xs leading-relaxed focus:outline-none focus:border-blue-500 resize-none font-sans"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/60">
          <button
            type="button"
            onClick={() => handleGenerate()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors border border-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Generating with Llama 3...' : 'Regenerate'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-medium transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleCopy}
              disabled={loading || !emailBody}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all shadow-lg ${
                copied
                  ? 'bg-emerald-600 shadow-emerald-500/20'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Full Email</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
