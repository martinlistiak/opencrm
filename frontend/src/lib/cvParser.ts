import type { ExtractionResult } from './cvExtractor';
import type { CandidateSource, CreateCandidateRequest } from '../types/candidate';

export interface ParsedCandidate extends Partial<CreateCandidateRequest> {
  raw_text: string;
}

// -------------------------------------------------------------------
// Skill dictionary – used for fuzzy matching against extracted text
// -------------------------------------------------------------------
const COMMON_SKILLS = [
  // Programming Languages
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'Go', 'Rust',
  'Ruby', 'PHP', 'Swift', 'Kotlin', 'Scala', 'Dart', 'Elixir', 'Haskell',
  'Objective-C', 'Perl', 'Lua', 'MATLAB',
  // Frontend
  'React', 'Angular', 'Vue.js', 'Svelte', 'Next.js', 'Nuxt', 'Gatsby',
  'HTML', 'CSS', 'SASS', 'SCSS', 'Tailwind', 'Bootstrap', 'Material UI',
  'Redux', 'MobX', 'Zustand', 'jQuery', 'Webpack', 'Vite',
  // Backend
  'Node.js', 'Express', 'NestJS', 'Django', 'Flask', 'FastAPI', 'Spring Boot',
  'Spring', 'Rails', 'Laravel', 'ASP.NET', '.NET', 'Actix', 'Axum',
  // Database
  'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch',
  'DynamoDB', 'Cassandra', 'SQLite', 'MariaDB', 'Neo4j',
  // Cloud & DevOps
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform',
  'Jenkins', 'CI/CD', 'GitHub Actions', 'GitLab CI', 'Ansible',
  'CloudFormation', 'Serverless', 'Lambda',
  // Mobile
  'React Native', 'Flutter', 'iOS', 'Android', 'SwiftUI', 'Jetpack Compose',
  // Data & ML
  'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Pandas',
  'NumPy', 'Scikit-learn', 'Spark', 'Hadoop', 'Kafka', 'Airflow',
  'Data Science', 'NLP', 'Computer Vision',
  // Tools & Practices
  'Git', 'Linux', 'Agile', 'Scrum', 'REST', 'GraphQL', 'gRPC',
  'Microservices', 'TDD', 'Jest', 'Cypress', 'Playwright', 'Selenium',
  'Figma', 'Jira',
];

const skillsLookup = new Map(COMMON_SKILLS.map((s) => [s.toLowerCase(), s]));

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// -------------------------------------------------------------------
// Extractors
// -------------------------------------------------------------------

function extractEmail(text: string): string | undefined {
  const match = text.match(
    /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/,
  );
  return match?.[0];
}

function extractPhone(text: string): string | undefined {
  const patterns = [
    /(?:\+\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/,
    /\+\d{10,15}/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const cleaned = match[0].trim();
      if (cleaned.replace(/\D/g, '').length >= 9) {
        return cleaned;
      }
    }
  }
  return undefined;
}

function extractLinkedIn(text: string): string | undefined {
  const match = text.match(
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]+\/?/i,
  );
  if (match) {
    const url = match[0];
    return url.startsWith('http') ? url : `https://${url}`;
  }
  return undefined;
}

/**
 * Parse a full-name string like "John Doe" or "JOHN DOE" into
 * first_name / last_name. Used when we have a high-confidence name
 * from PDF layout analysis.
 */
function parseFullName(
  fullName: string,
): { first_name: string; last_name: string } | undefined {
  const words = fullName
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  if (words.length < 2) return undefined;

  // Normalize all-caps to title-case
  const normalize = (w: string) =>
    /^[A-Z\u00C0-\u024F]{2,}$/.test(w)
      ? w.charAt(0) + w.slice(1).toLowerCase()
      : w;

  return {
    first_name: normalize(words[0]),
    last_name: words.slice(1).map(normalize).join(' '),
  };
}

/**
 * Text-only name detection: scan the first N non-trivial lines for a
 * pattern that looks like a person's name.
 */
function extractNameFromText(
  text: string,
): { first_name: string; last_name: string } | undefined {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && l.length < 60);

  // LinkedIn PDFs have sidebar text before the name; extend the
  // search window so we don't stop too early.
  const searchLimit = Math.min(lines.length, 30);

  for (let i = 0; i < searchLimit; i++) {
    const line = lines[i];

    // Skip lines that are clearly not names
    if (line.includes('@') || line.includes('http') || line.includes('www.'))
      continue;
    if (/^\d/.test(line)) continue;
    if (line.includes(':')) continue;
    // Skip known section headings
    if (/^(contact|experience|education|summary|skills|top skills|languages|certifications|honors|projects|about)\s*$/i.test(line))
      continue;
    // Skip short single words (section headings like "Contact")
    const words = line.split(/\s+/).filter((w) => w.length > 0);
    if (words.length < 2 || words.length > 4) continue;

    // All words should look like name parts (capitalized, all-caps, or accented)
    const namePattern =
      /^[A-ZÁÉÍÓÚÄËÏÖÜČŠŽĎŤŇĽŘŮÝÑ][a-záéíóúäëïöüčšžďťňľřůýñ'-]+$/;
    const allCapsPattern = /^[A-ZÁÉÍÓÚÄËÏÖÜČŠŽĎŤŇĽŘŮÝÑ]{2,}$/;

    if (words.every((w) => namePattern.test(w) || allCapsPattern.test(w))) {
      const normalized = words.map((w) =>
        allCapsPattern.test(w)
          ? w.charAt(0) + w.slice(1).toLowerCase()
          : w,
      );
      return {
        first_name: normalized[0],
        last_name: normalized.slice(1).join(' '),
      };
    }
  }
  return undefined;
}

function extractSkills(text: string): string[] {
  const found = new Set<string>();
  const textLower = text.toLowerCase();

  for (const [skillLower, skillOriginal] of skillsLookup) {
    if (skillLower.length <= 3) {
      const pattern = new RegExp(
        `\\b${escapeRegex(skillLower)}\\b`,
        'i',
      );
      if (pattern.test(text)) {
        found.add(skillOriginal);
      }
    } else {
      if (textLower.includes(skillLower)) {
        found.add(skillOriginal);
      }
    }
  }

  return Array.from(found).sort();
}

function extractCurrentTitle(text: string): string | undefined {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const titleKeywords = [
    'developer', 'engineer', 'designer', 'manager', 'analyst',
    'architect', 'consultant', 'director', 'lead', 'specialist',
    'administrator', 'coordinator', 'scientist', 'researcher',
    'intern', 'senior', 'junior', 'principal', 'staff', 'head of',
    'vp of', 'cto', 'ceo', 'cfo', 'devops', 'sre', 'qa', 'tester',
    'scrum master', 'product owner', 'product manager',
  ];

  // Search within the first ~25 lines (wider for LinkedIn PDFs)
  for (const line of lines.slice(1, 25)) {
    if (line.includes('@') && line.includes('.')) continue;
    if (line.startsWith('http')) continue;
    if (line.length > 100 || line.length < 5) continue;

    // "Title at Company" or "Title | Company"
    const atPattern = /^(.+?)\s+(?:at|@|u)\s+(.+)$/i;
    const pipePattern = /^(.+?)\s*[|·•–—]\s*(.+)$/;

    for (const pattern of [atPattern, pipePattern]) {
      const match = line.match(pattern);
      if (match) {
        return `${match[1].trim()} at ${match[2].trim()}`;
      }
    }

    // Standalone title-like line
    if (
      titleKeywords.some((k) => line.toLowerCase().includes(k)) &&
      line.length < 80
    ) {
      return line;
    }
  }
  return undefined;
}

// -------------------------------------------------------------------
// Main parser
// -------------------------------------------------------------------

export function parseCvText(result: ExtractionResult): ParsedCandidate {
  const { text, nameFromLayout } = result;

  // Name: prefer layout-based detection (font-size), fall back to text heuristics
  const name =
    (nameFromLayout ? parseFullName(nameFromLayout) : null) ??
    extractNameFromText(text);

  const email = extractEmail(text);
  const phone = extractPhone(text);
  const linkedIn = extractLinkedIn(text);
  const skills = extractSkills(text);
  const currentTitle = extractCurrentTitle(text);

  // Detect if this is a LinkedIn export
  const isLinkedIn = /linkedin\.com\/in\//i.test(text);

  return {
    first_name: name?.first_name ?? '',
    last_name: name?.last_name ?? '',
    email,
    phone,
    linkedin_url: linkedIn,
    current_title: currentTitle,
    skills,
    source: (isLinkedIn ? 'linkedin' : 'other') as CandidateSource,
    notes: [
      '[Auto-imported from CV]',
      '',
      'Extracted text (preview):',
      text.substring(0, 2000) + (text.length > 2000 ? '...' : ''),
    ].join('\n'),
    raw_text: text,
  };
}
