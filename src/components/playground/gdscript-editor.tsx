'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import Monaco — it's very heavy (~3MB)
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-[#1e1e2e] rounded-lg">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#ff7085] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-400">Загрузка редактора...</span>
      </div>
    </div>
  ),
});

import { gdscriptLanguageDef, getGDScriptCompletions, getGDScriptSnippets } from './gdscript-language';
import { godotDarkTheme } from './godot-dark-theme';

export interface GDScriptEditorProps {
  /** Initial code content */
  defaultValue?: string;
  /** Current code value (controlled) */
  value?: string;
  /** Called when code changes */
  onChange?: (value: string) => void;
  /** Read-only mode */
  readOnly?: boolean;
  /** Editor height */
  height?: string;
  /** Minimum height */
  minHeight?: string;
  /** Additional CSS class */
  className?: string;
}

// Track whether we've registered the language globally
let languageRegistered = false;

export default function GDScriptEditor({
  defaultValue = '',
  value,
  onChange,
  readOnly = false,
  height = '400px',
  minHeight,
  className = '',
}: GDScriptEditorProps) {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  const handleEditorMount = useCallback((editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Register GDScript language (only once)
    if (!languageRegistered) {
      // Register language
      monaco.languages.register({ id: 'gdscript' });

      // Set Monarch tokenizer
      monaco.languages.setMonarchTokensProvider('gdscript', gdscriptLanguageDef);

      // Register theme
      monaco.editor.defineTheme('godot-dark', godotDarkTheme);

      // Auto-completion
      monaco.languages.registerCompletionItemProvider('gdscript', {
        triggerCharacters: ['.', '$', '@', '"', "'"],
        provideCompletionItems: (model: any, position: any) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };

          const completions = [
            ...getGDScriptCompletions(),
            ...getGDScriptSnippets(),
          ].map((item) => ({
            ...item,
            range,
          }));

          return { suggestions: completions };
        },
      });

      // Configuration (brackets, comments, etc.)
      monaco.languages.setLanguageConfiguration('gdscript', {
        comments: {
          lineComment: '#',
          blockComment: undefined, // GDScript has no block comments
        },
        brackets: [
          ['(', ')'],
          ['[', ']'],
          ['{', '}'],
        ],
        autoClosingPairs: [
          { open: '(', close: ')' },
          { open: '[', close: ']' },
          { open: '{', close: '}' },
          { open: '"', close: '"', notIn: ['string'] },
          { open: "'", close: "'", notIn: ['string'] },
        ],
        surroundingPairs: [
          { open: '(', close: ')' },
          { open: '[', close: ']' },
          { open: '{', close: '}' },
          { open: '"', close: '"' },
          { open: "'", close: "'" },
        ],
        indentationRules: {
          increaseIndentPattern: /^\s*(func|if|elif|else|for|while|match|class|enum)\b.*:$/,
          decreaseIndentPattern: /^\s*(elif|else)\b.*:|^\s*$/,
        },
        folding: {
          markers: {
            start: /^\s*#region\b/,
            end: /^\s*#endregion\b/,
          },
        },
      });

      languageRegistered = true;
    }

    // Set theme
    monaco.editor.setTheme('godot-dark');

    // Editor settings
    editor.updateOptions({
      fontSize: 14,
      fontFamily: "'Sarasa Mono SC', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
      fontLigatures: true,
      lineHeight: 22,
      tabSize: 4,
      insertSpaces: false,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      renderWhitespace: 'selection',
      bracketPairColorization: { enabled: true },
      guides: {
        bracketPairs: true,
        indentation: true,
      },
      padding: { top: 12, bottom: 12 },
      smoothScrolling: true,
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      renderLineHighlight: 'gutter',
      readOnly,
    });
  }, [readOnly]);

  const handleChange = useCallback(
    (newValue: string | undefined) => {
      onChange?.(newValue ?? '');
    },
    [onChange]
  );

  return (
    <div
      className={`rounded-lg overflow-hidden border border-gray-700 ${className}`}
      style={minHeight ? { minHeight } : undefined}
    >
      <MonacoEditor
        height={height}
        language="gdscript"
        defaultValue={defaultValue}
        value={value}
        onChange={handleChange}
        onMount={handleEditorMount}
        theme="godot-dark"
        loading={
          <div className="flex items-center justify-center h-full bg-[#1e1e2e]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-[#ff7085] border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-400">Загрузка редактора...</span>
            </div>
          </div>
        }
        options={{
          readOnly,
        }}
      />
    </div>
  );
}
