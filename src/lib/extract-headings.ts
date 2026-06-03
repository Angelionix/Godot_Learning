// Server-side utility: extract headings from MDX content for Table of Contents
// This file has NO 'use client' directive so it can be used in Server Components

export interface TocHeading {
  id: string;
  text: string;
  level: number; // 2 for h2, 3 for h3
}

export function extractHeadingsFromContent(content: string): TocHeading[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: TocHeading[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    // Generate an ID the same way MDX/rehype does: lowercase, replace spaces with hyphens, strip special chars
    const id = text
      .toLowerCase()
      .replace(/[^\w\sа-яёА-ЯЁ-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    headings.push({ id, text, level });
  }

  return headings;
}
