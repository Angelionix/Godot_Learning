import { describe, it, expect } from 'vitest';
import { extractHeadingsFromContent } from '@/components/mdx/table-of-contents';

describe('extractHeadingsFromContent', () => {
  it('extracts h2 headings', () => {
    const content = '## 1.1 Концепция и видение\n\nSome text here';
    const headings = extractHeadingsFromContent(content);
    expect(headings.length).toBe(1);
    expect(headings[0].text).toBe('1.1 Концепция и видение');
    expect(headings[0].level).toBe(2);
  });

  it('extracts h3 headings', () => {
    const content = '### Таблица апгрейдов\n\nSome text here';
    const headings = extractHeadingsFromContent(content);
    expect(headings.length).toBe(1);
    expect(headings[0].text).toBe('Таблица апгрейдов');
    expect(headings[0].level).toBe(3);
  });

  it('extracts mixed h2 and h3 headings', () => {
    const content = `
## 1.1 Концепция

Some text

### Таблица апгрейдов

More text

## 1.2 Основной цикл

Even more text

### Подраздел

Details
`;
    const headings = extractHeadingsFromContent(content);
    expect(headings.length).toBe(4);
    expect(headings[0].text).toBe('1.1 Концепция');
    expect(headings[0].level).toBe(2);
    expect(headings[1].text).toBe('Таблица апгрейдов');
    expect(headings[1].level).toBe(3);
    expect(headings[2].text).toBe('1.2 Основной цикл');
    expect(headings[2].level).toBe(2);
    expect(headings[3].text).toBe('Подраздел');
    expect(headings[3].level).toBe(3);
  });

  it('generates correct IDs from Russian text', () => {
    const content = '## 1.1 Концепция и видение';
    const headings = extractHeadingsFromContent(content);
    expect(headings[0].id).toBe('11-концепция-и-видение');
  });

  it('handles empty content', () => {
    const headings = extractHeadingsFromContent('');
    expect(headings).toEqual([]);
  });

  it('ignores h1 headings', () => {
    const content = '# Main Title\n\n## Section';
    const headings = extractHeadingsFromContent(content);
    expect(headings.length).toBe(1);
    expect(headings[0].text).toBe('Section');
    expect(headings[0].level).toBe(2);
  });

  it('ignores h4+ headings', () => {
    const content = '## Section\n\n#### Deep heading';
    const headings = extractHeadingsFromContent(content);
    expect(headings.length).toBe(1);
    expect(headings[0].text).toBe('Section');
  });

  it('handles special characters in headings', () => {
    const content = '## Формула: cost(N) = base_cost × cost_multiplier^N';
    const headings = extractHeadingsFromContent(content);
    expect(headings.length).toBe(1);
    expect(headings[0].id).toBeTruthy();
    // ID should not contain special characters like (), =, ^
    expect(headings[0].id).not.toMatch(/[()=\^]/);
  });

  it('deduplicates dashes in IDs', () => {
    const content = '## Some   extra   spaces';
    const headings = extractHeadingsFromContent(content);
    expect(headings[0].id).not.toContain('---');
  });
});
