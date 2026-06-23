// ============================================================================
// Port of the n8n "Parse Resume HTML" code node.
// Regex-based parser that turns the base resume HTML template into structured
// sections (header, summary, experience[], projects[], skills{}, education[]).
// Logic preserved verbatim; only adapted to TypeScript module form.
// ============================================================================

import type {
  HtmlParseResult,
  ResumeSections,
  ExperienceEntry,
  ProjectEntry,
  EducationEntry,
} from './types.js';

function decodeHtml(str = ''): string {
  return String(str)
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function stripTags(str = ''): string {
  return decodeHtml(String(str).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
}

function cleanArray(value: unknown = []): string[] {
  const arr = Array.isArray(value) ? value : [value];
  return arr.map((x) => String(x || '').trim()).filter(Boolean);
}

function stripOuterBlock(block = '', tagName = 'div'): string {
  return String(block)
    .replace(new RegExp(`^<${tagName}\\b[^>]*>`, 'i'), '')
    .replace(new RegExp(`</${tagName}>\\s*$`, 'i'), '')
    .trim();
}

function extractBalancedBlock(source: string, startIndex: number, tagName: string): string {
  const tokenRx = new RegExp(`<${tagName}\\b[^>]*>|</${tagName}>`, 'gi');
  tokenRx.lastIndex = startIndex;

  let depth = 0;
  let started = false;
  let match: RegExpExecArray | null;

  while ((match = tokenRx.exec(source))) {
    const token = match[0];

    if (!started) {
      if (match.index !== startIndex || /^<\//.test(token)) return '';
      started = true;
      depth = 1;
      continue;
    }

    if (/^<\//.test(token)) depth -= 1;
    else depth += 1;

    if (depth === 0) {
      return source.slice(startIndex, tokenRx.lastIndex);
    }
  }

  return '';
}

function findBlocksByTag(source: string, tagName: string): string[] {
  const openRx = new RegExp(`<${tagName}\\b[^>]*>`, 'gi');
  const blocks: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = openRx.exec(source))) {
    const block = extractBalancedBlock(source, match.index, tagName);
    if (block) {
      blocks.push(block);
      openRx.lastIndex = match.index + block.length;
    }
  }

  return blocks;
}

function findBlocksByTagAndClass(source: string, tagName: string, className: string): string[] {
  const openRx = new RegExp(`<${tagName}\\b[^>]*class=(["'])([^"']*)\\1[^>]*>`, 'gi');
  const blocks: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = openRx.exec(source))) {
    const classes = match[2].split(/\s+/).filter(Boolean);
    if (!classes.includes(className)) continue;

    const block = extractBalancedBlock(source, match.index, tagName);
    if (block) {
      blocks.push(block);
      openRx.lastIndex = match.index + block.length;
    }
  }

  return blocks;
}

function findFirstBlockByTagAndClass(source: string, tagName: string, className: string): string {
  return findBlocksByTagAndClass(source, tagName, className)[0] || '';
}

function getSectionInnerByHeading(source: string, headingText: string): string {
  const sections = findBlocksByTagAndClass(source, 'section', 'section');
  const wanted = String(headingText || '').trim().toUpperCase();

  for (const section of sections) {
    const heading = stripTags((section.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i) || ['', ''])[1]).toUpperCase();
    if (heading === wanted) {
      return section
        .replace(/^<section\b[^>]*>/i, '')
        .replace(/^[\s\S]*?<h2[^>]*>[\s\S]*?<\/h2>/i, '')
        .replace(/<\/section>\s*$/i, '')
        .trim();
    }
  }

  return '';
}

export function parseResumeHtml(baseResumeHtml: string): HtmlParseResult {
  const html = String(baseResumeHtml || '');
  if (!html.trim()) {
    throw new Error('Missing baseResumeHtml.');
  }

  const headerBlock = findBlocksByTag(html, 'header')[0] || '';
  const nameMatch = headerBlock.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const contactBlock = findFirstBlockByTagAndClass(headerBlock, 'div', 'contact');
  const contactInner = stripOuterBlock(contactBlock, 'div');

  const contactParts = [...contactInner.matchAll(/<(a|span)[^>]*>([\s\S]*?)<\/\1>/gi)]
    .map((m) => stripTags(m[2]))
    .filter(Boolean);

  const summaryBlock = getSectionInnerByHeading(html, 'SUMMARY');
  const summaryMatch = summaryBlock.match(/<p[^>]*class=(["'])summary\1[^>]*>([\s\S]*?)<\/p>/i);

  const experienceBlock = getSectionInnerByHeading(html, 'EXPERIENCE');
  const projectBlock = getSectionInnerByHeading(html, 'PROJECTS');
  const skillsBlock = getSectionInnerByHeading(html, 'SKILLS');
  const educationBlock = getSectionInnerByHeading(html, 'EDUCATION');

  const experience: ExperienceEntry[] = findBlocksByTagAndClass(experienceBlock, 'article', 'entry').map(
    (block, idx) => {
      const headBlock = findFirstBlockByTagAndClass(block, 'div', 'entry-head');
      const orgBlock = findFirstBlockByTagAndClass(headBlock, 'div', 'org');
      const roleBlock = findFirstBlockByTagAndClass(headBlock, 'div', 'role');
      const metaBlock = findFirstBlockByTagAndClass(headBlock, 'div', 'meta');
      const metaInner = stripOuterBlock(metaBlock, 'div');

      const metaValues = [...metaInner.matchAll(/<div[^>]*>([\s\S]*?)<\/div>/gi)]
        .map((x) => stripTags(x[1]))
        .filter(Boolean);

      const bullets = findBlocksByTag(block, 'li')
        .map((li) => stripTags(stripOuterBlock(li, 'li')))
        .filter(Boolean);

      return {
        id: `experience_${idx + 1}`,
        org: stripTags(stripOuterBlock(orgBlock, 'div')),
        role: stripTags(stripOuterBlock(roleBlock, 'div')),
        location: metaValues[0] || '',
        dates: metaValues[1] || '',
        bullets: cleanArray(bullets),
      };
    }
  );

  const projects: ProjectEntry[] = findBlocksByTagAndClass(projectBlock, 'article', 'entry').map(
    (block, idx) => {
      const orgBlock = findFirstBlockByTagAndClass(block, 'div', 'org');
      const orgInner = stripOuterBlock(orgBlock, 'div');
      const metaBlock = findFirstBlockByTagAndClass(block, 'div', 'meta');
      const linkMatch = orgBlock.match(/<a[^>]*href=(["'])(.*?)\1/i);

      const title = stripTags(
        orgInner
          .replace(/<span[^>]*class=(["'])[^"']*\bpipe\b[^"']*\1[^>]*>[\s\S]*?<\/span>/gi, ' ')
          .replace(/<a[^>]*>[\s\S]*?<\/a>/gi, ' ')
      );

      const bullets = findBlocksByTag(block, 'li')
        .map((li) => stripTags(stripOuterBlock(li, 'li')))
        .filter(Boolean);

      return {
        id: `project_${idx + 1}`,
        title,
        link: linkMatch ? linkMatch[2] : '',
        dates: stripTags(stripOuterBlock(metaBlock, 'div')),
        bullets: cleanArray(bullets),
      };
    }
  );

  const skillLineBlocks = findBlocksByTagAndClass(skillsBlock, 'p', 'skill-line');
  const skills: Record<string, string[]> = {};

  for (const block of skillLineBlocks) {
    const line = stripOuterBlock(block, 'p');
    const labelMatch = line.match(/<strong>([\s\S]*?):<\/strong>\s*([\s\S]*)$/i);
    if (!labelMatch) continue;

    const label = stripTags(labelMatch[1])
      .toLowerCase()
      .replace(/\s*&\s*/g, '_')
      .replace(/\s+/g, '_');

    skills[label] = cleanArray(stripTags(labelMatch[2]).split(',').map((s) => s.trim()));
  }

  const education: EducationEntry[] = findBlocksByTagAndClass(educationBlock, 'article', 'edu-row').map(
    (block, idx) => {
      const inner = stripOuterBlock(block, 'article');
      const divs = [...inner.matchAll(/<div[^>]*>([\s\S]*?)<\/div>/gi)]
        .map((x) => stripTags(x[1]))
        .filter(Boolean);

      return {
        id: `education_${idx + 1}`,
        text: divs[0] || '',
        dates: divs[1] || '',
      };
    }
  );

  const resumesections: ResumeSections = {
    header: {
      name: stripTags(nameMatch ? nameMatch[1] : ''),
      contact: contactParts.length ? contactParts.join(' | ') : stripTags(contactInner),
    },
    summary: {
      text: stripTags(summaryMatch ? summaryMatch[2] : ''),
    },
    experience,
    projects,
    skills,
    education,
  };

  const sectionLengths = {
    summary: resumesections.summary.text.length,
    experience: JSON.stringify(resumesections.experience).length,
    projects: JSON.stringify(resumesections.projects).length,
    skills: JSON.stringify(resumesections.skills).length,
  };

  const missingSections: string[] = [];
  const warnings: string[] = [];

  if (!resumesections.header.name) missingSections.push('header.name');
  if (!resumesections.summary.text) missingSections.push('summary');
  if (!resumesections.experience.length) missingSections.push('experience');
  if (!resumesections.projects.length) missingSections.push('projects');
  if (!Object.keys(resumesections.skills).length) missingSections.push('skills');
  if (!resumesections.education.length) warnings.push('education_empty');
  if (!resumesections.header.contact) warnings.push('header_contact_empty');

  return {
    resumesections,
    parsermeta: { sectionLengths },
    missingSections,
    warnings,
  };
}
