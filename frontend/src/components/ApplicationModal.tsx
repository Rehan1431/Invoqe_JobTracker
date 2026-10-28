import React, { useState, useEffect } from 'react';
import {
  X,
  Building,
  Briefcase,
  MapPin,
  DollarSign,
  Calendar,
  User,
  Mail,
  FileText,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { ApplicationStatus, AtsScoreResult, CreateApplicationInput, JobApplication } from '../types';
import { api } from '../services/api';

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateApplicationInput) => Promise<void>;
  application?: JobApplication | null;
}

export const ApplicationModal: React.FC<ApplicationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  application
}) => {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState<ApplicationStatus>('Pending');
  const [location, setLocation] = useState('Remote');
  const [salaryRange, setSalaryRange] = useState('');
  const [appliedDate, setAppliedDate] = useState(new Date().toISOString().split('T')[0]);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [resumeText, setResumeText] = useState('');

  // Live in-modal ATS Scorer state
  const [liveAtsResult, setLiveAtsResult] = useState<AtsScoreResult | null>(null);
  const [isScoring, setIsScoring] = useState(false);
  const [scoringError, setScoringError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Populate form if editing
  useEffect(() => {
    if (application) {
      setCompany(application.company || '');
      setRole(application.role || '');
      setStatus(application.status || 'Pending');
      setLocation(application.location || 'Remote');
      setSalaryRange(application.salary_range || '');
      setAppliedDate(
        application.applied_date
          ? new Date(application.applied_date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
      setContactName(application.contact_name || '');
      setContactEmail(application.contact_email || '');
      setNotes(application.notes || '');
      setJobDescription(application.job_description || '');
      setResumeText(application.resume_text || '');
      setLiveAtsResult(null);
    } else {
      // Reset form
      setCompany('');
      setRole('');
      setStatus('Pending');
      setLocation('Remote');
      setSalaryRange('');
      setAppliedDate(new Date().toISOString().split('T')[0]);
      setContactName('');
      setContactEmail('');
      setNotes('');
      setJobDescription('');
      setResumeText('');
      setLiveAtsResult(null);
    }
    setFormError(null);
    setScoringError(null);
  }, [application, isOpen]);

  // Test ATS Score on the fly
  const handleTestAts = async () => {
    if (!jobDescription.trim() || !resumeText.trim()) {
      setScoringError('Please paste both a Job Description and Resume Text to score ATS match.');
      return;
    }

    setIsScoring(true);
    setScoringError(null);

    try {
      const res = await api.calculateAtsScore(jobDescription, resumeText);
      setLiveAtsResult(res);
    } catch (err: any) {
      setScoringError(err.message || 'Failed to calculate ATS score');
    } finally {
      setIsScoring(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) {
      setFormError('Company and Role are required.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      await onSubmit({
        company: company.trim(),
        role: role.trim(),
        status,
        location: location.trim() || undefined,
        salary_range: salaryRange.trim() || undefined,
        applied_date: appliedDate,
        contact_name: contactName.trim() || undefined,
        contact_email: contactEmail.trim() || undefined,
        notes: notes.trim() || undefined,
        job_description: jobDescription.trim() || undefined,
        resume_text: resumeText.trim() || undefined
      });
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save application');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {application ? 'Edit Job Application' : 'Create New Job Application'}
              </h3>
              <p className="text-xs text-slate-400">
                Track status and automatically calculate ATS match score via local TF-IDF engine
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {formError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Row 1: Company, Role, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Company *</label>
              <div className="relative">
                <Building className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Stripe, Google"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">Role Title *</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Backend Engineer"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="Pending">Pending</option>
                <option value="Interview">Interview</option>
                <option value="Offer">Offer</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Row 2: Location, Salary, Applied Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="e.g. Remote (US), Austin TX"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">Salary Range</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="e.g. $140k - $160k"
                  value={salaryRange}
                  onChange={(e) => setSalaryRange(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">Applied Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="date"
                  value={appliedDate}
                  onChange={(e) => setAppliedDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Row 3: Contact Name, Contact Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Recruiter / Contact Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="e.g. Jane Doe"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">Recruiter Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="email"
                  placeholder="e.g. jdoe@company.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Row 4: Notes */}
          <div>
            <label className="font-semibold text-slate-300 block mb-1">Interview Notes / Application Log</label>
            <textarea
              rows={2}
              placeholder="e.g. Referral from John, technical assessment passed, scheduled follow-up"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Section: ATS Scorer Inputs */}
          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <h4 className="font-bold text-white text-xs">
                  ATS Keyword Scorer Inputs (USP 1 - Offline TF-IDF)
                </h4>
              </div>
              <button
                type="button"
                onClick={handleTestAts}
                disabled={isScoring || !jobDescription || !resumeText}
                className="flex items-center gap-1.5 px-3 py-1 bg-blue-600/20 border border-blue-500/40 text-blue-300 hover:bg-blue-600 hover:text-white rounded-lg transition-colors font-semibold disabled:opacity-40"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isScoring ? 'animate-spin' : ''}`} />
                <span>{isScoring ? 'Analyzing...' : 'Test ATS Score Now'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-slate-400 block mb-1">
                  Job Description Text
                </label>
                <textarea
                  rows={4}
                  placeholder="Paste the full job description or key requirements here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="font-medium text-slate-400 block mb-1">
                  Submitted Resume Text
                </label>
                <textarea
                  rows={4}
                  placeholder="Paste resume content or relevant technical skill summaries..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            {scoringError && (
              <p className="text-rose-400 text-[11px]">{scoringError}</p>
            )}

            {/* Live ATS Result Preview */}
            {liveAtsResult && (
              <div className="p-3 bg-slate-900/90 rounded-xl border border-blue-500/30 space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Live Score Preview:</span>
                  <span className="px-2.5 py-0.5 rounded-full font-bold text-xs bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                    {liveAtsResult.atsScore.toFixed(1)}% Match
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                  <div>
                    Cosine Semantic Sim: <strong>{(liveAtsResult.breakdown.cosineSimilarity * 100).toFixed(0)}%</strong>
                  </div>
                  <div>
                    Keyword Coverage: <strong>{(liveAtsResult.breakdown.keywordCoverage * 100).toFixed(0)}%</strong>
                  </div>
                </div>

                {liveAtsResult.matchedKeywords.length > 0 && (
                  <div>
                    <span className="text-emerald-400 font-medium">Matched: </span>
                    <span className="text-slate-300">{liveAtsResult.matchedKeywords.join(', ')}</span>
                  </div>
                )}

                {liveAtsResult.missingKeywords.length > 0 && (
                  <div>
                    <span className="text-rose-400 font-medium">Missing: </span>
                    <span className="text-slate-300">{liveAtsResult.missingKeywords.join(', ')}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              {submitting ? 'Saving...' : application ? 'Save Changes' : 'Create Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
