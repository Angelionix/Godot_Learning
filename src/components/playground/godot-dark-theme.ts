/**
 * Godot-inspired dark theme for Monaco Editor
 * Colors based on Godot 4.x script editor color scheme
 */

import type { editor } from 'monaco-editor';

export const godotDarkTheme: editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    // Keywords (extends, func, var, etc.) — Godot orange-red
    { token: 'keyword', foreground: 'ff7085' },
    { token: 'keyword.gdscript', foreground: 'ff7085' },

    // Built-in types — Godot green
    { token: 'type', foreground: '77e57a' },

    // Strings — Godot green-ish
    { token: 'string', foreground: 'a5e075' },
    { token: 'string.invalid', foreground: 'ff7085' },

    // Numbers — Godot yellow-orange
    { token: 'number', foreground: 'ffc799' },
    { token: 'number.float', foreground: 'ffc799' },
    { token: 'number.hex', foreground: 'ffc799' },
    { token: 'number.binary', foreground: 'ffc799' },

    // Comments — Godot dimmed
    { token: 'comment', foreground: '6a6a6a', fontStyle: 'italic' },

    // Operators
    { token: 'operator', foreground: 'aaaaaa' },

    // Delimiters
    { token: 'delimiter', foreground: 'aaaaaa' },

    // Identifiers
    { token: 'identifier', foreground: 'e0e0e0' },

    // Brackets
    { token: 'delimiter.bracket', foreground: 'aaaaaa' },

    // Annotations
    { token: 'keyword.gdscript', foreground: 'ff7085' },
  ],
  colors: {
    // Editor background — Godot dark
    'editor.background': '#1e1e2e',
    'editor.foreground': '#e0e0e0',

    // Cursor
    'editorCursor.foreground': '#ff7085',

    // Selection
    'editor.selectionBackground': '#ff708533',
    'editor.inactiveSelectionBackground': '#ff708520',

    // Line highlighting
    'editor.lineHighlightBackground': '#ffffff08',
    'editor.lineHighlightBorder': '#ffffff0f',

    // Line numbers
    'editorLineNumber.foreground': '#6a6a6a',
    'editorLineNumber.activeForeground': '#aaaaaa',

    // Minimap
    'minimap.background': '#1e1e2e',

    // Scrollbar
    'scrollbarSlider.background': '#ffffff15',
    'scrollbarSlider.hoverBackground': '#ffffff30',
    'scrollbarSlider.activeBackground': '#ffffff40',

    // Active indentation guides
    'editorIndentGuide.background': '#333344',
    'editorIndentGuide.activeBackground': '#555566',

    // Bracket matching
    'editorBracketMatch.background': '#ff708520',
    'editorBracketMatch.border': '#ff708580',

    // Find match
    'editor.findMatchBackground': '#ff708530',
    'editor.findMatchHighlightBackground': '#ff708520',

    // Gutters
    'editorGutter.background': '#1e1e2e',
    'editorGutter.modifiedBackground': '#77e57a40',
    'editorGutter.addedBackground': '#77e57a60',
    'editorGutter.deletedBackground': '#ff708560',

    // Widget
    'editorWidget.background': '#252535',
    'editorWidget.border': '#333344',
    'editorSuggestWidget.background': '#252535',
    'editorSuggestWidget.border': '#333344',
    'editorSuggestWidget.selectedBackground': '#ff708530',
    'editorSuggestWidget.highlightForeground': '#ff7085',

    // Peek view
    'peekViewEditor.background': '#1e1e2e',
    'peekViewResult.background': '#252535',

    // Input
    'input.background': '#252535',
    'input.border': '#333344',
    'input.foreground': '#e0e0e0',

    // Focus
    'focusBorder': '#ff708580',
  },
};
