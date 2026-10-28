import React, { useState } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  XCircle,
  FileText,
  BarChart2,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { AtsScoreResult } from '../types';
import { api } from '../services/api';

interface AtsCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_SAMPLES = [
  {
    name: 'Full-Stack Developer (React / Node / Postgres)',
    jd: 'Seeking a Full-Stack Software Developer proficient in React, TypeScript, Tailwind CSS, Node.js, Express, and PostgreSQL. Must have experience building REST APIs, writing raw SQL queries, and optimizing frontend performance.',
    resume: 'Full-Stack Software Engineer with 4 years building web applications. Expert in React, TypeScript, Node.js, Express APIs, and PostgreSQL database queries with pg-pool. Styled dashboards with Tailwind CSS and styled-components.'
  },
  {
    name: 'Distributed Systems & Cloud Architect',
    jd: 'Looking for a Senior Backend Architect experienced in distributed systems, microservices, Redis caching, Docker, Kubernetes, and PostgreSQL optimization.',
    resume: 'Backend Engineer with focus on Python, Django, MongoDB, and AWS S3. Interested in learning microservices and container orchestration.'
  }
];

export const AtsCalculatorModal: React.FC<AtsCalculatorModalProps> = ({
  isOpen,
  onClose
}) => {
  const [jobDescription, setJobDescription] = useState(PRESET_SAMPLES[0].jd);
  const [resumeText, setResumeText] = useState(PRESET_SAMPLES[0].resume);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AtsScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = async () => {
    if (!jobDescription.trim() || !resumeText.trim()) {
      setError('Please provide both Job Description and Resume Text.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await api.calculateAtsScore(jobDescription, resumeText);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Scoring calculation failed');
    } finally {
      setLoading(false);
    }
  };

  const loadPreset = (index: number) => {
    setJobDescription(PRESET_SAMPLES[index].jd);
    setResumeText(PRESET_SAMPLES[index].resume);
    setResult(null);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Offline ATS Keyword Scorer (Pure TypeScript TF-IDF)
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                  USP 1
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                100% In-Memory vector analysis, cosine similarity & keyword coverage calculation
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {/* Preset Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-400">Load Benchmark Sample:</span>
            {PRESET_SAMPLES.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => loadPreset(idx)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 font-medium transition-colors"
              >
                {sample.name}
              </button>
            ))}
          </div>

          {/* Input Areas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-400" />
                Target Job Description
              </label>
              <textarea
                rows={6}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste Job Description here..."
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed font-sans"
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-400" />
                Submitted Candidate Resume
              </label>
              <textarea
                rows={6}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste Resume content here..."
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed font-sans"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300">
              {error}
            </div>
          )}

          {/* Trigger Button */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleCalculate}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Analyzing TF-IDF Vectors...' : 'Calculate ATS Match Score'}</span>
            </button>
          </div>

          {/* Results Display */}
          {result && (
            <div className="p-5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-4 animate-fadeIn">
              {/* Score Metric Top Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-center">
                  <span className="text-slate-400 font-semibold block mb-1">Composite ATS Score</span>
                  <span className="text-3xl font-black text-emerald-400">
                    {result.atsScore.toFixed(1)}%
                  </span>
                </div>

                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-center">
                  <span className="text-slate-400 font-semibold block mb-1">Cosine Semantic Similarity</span>
                  <span className="text-2xl font-bold text-blue-400">
                    {(result.breakdown.cosineSimilarity * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-center">
                  <span className="text-slate-400 font-semibold block mb-1">Target Keyword Coverage</span>
                  <span className="text-2xl font-bold text-indigo-400">
                    {(result.breakdown.keywordCoverage * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Matched vs Missing Chips */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800">
                  <h5 className="font-bold text-emerald-400 flex items-center gap-1.5 mb-2">
                    <CheckCircle2 className="w-4 h-4" /> Matched Keywords ({result.matchedKeywords.length})
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {result.matchedKeywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 rounded-md text-[11px]"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800">
                  <h5 className="font-bold text-rose-400 flex items-center gap-1.5 mb-2">
                    <XCircle className="w-4 h-4" /> Missing Key Requirements ({result.missingKeywords.length})
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {result.missingKeywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-rose-950/80 border border-rose-800/60 text-rose-300 rounded-md text-[11px]"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Engine Recommendations */}
              {result.recommendations.length > 0 && (
                <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-1.5">
                  <h5 className="font-bold text-blue-300 flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-blue-400" /> Actionable Resume Optimization Tips
                  </h5>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 text-xs pl-1">
                    {result.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-800 bg-slate-900/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
