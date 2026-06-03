import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Callout } from '@/components/mdx/callout';
import { Insight } from '@/components/mdx/insight';
import { GoalsList, GoalItem } from '@/components/mdx/goals-list';
import { Challenge } from '@/components/mdx/challenge';
import { CollapsibleHint } from '@/components/mdx/collapsible-hint';

// ── Callout ────────────────────────────────────────────────────────────────

describe('Callout', () => {
  it('renders info callout with default type', () => {
    render(<Callout>Информационное сообщение</Callout>);

    expect(screen.getByText('ℹ️')).toBeInTheDocument();
    expect(screen.getByText('Информационное сообщение')).toBeInTheDocument();
  });

  it('renders warning callout', () => {
    render(<Callout type="warning">Предупреждение</Callout>);

    expect(screen.getByText('⚠️')).toBeInTheDocument();
    expect(screen.getByText('Предупреждение')).toBeInTheDocument();
  });

  it('renders danger callout', () => {
    render(<Callout type="danger">Опасность!</Callout>);

    expect(screen.getByText('🚫')).toBeInTheDocument();
    expect(screen.getByText('Опасность!')).toBeInTheDocument();
  });

  it('renders tip callout', () => {
    render(<Callout type="tip">Полезный совет</Callout>);

    expect(screen.getByText('✅')).toBeInTheDocument();
    expect(screen.getByText('Полезный совет')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(<Callout type="info" title="Заголовок">Текст</Callout>);

    expect(screen.getByText('Заголовок')).toBeInTheDocument();
  });

  it('does not render title element when not provided', () => {
    const { container } = render(<Callout type="info">Текст</Callout>);

    // The title span should only contain the icon when no title is given
    const titleSpans = container.querySelectorAll('.font-semibold span');
    const hasTextOnlyTitle = Array.from(titleSpans).some(
      (el) => el.textContent === 'ℹ️'
    );
    expect(hasTextOnlyTitle).toBe(true);
  });

  it('applies different CSS classes for different types', () => {
    const { container: infoContainer } = render(<Callout type="info">Info</Callout>);
    const { container: warningContainer } = render(<Callout type="warning">Warning</Callout>);

    const infoDiv = infoContainer.firstChild as HTMLElement;
    const warningDiv = warningContainer.firstChild as HTMLElement;

    expect(infoDiv.className).not.toBe(warningDiv.className);
  });

  it('applies custom className', () => {
    const { container } = render(<Callout className="test-class">Текст</Callout>);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain('test-class');
  });
});

// ── Insight ────────────────────────────────────────────────────────────────

describe('Insight', () => {
  it('renders with title and content', () => {
    render(<Insight title="Ключевое понимание">Это важная мысль</Insight>);

    expect(screen.getByText('💡')).toBeInTheDocument();
    expect(screen.getByText('Ключевое понимание')).toBeInTheDocument();
    expect(screen.getByText('Это важная мысль')).toBeInTheDocument();
  });

  it('always renders lightbulb emoji', () => {
    render(<Insight title="Test">Content</Insight>);

    expect(screen.getByText('💡')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <Insight title="Test" className="custom-insight">Content</Insight>
    );
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain('custom-insight');
  });
});

// ── GoalsList / GoalItem ──────────────────────────────────────────────────

describe('GoalsList', () => {
  it('renders children content', () => {
    render(
      <GoalsList>
        <ol><li>Цель 1</li><li>Цель 2</li></ol>
      </GoalsList>
    );

    expect(screen.getByText('Цель 1')).toBeInTheDocument();
    expect(screen.getByText('Цель 2')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<GoalsList className="test-goal">Content</GoalsList>);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain('test-goal');
  });
});

describe('GoalItem', () => {
  it('renders children with check icon', () => {
    render(<GoalItem>Научиться основам GDScript</GoalItem>);

    expect(screen.getByText('Научиться основам GDScript')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<GoalItem className="test-item">Goal</GoalItem>);
    const li = container.firstChild as HTMLElement;
    expect(li.className).toContain('test-item');
  });
});

// ── Challenge ─────────────────────────────────────────────────────────────

describe('Challenge', () => {
  it('renders with default difficulty', () => {
    render(<Challenge>Текст вызова</Challenge>);

    // "🎯 Микровызов" appears twice (header + default config label), use getAllByText
    const microwaves = screen.getAllByText('🎯 Микровызов');
    expect(microwaves.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Текст вызова')).toBeInTheDocument();
  });

  it('renders with green difficulty', () => {
    render(<Challenge difficulty="green">Базовый вызов</Challenge>);

    expect(screen.getByText('🟢 Базовый')).toBeInTheDocument();
  });

  it('renders with yellow difficulty', () => {
    render(<Challenge difficulty="yellow">Продвинутый вызов</Challenge>);

    expect(screen.getByText('🟡 Продвинутый')).toBeInTheDocument();
  });

  it('renders with red difficulty', () => {
    render(<Challenge difficulty="red">Экспертный вызов</Challenge>);

    expect(screen.getByText('🔴 Экспертный')).toBeInTheDocument();
  });

  it('supports easy/medium/hard aliases', () => {
    const { rerender } = render(<Challenge difficulty="easy">Test</Challenge>);
    expect(screen.getByText('🟢 Базовый')).toBeInTheDocument();

    rerender(<Challenge difficulty="medium">Test</Challenge>);
    expect(screen.getByText('🟡 Продвинутый')).toBeInTheDocument();

    rerender(<Challenge difficulty="hard">Test</Challenge>);
    expect(screen.getByText('🔴 Экспертный')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(<Challenge title="Критический удар">Вызов</Challenge>);

    expect(screen.getByText(/Критический удар/)).toBeInTheDocument();
  });

  it('toggles expand/collapse on button click', () => {
    render(<Challenge>Длинный текст вызова</Challenge>);

    const button = screen.getByText('Развернуть ▼');
    expect(button).toBeInTheDocument();

    fireEvent.click(button);

    expect(screen.getByText('Свернуть ▲')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Challenge className="test-challenge">Test</Challenge>);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain('test-challenge');
  });
});

// ── CollapsibleHint ───────────────────────────────────────────────────────

describe('CollapsibleHint', () => {
  it('renders hint button with default XP penalty', () => {
    render(<CollapsibleHint>Подсказка текст</CollapsibleHint>);

    expect(screen.getByText('Подсказка')).toBeInTheDocument();
    expect(screen.getByText('(-5 XP)')).toBeInTheDocument();
  });

  it('renders custom XP penalty', () => {
    render(<CollapsibleHint xpPenalty={10}>Подсказка</CollapsibleHint>);

    expect(screen.getByText('(-10 XP)')).toBeInTheDocument();
  });

  it('does not show XP penalty when xpPenalty is 0', () => {
    render(<CollapsibleHint xpPenalty={0}>Подсказка</CollapsibleHint>);

    expect(screen.queryByText(/XP/)).not.toBeInTheDocument();
  });

  it('shows collapsed state by default (▶️ icon)', () => {
    render(<CollapsibleHint>Секретная подсказка</CollapsibleHint>);

    expect(screen.getByText('▶️')).toBeInTheDocument();
    expect(screen.queryByText('Секретная подсказка')).not.toBeInTheDocument();
  });

  it('expands on click and shows content', () => {
    render(<CollapsibleHint>Секретная подсказка</CollapsibleHint>);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByText('🔽')).toBeInTheDocument();
    expect(screen.getByText('Секретная подсказка')).toBeInTheDocument();
  });

  it('collapses on second click', () => {
    render(<CollapsibleHint>Секретная подсказка</CollapsibleHint>);

    const button = screen.getByRole('button');

    // Open
    fireEvent.click(button);
    expect(screen.getByText('Секретная подсказка')).toBeInTheDocument();

    // Close
    fireEvent.click(button);
    expect(screen.queryByText('Секретная подсказка')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <CollapsibleHint className="test-hint">Hint</CollapsibleHint>
    );
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain('test-hint');
  });
});
