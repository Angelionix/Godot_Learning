'use client';

import { createContext, useContext } from 'react';

interface ChapterContextValue {
  projectSlug?: string;
  chapterSlug?: string;
}

const ChapterContext = createContext<ChapterContextValue>({});

export function ChapterProvider({
  projectSlug,
  chapterSlug,
  children,
}: {
  projectSlug?: string;
  chapterSlug?: string;
  children: React.ReactNode;
}) {
  return (
    <ChapterContext.Provider value={{ projectSlug, chapterSlug }}>
      {children}
    </ChapterContext.Provider>
  );
}

export function useChapterContext() {
  return useContext(ChapterContext);
}
