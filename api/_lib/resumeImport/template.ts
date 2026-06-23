import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ImportedResumeData } from './types.js';

let cachedTemplate: string | null = null;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeHref(value: string): string {
  const href = value.trim();
  if (!href) return '';
  try {
    const parsed = new URL(href);
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol) ? href : '';
  } catch {
    return '';
  }
}

function sectionInner(html: string, headingText: string): string {
  const sectionRx = /<section\b[^>]*class="section"[^>]*>([\s\S]*?)<\/section>/gi;
  for (const match of html.matchAll(sectionRx)) {
    const section = match[0];
    const heading = section.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)?.[1]
      .replace(/<[^>]*>/g, '')
      .trim()
      .toUpperCase();
    if (heading === headingText.toUpperCase()) return section;
  }
  return '';
}

function replaceSectionInner(html: string, headingText: string, newInner: string): string {
  let replaced = false;
  const sectionRx = /<section\b[^>]*class="section"[^>]*>([\s\S]*?)<\/section>/gi;
  const result = html.replace(sectionRx, (fullMatch) => {
    const heading = fullMatch.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)?.[1]
      .replace(/<[^>]*>/g, '')
      .trim()
      .toUpperCase();
    if (heading !== headingText.toUpperCase()) return fullMatch;
    replaced = true;
    return fullMatch.replace(
      /(<h2[^>]*>[\s\S]*?<\/h2>)([\s\S]*)(<\/section>)/i,
      (_match, h2, _oldInner, closing) => `${h2}\n${newInner}\n    ${closing}`,
    );
  });
  if (!replaced) throw new Error(`Base resume template is missing the ${headingText} section.`);
  return result;
}

function renderContact(data: ImportedResumeData): string {
  return data.contact.map((item) => {
    const label = `${escapeHtml(item.text)}&nbsp;`;
    const href = safeHref(item.href);
    if (!href) return `        <span>${label}</span>`;
    return `        <span><a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${label}</a></span>`;
  }).join('\n');
}

function renderExperience(data: ImportedResumeData): string {
  return data.experience.map((entry) => `      <article class="entry">
        <div class="entry-head">
          <div>
            <div class="org">${escapeHtml(entry.organization)}</div>
            <div class="role">${escapeHtml(entry.role)}</div>
          </div>
          <div class="meta">
            <div>${escapeHtml(entry.location)}</div>
            <div>${escapeHtml(entry.dates)}</div>
          </div>
        </div>
        <ul>
${entry.bullets.map((bullet) => `          <li>${escapeHtml(bullet)}</li>`).join('\n')}
        </ul>
      </article>`).join('\n\n');
}

function renderProjects(data: ImportedResumeData): string {
  return data.projects.map((project) => {
    const href = safeHref(project.link);
    const link = href
      ? ` <span class="pipe">|</span> <a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(project.linkLabel)}</a>`
      : '';
    return `      <article class="entry">
        <div class="entry-head">
          <div>
            <div class="org">${escapeHtml(project.title)}${link}</div>
          </div>
          <div class="meta">${escapeHtml(project.dates)}</div>
        </div>
        <ul>
${project.bullets.map((bullet) => `          <li>${escapeHtml(bullet)}</li>`).join('\n')}
        </ul>
      </article>`;
  }).join('\n\n');
}

function renderSkills(data: ImportedResumeData): string {
  return data.skills.map((group) =>
    `      <p class="skill-line"><strong>${escapeHtml(group.category)}:</strong> ${group.items.map(escapeHtml).join(', ')}</p>`
  ).join('\n');
}

function renderEducation(data: ImportedResumeData): string {
  return data.education.map((entry) => {
    const detail = entry.detail
      ? ` <span class="pipe">|</span> ${escapeHtml(entry.detail)}`
      : '';
    return `      <article class="edu-row">
        <div><strong>${escapeHtml(entry.institution)}</strong>${detail}</div>
        <div class="meta">${escapeHtml(entry.dates)}</div>
      </article>`;
  }).join('\n');
}

export function loadBaseResumeTemplate(): string {
  if (cachedTemplate) return cachedTemplate;
  const path = join(process.cwd(), 'base_resume.html');
  cachedTemplate = readFileSync(path, 'utf8');
  return cachedTemplate;
}

function styleBlock(html: string): string {
  return html.match(/<style>[\s\S]*?<\/style>/i)?.[0] ?? '';
}

export function assertResumeUsesBaseTemplate(
  html: string,
  templateHtml = loadBaseResumeTemplate(),
): void {
  if (!html.trim()) throw new Error('Resume HTML is empty.');
  if (styleBlock(html) !== styleBlock(templateHtml)) {
    throw new Error('This resume does not use the supported base_resume.html template. Upload the PDF again from Profile.');
  }

  const headings = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)]
    .map((match) => match[1].replace(/<[^>]*>/g, '').trim().toUpperCase());
  const expected = ['SUMMARY', 'EXPERIENCE', 'PROJECTS', 'SKILLS', 'EDUCATION'];
  if (headings.join('|') !== expected.join('|')) {
    throw new Error('Resume section structure does not match base_resume.html. Upload the PDF again from Profile.');
  }

  for (const token of ['<!DOCTYPE html>', '<main class="page">', '<header>', '</main>', '</html>']) {
    if (!html.includes(token)) throw new Error(`Resume template is missing required structure: ${token}`);
  }
}

export function assertRenderedResume(
  html: string,
  data: ImportedResumeData,
  templateHtml = loadBaseResumeTemplate(),
): void {
  assertResumeUsesBaseTemplate(html, templateHtml);

  const checks: Array<[string, number, string]> = [
    ['EXPERIENCE', data.experience.length, 'article class="entry"'],
    ['PROJECTS', data.projects.length, 'article class="entry"'],
    ['SKILLS', data.skills.length, 'class="skill-line"'],
    ['EDUCATION', data.education.length, 'class="edu-row"'],
  ];
  for (const [heading, expected, marker] of checks) {
    const section = sectionInner(html, heading);
    const actual = section.split(marker).length - 1;
    if (actual !== expected) {
      throw new Error(`${heading} rendering mismatch: expected ${expected} entries, found ${actual}.`);
    }
  }
}

export function renderResumeTemplate(
  data: ImportedResumeData,
  templateHtml = loadBaseResumeTemplate(),
): string {
  let html = templateHtml;
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(data.name)} Resume</title>`);
  html = html.replace(
    /<header>[\s\S]*?<\/header>/i,
    `<header>
      <h1>${escapeHtml(data.name.toUpperCase())}</h1>
      <div class="contact">
${renderContact(data)}
      </div>
    </header>`,
  );
  html = replaceSectionInner(
    html,
    'SUMMARY',
    `      <p class="summary">${escapeHtml(data.summary)}</p>`,
  );
  html = replaceSectionInner(html, 'EXPERIENCE', renderExperience(data));
  html = replaceSectionInner(html, 'PROJECTS', renderProjects(data));
  html = replaceSectionInner(html, 'SKILLS', renderSkills(data));
  html = replaceSectionInner(html, 'EDUCATION', renderEducation(data));
  assertRenderedResume(html, data, templateHtml);
  return html;
}
