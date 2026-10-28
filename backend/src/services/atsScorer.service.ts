import { AtsKeywordWeight, AtsScoreResult } from '../types/application.types';

/**
 * Standard English Stopwords + Common Recruitment Boilerplate Words
 */
const STOPWORDS = new Set<string>([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are',
  'aren\'t', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both',
  'but', 'by', 'can', 'can\'t', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does',
  'doesn\'t', 'doing', 'don\'t', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had',
  'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s',
  'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i',
  'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its',
  'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my', 'myself', 'no', 'nor', 'not', 'of',
  'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over',
  'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t', 'so',
  'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves',
  'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve',
  'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t',
  'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when',
  'when\'s', 'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s',
  'with', 'won\'t', 'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve',
  'your', 'yours', 'yourself', 'yourselves',
  // Generic recruiter / job description filler stopwords
  'role', 'responsibilities', 'qualifications', 'requirements', 'candidate', 'opportunity',
  'company', 'team', 'work', 'working', 'join', 'year', 'years', 'looking', 'seeking', 'need', 'needs',
  'must', 'proficient', 'experience', 'ability', 'preferred', 'plus', 'familiarity', 'strong',
  'day', 'days', 'including', 'apply', 'applied', 'applicant', 'job', 'position', 'duties',
  'build', 'building', 'across', 'high', 'help', 'scale', 'fast', 'paced', 'environment'
]);

/**
 * Domain-specific technical multi-word phrases to preserve
 */
const KNOWN_TECH_PHRASES = [
  'node.js', 'react.js', 'vue.js', 'next.js', 'express.js', 'c++', 'c#', '.net',
  'ci/cd', 'rest api', 'graphql api', 'full stack', 'front end', 'back end',
  'machine learning', 'deep learning', 'distributed systems', 'cloud architecture',
  'relational database', 'nosql database', 'unit testing', 'test driven development',
  'code review', 'performance tuning', 'message queue', 'event driven',
  'microservices architecture', 'clean code', 'design patterns', 'agile scrum',
  'pull request', 'version control', 'local llm', 'vector search', 'raw sql',
  'tailwind css', 'object oriented'
];

/**
 * Lightweight Porter-inspired stemmer for normalising verb/noun variations
 */
export function stemWord(word: string): string {
  let w = word.toLowerCase();
  if (w.length <= 3) return w;

  // Preserve technical tokens
  if (w.includes('.') || w.includes('+') || w.includes('#') || w.includes('/')) {
    return w;
  }

  // Common suffix reductions
  if (w.endsWith('sses')) return w.slice(0, -2);
  if (w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.endsWith('ss')) return w;
  if (w.endsWith('s') && !w.endsWith('us') && !w.endsWith('is')) return w.slice(0, -1);

  if (w.endsWith('eed')) return w.slice(0, -1);
  if (w.endsWith('ed') && w.length > 4) return w.slice(0, -2);
  if (w.endsWith('ing') && w.length > 5) return w.slice(0, -3);

  if (w.endsWith('ational')) return w.slice(0, -5) + 'e';
  if (w.endsWith('tional')) return w.slice(0, -2);
  if (w.endsWith('ization')) return w.slice(0, -5) + 'e';
  if (w.endsWith('ation')) return w.slice(0, -3) + 'e';
  if (w.endsWith('ment')) return w.slice(0, -4);
  if (w.endsWith('ible') || w.endsWith('able')) return w.slice(0, -4);
  if (w.endsWith('ity')) return w.slice(0, -3);
  if (w.endsWith('ful')) return w.slice(0, -3);
  if (w.endsWith('ness')) return w.slice(0, -4);

  return w;
}

/**
 * Tokenize and normalize document text into clean words and recognized n-grams
 */
export function tokenizeText(text: string): { originalTokens: string[]; stemmedTokens: string[] } {
  if (!text || typeof text !== 'string') {
    return { originalTokens: [], stemmedTokens: [] };
  }

  const lower = text.toLowerCase();
  const extractedPhrases: string[] = [];

  // Match recognized compound technical phrases
  for (const phrase of KNOWN_TECH_PHRASES) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'gi');
    if (regex.test(lower)) {
      extractedPhrases.push(phrase);
    }
  }

  // Replace special characters except dots/hyphens in tech terms
  const sanitized = lower
    .replace(/[^\w\s\.\+#\/-]/g, ' ')
    .replace(/\s+/g, ' ');

  const rawWords = sanitized.split(' ');
  const originalTokens: string[] = [...extractedPhrases];
  const stemmedTokens: string[] = [...extractedPhrases.map(stemWord)];

  for (const raw of rawWords) {
    const clean = raw.trim().replace(/^[\.\-]+|[\.\-]+$/g, '');
    if (clean.length > 1 && !STOPWORDS.has(clean) && !/^\d+$/.test(clean)) {
      originalTokens.push(clean);
      stemmedTokens.push(stemWord(clean));
    }
  }

  return { originalTokens, stemmedTokens };
}

/**
 * Compute Term Frequency (TF) with augmented sub-linear scaling
 */
export function computeTF(tokens: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const token of tokens) {
    counts.set(token, (counts.get(token) || 0) + 1);
  }

  const tf = new Map<string, number>();
  if (tokens.length === 0) return tf;

  let maxCount = 0;
  for (const count of counts.values()) {
    if (count > maxCount) maxCount = count;
  }

  // Augmented Term Frequency: prevents bias towards longer documents
  for (const [token, count] of counts.entries()) {
    tf.set(token, 0.5 + 0.5 * (count / maxCount));
  }

  return tf;
}

/**
 * Core Technical Domain Corpus used for Inverse Document Frequency (IDF) calibration
 */
const REFERENCE_IDF_CORPUS = [
  'software engineer typescript node express postgresql react frontend backend fullstack docker',
  'cloud architecture distributed systems microservices redis kafka kubernetes aws devops',
  'database design query optimization indexing postgres raw sql relations triggers tables',
  'api development rest graphql authentication authorization jwt security encryption',
  'data structures algorithms problem solving git testing jest unit tests integration',
  'agile scrum sprint continuous integration deployment pipelines monitoring logging'
];

/**
 * Calculate Inverse Document Frequency (IDF) smoothed across target docs + reference corpus
 */
export function computeIDF(documents: string[][]): Map<string, number> {
  const corpusTokens = REFERENCE_IDF_CORPUS.map((doc) => tokenizeText(doc).stemmedTokens);
  const allDocs = [...documents, ...corpusTokens];
  const N = allDocs.length;
  const docFrequency = new Map<string, number>();

  for (const doc of allDocs) {
    const uniqueTerms = new Set(doc);
    for (const term of uniqueTerms) {
      docFrequency.set(term, (docFrequency.get(term) || 0) + 1);
    }
  }

  const idf = new Map<string, number>();
  for (const [term, df] of docFrequency.entries()) {
    // Smooth IDF formula: ln(1 + (N + 1) / (df + 1)) + 1
    idf.set(term, Math.log(1 + (N + 1) / (df + 1)) + 1);
  }

  return idf;
}

/**
 * Calculate Cosine Similarity between two TF-IDF vector maps
 */
export function cosineSimilarity(
  vecA: Map<string, number>,
  vecB: Map<string, number>
): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const val of vecA.values()) {
    normA += val * val;
  }

  for (const val of vecB.values()) {
    normB += val * val;
  }

  if (normA === 0 || normB === 0) return 0;

  for (const [term, valA] of vecA.entries()) {
    const valB = vecB.get(term);
    if (valB !== undefined) {
      dotProduct += valA * valB;
    }
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Pure TypeScript TF-IDF Engine for ATS Keyword Extraction & Scoring
 * USP 1: Zero cloud APIs, executes 100% locally in-memory.
 */
export function calculateAtsScore(
  jobDescription: string,
  resumeText: string
): AtsScoreResult {
  if (!jobDescription || !jobDescription.trim()) {
    return {
      atsScore: 0,
      matchedKeywords: [],
      missingKeywords: [],
      topJobKeywords: [],
      recommendations: ['Provide a valid job description to compute ATS match score.'],
      breakdown: {
        cosineSimilarity: 0,
        keywordCoverage: 0,
        totalJobKeywordsExtracted: 0,
        matchedCount: 0,
        missingCount: 0
      }
    };
  }

  if (!resumeText || !resumeText.trim()) {
    return {
      atsScore: 0,
      matchedKeywords: [],
      missingKeywords: [],
      topJobKeywords: [],
      recommendations: ['Provide resume content to calculate ATS keyword alignment.'],
      breakdown: {
        cosineSimilarity: 0,
        keywordCoverage: 0,
        totalJobKeywordsExtracted: 0,
        matchedCount: 0,
        missingCount: 0
      }
    };
  }

  // 1. Tokenize texts
  const jdTokens = tokenizeText(jobDescription);
  const resumeTokens = tokenizeText(resumeText);

  // 2. Compute TF for both
  const jdTF = computeTF(jdTokens.stemmedTokens);
  const resumeTF = computeTF(resumeTokens.stemmedTokens);

  // 3. Compute IDF
  const idf = computeIDF([jdTokens.stemmedTokens, resumeTokens.stemmedTokens]);

  // 4. Build TF-IDF Vectors
  const jdVector = new Map<string, number>();
  for (const [term, tfVal] of jdTF.entries()) {
    const idfVal = idf.get(term) || Math.log(2);
    jdVector.set(term, tfVal * idfVal);
  }

  const resumeVector = new Map<string, number>();
  for (const [term, tfVal] of resumeTF.entries()) {
    const idfVal = idf.get(term) || Math.log(2);
    resumeVector.set(term, tfVal * idfVal);
  }

  // 5. Calculate Cosine Similarity (Semantic Vector Match)
  const rawCosine = cosineSimilarity(jdVector, resumeVector);
  const cosineScore = Math.min(1.0, Math.max(0.0, rawCosine));

  // 6. Extract Top Job Keywords ranked by TF-IDF weight
  const stemToOriginal = new Map<string, string>();
  for (let i = 0; i < jdTokens.stemmedTokens.length; i++) {
    const st = jdTokens.stemmedTokens[i];
    const orig = jdTokens.originalTokens[i];
    if (!stemToOriginal.has(st) || orig.length < stemToOriginal.get(st)!.length) {
      stemToOriginal.set(st, orig);
    }
  }

  // Deduplicate and filter out terms that are too short or stopwords
  const sortedJdTerms = Array.from(jdVector.entries())
    .filter(([term]) => term.length >= 3 && !STOPWORDS.has(term))
    .sort((a, b) => b[1] - a[1]);

  // Pick top 12 most distinctive keywords from the job description
  const topTermEntries = sortedJdTerms.slice(0, 12);
  const topJobKeywords: AtsKeywordWeight[] = topTermEntries.map(([term, weight]) => ({
    term: stemToOriginal.get(term) || term,
    weight: Math.round(weight * 100) / 100
  }));

  // 7. Determine Matched vs Missing Keywords
  const resumeStemSet = new Set(resumeTokens.stemmedTokens);
  const resumeRawLower = resumeText.toLowerCase();

  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  for (const [stemmedTerm] of topTermEntries) {
    const readable = stemToOriginal.get(stemmedTerm) || stemmedTerm;
    // Check stemmed match or exact substring match in resume
    if (
      resumeStemSet.has(stemmedTerm) ||
      resumeRawLower.includes(readable.toLowerCase()) ||
      resumeRawLower.includes(stemmedTerm)
    ) {
      matchedKeywords.push(readable);
    } else {
      missingKeywords.push(readable);
    }
  }

  // 8. Compute Keyword Coverage Ratio
  const totalKeywords = topTermEntries.length;
  const keywordCoverage = totalKeywords > 0 ? matchedKeywords.length / totalKeywords : 0;

  // 9. Composite ATS Score (Weighted: 40% Cosine Similarity + 60% Keyword Coverage)
  const compositePercentage = (cosineScore * 0.40 + keywordCoverage * 0.60) * 100;
  const atsScore = Math.round(compositePercentage * 100) / 100;

  // 10. Generate Actionable Resume Recommendations
  const recommendations: string[] = [];
  if (missingKeywords.length > 0) {
    const topMissing = missingKeywords.slice(0, 4).join(', ');
    recommendations.push(
      `Incorporate key target requirements: Add projects or bullet points showcasing experience with "${topMissing}".`
    );
  }

  if (cosineScore < 0.50) {
    recommendations.push(
      'Align terminology: Adopt exact keywords and phrases from the job description into your experience section.'
    );
  }

  if (atsScore >= 80) {
    recommendations.push(
      'High ATS Alignment: Resume demonstrates strong technical qualification and keyword density for this role.'
    );
  } else if (atsScore >= 60) {
    recommendations.push(
      'Moderate ATS Match: Good foundation. Integrating highlighted missing skills will improve ATS ranking.'
    );
  } else {
    recommendations.push(
      'Low ATS Match: Significant keyword disparity. Customize your resume specifically for this position.'
    );
  }

  return {
    atsScore,
    matchedKeywords,
    missingKeywords,
    topJobKeywords,
    recommendations,
    breakdown: {
      cosineSimilarity: Math.round(cosineScore * 100) / 100,
      keywordCoverage: Math.round(keywordCoverage * 100) / 100,
      totalJobKeywordsExtracted: totalKeywords,
      matchedCount: matchedKeywords.length,
      missingCount: missingKeywords.length
    }
  };
}
