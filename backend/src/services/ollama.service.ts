import { env } from '../config/env';
import { OllamaFollowUpRequest, OllamaFollowUpResponse } from '../types/application.types';

/**
 * Generate a personalized follow-up email using local offline Ollama instance (Llama 3)
 * USP 2: Direct HTTP integration with http://127.0.0.1:11434/api/generate
 */
export async function generateFollowUpEmail(
  params: OllamaFollowUpRequest
): Promise<OllamaFollowUpResponse> {
  const company = params.company || 'the hiring team';
  const role = params.role || 'the open position';
  const contactName = params.contactName || 'Hiring Manager';
  const appliedDateStr = params.appliedDate
    ? new Date(params.appliedDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : 'two weeks ago';

  // Calculate elapsed days
  let daysAgo = 14;
  if (params.appliedDate) {
    const diffTime = Math.abs(Date.now() - new Date(params.appliedDate).getTime());
    daysAgo = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  }

  const tone = params.tone || 'professional';

  // Construct structured prompt for Llama 3
  const prompt = `You are an expert career advisor. Write a concise, courteous, and compelling follow-up email for a candidate who submitted a job application that has gone stale.

Details:
- Target Company: ${company}
- Applied Position: ${role}
- Recruiter / Contact Name: ${contactName}
- Application Date: ${appliedDateStr} (${daysAgo} days ago)
- Tone: ${tone}
${params.notes ? `- Additional Context / Interview Notes: ${params.notes}` : ''}
${params.jobDescription ? `- Job Description Snippet: ${params.jobDescription.slice(0, 300)}...` : ''}

Output format:
Subject: [Clear, compelling subject line]

Dear [Name],
[2-3 short, impactful paragraphs highlighting enthusiasm, checking in respectfully on the status, and offering to provide any additional materials or schedule a brief introductory call.]

Best regards,
[Candidate Name]`;

  const ollamaUrl = `${env.OLLAMA_BASE_URL}/api/generate`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

    const response = await fetch(ollamaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: env.OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = (await response.json()) as { response?: string; error?: string };
      if (data.response) {
        const fullText = data.response.trim();
        const subjectMatch = fullText.match(/^Subject:\s*(.*)/im);
        let subject = `Following up: ${role} Application - [Candidate Name]`;
        let emailBody = fullText;

        if (subjectMatch) {
          subject = subjectMatch[1].trim();
          emailBody = fullText.replace(/^Subject:\s*.*[\r\n]+/im, '').trim();
        }

        return {
          success: true,
          subject,
          emailBody,
          model: env.OLLAMA_MODEL,
          isLocalLlm: true,
          generatedAt: new Date().toISOString(),
          diagnostics: `Generated successfully by local Ollama model (${env.OLLAMA_MODEL})`
        };
      }
    }
  } catch (error: any) {
    console.warn(`[Ollama Service Alert]: Local Ollama instance not reachable at ${ollamaUrl}: ${error.message}`);
  }

  // Graceful deterministic fallback when Ollama is offline or model is still downloading
  const fallbackDraft = buildDeterministicFollowUpTemplate(
    company,
    role,
    contactName,
    appliedDateStr,
    daysAgo,
    tone
  );

  return {
    success: true,
    subject: fallbackDraft.subject,
    emailBody: fallbackDraft.emailBody,
    model: `${env.OLLAMA_MODEL} (Local Fallback Engine)`,
    isLocalLlm: false,
    generatedAt: new Date().toISOString(),
    diagnostics: `Ollama is offline or unreachable at ${env.OLLAMA_BASE_URL}. To use live Llama 3 generation, ensure Ollama is running locally: "ollama run ${env.OLLAMA_MODEL}"`
  };
}

/**
 * Check if the local Ollama instance is online and what models are available
 */
export async function checkOllamaHealth(): Promise<{ online: boolean; models: string[]; url: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${env.OLLAMA_BASE_URL}/api/tags`, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = (await res.json()) as { models?: Array<{ name: string }> };
      const models = data.models ? data.models.map((m) => m.name) : [];
      return { online: true, models, url: env.OLLAMA_BASE_URL };
    }
  } catch {
    // Offline
  }

  return { online: false, models: [], url: env.OLLAMA_BASE_URL };
}

/**
 * High-quality fallback template generator ensuring seamless UX even if Ollama is not yet started
 */
function buildDeterministicFollowUpTemplate(
  company: string,
  role: string,
  contactName: string,
  appliedDateStr: string,
  daysAgo: number,
  tone: string
): { subject: string; emailBody: string } {
  const subject = `Following Up on Application for ${role} - ${company}`;

  let body = '';
  if (tone === 'enthusiastic') {
    body = `Dear ${contactName},

I hope this message finds you well!

I am writing to enthusiastically check in regarding my application for the ${role} position at ${company}, which I submitted on ${appliedDateStr} (approximately ${daysAgo} days ago). 

I remain thrilled about the mission and work being done at ${company}. Having reviewed your current technical roadmap, I am confident that my background in scalable software engineering and modern web technologies aligns closely with what your team needs.

I would love to learn more about the next steps in your hiring process. If you need any supplemental portfolio samples, references, or code walkthroughs, please let me know. Thank you so much for your time and consideration!

Warm regards,

[Candidate Name]
[Candidate Phone]
[LinkedIn Profile]`;
  } else if (tone === 'direct') {
    body = `Dear ${contactName},

I am writing to inquire about the status of my application for the ${role} position at ${company}, submitted on ${appliedDateStr}.

Given my background with the core technologies and requirements outlined for the role, I am very keen on discussing how I can contribute to your engineering objectives.

Could you please share if you are currently interviewing candidates or if there are any updates regarding the hiring timeline? I am available for a brief conversation at your convenience.

Thank you for your time.

Sincerely,

[Candidate Name]
[Candidate Phone]
[LinkedIn Profile]`;
  } else {
    // Professional standard
    body = `Dear ${contactName},

I hope you are having a productive week.

I am following up on my application for the ${role} opening at ${company}, submitted on ${appliedDateStr}. As it has been about ${daysAgo} days, I wanted to reaffirm my strong interest in joining your team and inquire about the status of your review process.

My technical experience aligns well with the challenges described for the role, and I would welcome the opportunity to discuss how my skill set can support your team's current milestones.

Please let me know if there are any additional details or work samples I can provide to assist in your evaluation. I look forward to hearing from you.

Best regards,

[Candidate Name]
[Candidate Phone]
[LinkedIn Profile]`;
  }

  return { subject, emailBody: body };
}
