import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OutputConsole from '@/components/playground/output-console';
import ChallengeResults from '@/components/playground/challenge-results';
import type { InterpreterResult, ChallengeValidation } from '@/lib/gdscript-interpreter';

// ─── OutputConsole ────────────────────────────────────────────────────────────

describe('OutputConsole', () => {
  // ── Idle state ──────────────────────────────────────────────────────────────

  it('renders "Нажмите ▶ Запуск" when no result and not running', () => {
    render(<OutputConsole result={null} isRunning={false} />);
    expect(screen.getByText(/Нажмите ▶ Запуск/)).toBeInTheDocument();
  });

  // ── Loading state ───────────────────────────────────────────────────────────

  it('shows loading indicator when isRunning', () => {
    render(<OutputConsole result={null} isRunning={true} />);
    expect(screen.getByText('Выполнение...')).toBeInTheDocument();
  });

  it('does not show idle message when running', () => {
    render(<OutputConsole result={null} isRunning={true} />);
    expect(screen.queryByText(/Нажмите ▶ Запуск/)).not.toBeInTheDocument();
  });

  // ── Output lines ────────────────────────────────────────────────────────────

  it('displays output lines in green', () => {
    const result: InterpreterResult = {
      success: true,
      output: ['Hello', 'World'],
      errors: [],
      duration: 10,
    };
    const { container } = render(<OutputConsole result={result} isRunning={false} />);

    const outputElements = container.querySelectorAll('.text-green-400');
    expect(outputElements).toHaveLength(2);
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('World')).toBeInTheDocument();
  });

  it('displays single output line', () => {
    const result: InterpreterResult = {
      success: true,
      output: ['Test output'],
      errors: [],
      duration: 5,
    };
    render(<OutputConsole result={result} isRunning={false} />);
    expect(screen.getByText('Test output')).toBeInTheDocument();
  });

  // ── Errors ──────────────────────────────────────────────────────────────────

  it('displays errors in red', () => {
    const result: InterpreterResult = {
      success: false,
      output: [],
      errors: ['SyntaxError: Unexpected token'],
      duration: 2,
    };
    const { container } = render(<OutputConsole result={result} isRunning={false} />);

    const errorElements = container.querySelectorAll('.text-red-400');
    expect(errorElements.length).toBeGreaterThan(0);
    expect(screen.getByText('SyntaxError: Unexpected token')).toBeInTheDocument();
  });

  it('displays multiple errors', () => {
    const result: InterpreterResult = {
      success: false,
      output: [],
      errors: ['Error 1', 'Error 2'],
      duration: 3,
    };
    render(<OutputConsole result={result} isRunning={false} />);
    expect(screen.getByText('Error 1')).toBeInTheDocument();
    expect(screen.getByText('Error 2')).toBeInTheDocument();
  });

  // ── Execution time ──────────────────────────────────────────────────────────

  it('shows execution time when result exists', () => {
    const result: InterpreterResult = {
      success: true,
      output: ['done'],
      errors: [],
      duration: 42,
    };
    render(<OutputConsole result={result} isRunning={false} />);
    expect(screen.getByText(/42 мс/)).toBeInTheDocument();
  });

  it('does not show execution time when no result', () => {
    render(<OutputConsole result={null} isRunning={false} />);
    expect(screen.queryByText(/мс/)).not.toBeInTheDocument();
  });

  // ── Success indicator ───────────────────────────────────────────────────────

  it('shows success indicator when result.success and output.length > 0', () => {
    const result: InterpreterResult = {
      success: true,
      output: ['Hello'],
      errors: [],
      duration: 5,
    };
    render(<OutputConsole result={result} isRunning={false} />);
    expect(screen.getByText('Выполнено успешно')).toBeInTheDocument();
  });

  it('does not show success indicator when success but no output', () => {
    const result: InterpreterResult = {
      success: true,
      output: [],
      errors: [],
      duration: 1,
    };
    render(<OutputConsole result={result} isRunning={false} />);
    expect(screen.queryByText('Выполнено успешно')).not.toBeInTheDocument();
  });

  it('does not show success indicator when not successful', () => {
    const result: InterpreterResult = {
      success: false,
      output: ['Hello'],
      errors: ['some error'],
      duration: 1,
    };
    render(<OutputConsole result={result} isRunning={false} />);
    expect(screen.queryByText('Выполнено успешно')).not.toBeInTheDocument();
  });

  // ── No output message ───────────────────────────────────────────────────────

  it('shows "no output" message when executed but no output and no errors', () => {
    const result: InterpreterResult = {
      success: true,
      output: [],
      errors: [],
      duration: 1,
    };
    render(<OutputConsole result={result} isRunning={false} />);
    expect(screen.getByText(/Используйте print\(\)/)).toBeInTheDocument();
  });

  it('does not show "no output" message when there are errors', () => {
    const result: InterpreterResult = {
      success: false,
      output: [],
      errors: ['Error'],
      duration: 1,
    };
    render(<OutputConsole result={result} isRunning={false} />);
    expect(screen.queryByText(/Используйте print\(\)/)).not.toBeInTheDocument();
  });

  // ── Header ──────────────────────────────────────────────────────────────────

  it('renders header with "Вывод" label', () => {
    render(<OutputConsole result={null} isRunning={false} />);
    expect(screen.getByText('Вывод')).toBeInTheDocument();
  });
});

// ─── ChallengeResults ─────────────────────────────────────────────────────────

describe('ChallengeResults', () => {
  // ── Null validation ─────────────────────────────────────────────────────────

  it('renders null when validation is null', () => {
    const { container } = render(<ChallengeResults validation={null} />);
    expect(container.innerHTML).toBe('');
  });

  // ── Passed state ────────────────────────────────────────────────────────────

  it('shows passed state with checkmark', () => {
    const validation: ChallengeValidation = {
      passed: true,
      totalTests: 2,
      passedTests: 2,
      results: [
        { test: { description: 'Test 1', type: 'pattern', pattern: 'x' }, passed: true, message: 'ok' },
        { test: { description: 'Test 2', type: 'pattern', pattern: 'y' }, passed: true, message: 'ok' },
      ],
    };
    render(<ChallengeResults validation={validation} />);
    expect(screen.getByText('Все тесты пройдены!')).toBeInTheDocument();
  });

  it('displays test descriptions when passed', () => {
    const validation: ChallengeValidation = {
      passed: true,
      totalTests: 1,
      passedTests: 1,
      results: [
        { test: { description: 'Has speed variable', type: 'pattern', pattern: 'speed' }, passed: true, message: 'ok' },
      ],
    };
    render(<ChallengeResults validation={validation} />);
    expect(screen.getByText('Has speed variable')).toBeInTheDocument();
  });

  // ── Failed state ────────────────────────────────────────────────────────────

  it('shows failed state with X and test count', () => {
    const validation: ChallengeValidation = {
      passed: false,
      totalTests: 3,
      passedTests: 1,
      results: [
        { test: { description: 'Test 1', type: 'pattern', pattern: 'a' }, passed: true, message: 'ok' },
        { test: { description: 'Test 2', type: 'pattern', pattern: 'b' }, passed: false, message: 'not found' },
        { test: { description: 'Test 3', type: 'pattern', pattern: 'c' }, passed: false, message: 'not found' },
      ],
    };
    render(<ChallengeResults validation={validation} />);
    expect(screen.getByText('1/3 тестов пройдено')).toBeInTheDocument();
  });

  it('shows error message for failed tests', () => {
    const validation: ChallengeValidation = {
      passed: false,
      totalTests: 1,
      passedTests: 0,
      results: [
        { test: { description: 'Check pattern', type: 'pattern', pattern: 'missing' }, passed: false, message: 'Шаблон не найден' },
      ],
    };
    render(<ChallengeResults validation={validation} />);
    expect(screen.getByText('Шаблон не найден')).toBeInTheDocument();
  });

  // ── Expand/collapse ─────────────────────────────────────────────────────────

  it('expands/collapses on click', () => {
    const validation: ChallengeValidation = {
      passed: true,
      totalTests: 1,
      passedTests: 1,
      results: [
        { test: { description: 'Test A', type: 'pattern', pattern: 'x' }, passed: true, message: 'ok' },
      ],
    };
    render(<ChallengeResults validation={validation} />);

    // Initially expanded — test description should be visible
    expect(screen.getByText('Test A')).toBeInTheDocument();

    // Click to collapse
    fireEvent.click(screen.getByText('Все тесты пройдены!'));
    expect(screen.queryByText('Test A')).not.toBeInTheDocument();

    // Click to expand again
    fireEvent.click(screen.getByText('Все тесты пройдены!'));
    expect(screen.getByText('Test A')).toBeInTheDocument();
  });

  // ── XP display ──────────────────────────────────────────────────────────────

  it('shows XP when passed and xpAwarded is provided', () => {
    const validation: ChallengeValidation = {
      passed: true,
      totalTests: 1,
      passedTests: 1,
      results: [
        { test: { description: 'Test', type: 'pattern', pattern: 'x' }, passed: true, message: 'ok' },
      ],
    };
    render(<ChallengeResults validation={validation} xpAwarded={50} />);
    expect(screen.getByText('+50 XP')).toBeInTheDocument();
  });

  it('does not show XP when validation failed', () => {
    const validation: ChallengeValidation = {
      passed: false,
      totalTests: 1,
      passedTests: 0,
      results: [
        { test: { description: 'Test', type: 'pattern', pattern: 'x' }, passed: false, message: 'fail' },
      ],
    };
    render(<ChallengeResults validation={validation} xpAwarded={50} />);
    expect(screen.queryByText(/\+50 XP/)).not.toBeInTheDocument();
  });

  it('does not show XP when xpAwarded is 0', () => {
    const validation: ChallengeValidation = {
      passed: true,
      totalTests: 1,
      passedTests: 1,
      results: [
        { test: { description: 'Test', type: 'pattern', pattern: 'x' }, passed: true, message: 'ok' },
      ],
    };
    render(<ChallengeResults validation={validation} xpAwarded={0} />);
    expect(screen.queryByText(/XP/)).not.toBeInTheDocument();
  });

  it('does not show XP when xpAwarded is undefined', () => {
    const validation: ChallengeValidation = {
      passed: true,
      totalTests: 1,
      passedTests: 1,
      results: [
        { test: { description: 'Test', type: 'pattern', pattern: 'x' }, passed: true, message: 'ok' },
      ],
    };
    render(<ChallengeResults validation={validation} />);
    expect(screen.queryByText(/XP/)).not.toBeInTheDocument();
  });
});
