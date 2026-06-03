'use client';

import { TableOfContents } from '@/components/mdx/table-of-contents';
import type { TocHeading } from '@/components/mdx/table-of-contents';

interface TableOfContentsWrapperProps {
  headings: TocHeading[];
}

export function TableOfContentsWrapper({ headings }: TableOfContentsWrapperProps) {
  return <TableOfContents headings={headings} />;
}
