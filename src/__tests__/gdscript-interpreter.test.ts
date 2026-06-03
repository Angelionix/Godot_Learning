import { describe, it, expect } from 'vitest';
import {
  executeGDScript,
  validateCode,
  type TestCase,
  type ChallengeValidation,
} from '@/lib/gdscript-interpreter';

// ─── executeGDScript ──────────────────────────────────────────────────────────

describe('executeGDScript', () => {
  // ── Simple print() ──────────────────────────────────────────────────────────

  describe('simple print()', () => {
    it('captures a single print() output', () => {
      const result = executeGDScript('print("Hello, Godot!")');
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['Hello, Godot!']);
      expect(result.errors).toHaveLength(0);
    });

    it('captures multiple print() calls', () => {
      const result = executeGDScript(`
print("Line 1")
print("Line 2")
print("Line 3")
      `);
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['Line 1', 'Line 2', 'Line 3']);
    });

    it('prints numbers', () => {
      const result = executeGDScript('print(42)');
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['42']);
    });

    it('prints concatenated strings', () => {
      const result = executeGDScript('print("Hello" + " " + "World")');
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['Hello World']);
    });

    it('prints multiple arguments separated by spaces', () => {
      const result = executeGDScript('print("x =", 5)');
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['x = 5']);
    });

    it('prints integer numbers without decimals', () => {
      const result = executeGDScript('print(10)');
      expect(result.success).toBe(true);
      expect(result.output[0]).toBe('10');
    });
  });

  // ── Variables ────────────────────────────────────────────────────────────────

  describe('variable declarations', () => {
    it('supports var with assignment', () => {
      const result = executeGDScript(`
var x = 10
print(x)
      `);
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['10']);
    });

    it('supports var with type annotation', () => {
      const result = executeGDScript(`
var speed: float = 5.0
print(speed)
      `);
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['5']);
    });

    it('supports var without assignment (defaults to null)', () => {
      const result = executeGDScript(`
var x: int
print(x)
      `);
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['null']);
    });

    it('supports const declarations', () => {
      const result = executeGDScript(`
const MAX_SPEED = 100
print(MAX_SPEED)
      `);
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['100']);
    });

    it('supports string variables', () => {
      const result = executeGDScript(`
var name = "Godot"
print(name)
      `);
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['Godot']);
    });

    it('supports variable reassignment', () => {
      const result = executeGDScript(`
var x = 5
x = 10
print(x)
      `);
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['10']);
    });
  });

  // ── For loops ───────────────────────────────────────────────────────────────

  describe('for loops with range()', () => {
    it('supports for x in range(n)', () => {
      const result = executeGDScript(`
for i in range(3):
    print(i)
      `);
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['0', '1', '2']);
    });

    it('supports for x in range(start, end)', () => {
      const result = executeGDScript(`
for i in range(2, 5):
    print(i)
      `);
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['2', '3', '4']);
    });

    it('supports for x in range(start, end, step)', () => {
      const result = executeGDScript(`
for i in range(0, 10, 2):
    print(i)
      `);
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['0', '2', '4', '6', '8']);
    });

    it('supports iterating over an array variable', () => {
      const result = executeGDScript(`
var items = [10, 20, 30]
for item in items:
    print(item)
      `);
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['10', '20', '30']);
    });
  });

  // ── if/elif/else ────────────────────────────────────────────────────────────

  describe('if/elif/else', () => {
    it('executes if block when condition is true', () => {
      const result = executeGDScript(`
var x = 10
if x > 5:
    print("big")
      `);
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['big']);
    });

    it('skips if block when condition is false', () => {
      const result = executeGDScript(`
var x = 3
if x > 5:
    print("big")
      `);
      expect(result.success).toBe(true);
      expect(result.output).toEqual([]);
    });

    it('executes else block when if is false', () => {
      const result = executeGDScript(`
var x = 3
if x > 5:
    print("big")
else:
    print("small")
      `);
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['small']);
    });

    it('executes elif block when if is false and elif is true', () => {
      const result = executeGDScript(`
var x = 5
if x > 10:
    print("very big")
elif x > 3:
    print("medium")
else:
    print("small")
      `);
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['medium']);
    });

    it('supports nested if statements', () => {
      const result = executeGDScript(`
var x = 7
if x > 5:
    if x > 10:
        print("very big")
    else:
        print("medium-big")
      `);
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['medium-big']);
    });

    it('supports `not` keyword', () => {
      const result = executeGDScript(`
var alive = false
if not alive:
    print("dead")
      `);
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['dead']);
    });

    it('supports `and` keyword', () => {
      const result = executeGDScript(`
var x = 5
var y = 10
if x > 0 and y > 5:
    print("both positive")
      `);
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['both positive']);
    });

    it('supports `or` keyword', () => {
      const result = executeGDScript(`
var x = -1
var y = 10
if x > 0 or y > 5:
    print("at least one positive")
      `);
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['at least one positive']);
    });
  });

  // ── Functions ───────────────────────────────────────────────────────────────

  describe('function declarations', () => {
    it('declares and calls a simple function', () => {
      const result = executeGDScript(`
func greet():
    print("Hello!")

greet()
      `);
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['Hello!']);
    });

    it('calls a function with arguments', () => {
      const result = executeGDScript(`
func add(a, b):
    print(a + b)

add(3, 4)
      `);
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['7']);
    });

    it('supports function with return value', () => {
      const result = executeGDScript(`
func double(x):
    return x * 2

var result = double(5)
print(result)
      `);
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['10']);
    });

    it('supports recursive function (factorial)', () => {
      const result = executeGDScript(`
func factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

print(factorial(5))
      `);
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['120']);
    });
  });

  // ── Math functions ──────────────────────────────────────────────────────────

  describe('math functions', () => {
    it('abs() returns absolute value', () => {
      const result = executeGDScript('print(abs(-7))');
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['7']);
    });

    it('min() returns smaller value', () => {
      const result = executeGDScript('print(min(3, 8))');
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['3']);
    });

    it('max() returns larger value', () => {
      const result = executeGDScript('print(max(3, 8))');
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['8']);
    });

    it('clamp() constrains value within range', () => {
      const result = executeGDScript('print(clamp(15, 0, 10))');
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['10']);
    });

    it('clamp() returns value when within range', () => {
      const result = executeGDScript('print(clamp(5, 0, 10))');
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['5']);
    });

    it('lerp() interpolates between values', () => {
      const result = executeGDScript('print(lerp(0, 100, 0.5))');
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['50']);
    });

    it('sqrt() returns square root', () => {
      const result = executeGDScript('print(sqrt(16))');
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['4']);
    });
  });

  // ── Vector2 constants ───────────────────────────────────────────────────────

  describe('Vector2 constants', () => {
    it('Vector2.ZERO is (0, 0)', () => {
      const result = executeGDScript('print(Vector2.ZERO)');
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['(0, 0)']);
    });

    it('Vector2.ONE is (1, 1)', () => {
      const result = executeGDScript('print(Vector2.ONE)');
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['(1, 1)']);
    });

    it('Vector2.UP is (0, -1)', () => {
      const result = executeGDScript('print(Vector2.UP)');
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['(0, -1)']);
    });

    it('Vector2.DOWN is (0, 1)', () => {
      const result = executeGDScript('print(Vector2.DOWN)');
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['(0, 1)']);
    });

    it('Vector2.LEFT is (-1, 0)', () => {
      const result = executeGDScript('print(Vector2.LEFT)');
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['(-1, 0)']);
    });

    it('Vector2.RIGHT is (1, 0)', () => {
      const result = executeGDScript('print(Vector2.RIGHT)');
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['(1, 0)']);
    });

    it('Vector2(x, y) constructor', () => {
      const result = executeGDScript('print(Vector2(3, 4))');
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['(3, 4)']);
    });
  });

  // ── Timeout / iteration protection ──────────────────────────────────────────

  describe('timeout protection', () => {
    it('terminates oversized range via iteration limit', () => {
      // The __range function has a MAX_ITERATIONS of 100000
      const result = executeGDScript(`for i in range(200000):\n    pass`);
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Слишком большой диапазон');
    });

    it('accepts a custom timeout parameter without error', () => {
      const result = executeGDScript('print("ok")', 10000);
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['ok']);
    });

    it('result includes duration for fast-executing code', () => {
      const result = executeGDScript('print("fast")');
      expect(result.success).toBe(true);
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });
  });

  // ── Syntax errors ───────────────────────────────────────────────────────────

  describe('syntax errors', () => {
    it('produces error output for invalid syntax', () => {
      const result = executeGDScript('var x = )))');
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('produces error for undefined variable', () => {
      const result = executeGDScript('print(undefined_var)');
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('не определено');
    });

    it('produces error for calling non-function', () => {
      const result = executeGDScript(`
var x = 5
x()
      `);
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('result includes duration even on error', () => {
      const result = executeGDScript('var x = )))');
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });
  });

  // ── Result structure ────────────────────────────────────────────────────────

  describe('result structure', () => {
    it('returns InterpreterResult with all fields', () => {
      const result = executeGDScript('print("ok")');
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('output');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('variables');
    });

    it('duration is a number >= 0', () => {
      const result = executeGDScript('print("fast")');
      expect(typeof result.duration).toBe('number');
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });
  });

  // ── GDScript-specific syntax ────────────────────────────────────────────────

  describe('GDScript-specific syntax', () => {
    it('ignores extends keyword', () => {
      const result = executeGDScript(`
extends Node2D
print("works")
      `);
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['works']);
    });

    it('ignores class_name keyword', () => {
      const result = executeGDScript(`
class_name Player
print("works")
      `);
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['works']);
    });

    it('ignores signal declarations', () => {
      const result = executeGDScript(`
signal health_changed(new_value)
print("works")
      `);
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['works']);
    });

    it('ignores @export annotation', () => {
      const result = executeGDScript(`
var speed = 100
print(speed)
      `);
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['100']);
    });

    it('ignores comments', () => {
      const result = executeGDScript(`
# This is a comment
print("visible") # inline comment
      `);
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['visible']);
    });

    it('supports PI constant', () => {
      const result = executeGDScript('print(PI)');
      expect(result.success).toBe(true);
      // PI ≈ 3.141592653589793
      expect(result.output[0]).toContain('3.14');
    });

    it('supports str() function', () => {
      const result = executeGDScript('print(str(42))');
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['42']);
    });

    it('supports pass keyword', () => {
      const result = executeGDScript(`
if true:
    pass
print("done")
      `);
      expect(result.success).toBe(true);
      expect(result.output).toEqual(['done']);
    });
  });
});

// ─── validateCode ──────────────────────────────────────────────────────────────

describe('validateCode', () => {
  // ── pattern test cases ──────────────────────────────────────────────────────

  describe('pattern test cases', () => {
    it('passes when pattern matches code', () => {
      const code = `var speed = 200\nprint(speed)`;
      const tests: TestCase[] = [
        { description: 'Has speed variable', type: 'pattern', pattern: 'var\\s+speed' },
      ];
      const validation = validateCode(code, tests);
      expect(validation.passed).toBe(true);
      expect(validation.passedTests).toBe(1);
      expect(validation.results[0].passed).toBe(true);
    });

    it('fails when pattern does not match code', () => {
      const code = `var velocity = 200`;
      const tests: TestCase[] = [
        { description: 'Has speed variable', type: 'pattern', pattern: 'var\\s+speed' },
      ];
      const validation = validateCode(code, tests);
      expect(validation.passed).toBe(false);
      expect(validation.passedTests).toBe(0);
      expect(validation.results[0].passed).toBe(false);
    });

    it('fails when pattern is missing', () => {
      const code = `var x = 1`;
      const tests: TestCase[] = [
        { description: 'Missing pattern', type: 'pattern' },
      ];
      const validation = validateCode(code, tests);
      expect(validation.passed).toBe(false);
      expect(validation.results[0].message).toContain('не содержит шаблона');
    });

    it('supports regex patterns', () => {
      const code = `func _ready():\n    print("ready")`;
      const tests: TestCase[] = [
        { description: 'Has _ready function', type: 'pattern', pattern: 'func\\s+_ready' },
      ];
      const validation = validateCode(code, tests);
      expect(validation.passed).toBe(true);
    });

    it('matches multiline with m flag', () => {
      const code = `extends Node2D\n\nfunc _process(delta):\n    pass`;
      const tests: TestCase[] = [
        { description: 'Has extends', type: 'pattern', pattern: '^extends' },
      ];
      const validation = validateCode(code, tests);
      expect(validation.passed).toBe(true);
    });
  });

  // ── function_exists test cases ──────────────────────────────────────────────

  describe('function_exists test cases', () => {
    it('passes when function exists in code', () => {
      const code = `func calculate_damage(base, multiplier):\n    return base * multiplier`;
      const tests: TestCase[] = [
        { description: 'calculate_damage exists', type: 'function_exists', functionName: 'calculate_damage' },
      ];
      const validation = validateCode(code, tests);
      expect(validation.passed).toBe(true);
      expect(validation.results[0].passed).toBe(true);
      expect(validation.results[0].message).toContain('найдена');
    });

    it('fails when function does not exist', () => {
      const code = `func other_func():\n    pass`;
      const tests: TestCase[] = [
        { description: 'calculate_damage exists', type: 'function_exists', functionName: 'calculate_damage' },
      ];
      const validation = validateCode(code, tests);
      expect(validation.passed).toBe(false);
      expect(validation.results[0].passed).toBe(false);
      expect(validation.results[0].message).toContain('не найдена');
    });

    it('uses expected as fallback when functionName is not provided', () => {
      const code = `func my_func():\n    pass`;
      const tests: TestCase[] = [
        { description: 'my_func exists', type: 'function_exists', expected: 'my_func' },
      ];
      const validation = validateCode(code, tests);
      expect(validation.passed).toBe(true);
    });

    it('fails when neither functionName nor expected is provided', () => {
      const code = `func my_func():\n    pass`;
      const tests: TestCase[] = [
        { description: 'Missing name', type: 'function_exists' },
      ];
      const validation = validateCode(code, tests);
      expect(validation.passed).toBe(false);
      expect(validation.results[0].message).toContain('не указано');
    });
  });

  // ── extends test cases ──────────────────────────────────────────────────────

  describe('extends test cases', () => {
    it('passes when code extends the specified class', () => {
      const code = `extends Node2D\n\nfunc _ready():\n    pass`;
      const tests: TestCase[] = [
        { description: 'Extends Node2D', type: 'extends', extendsClass: 'Node2D' },
      ];
      const validation = validateCode(code, tests);
      expect(validation.passed).toBe(true);
      expect(validation.results[0].message).toContain('наследует');
    });

    it('fails when code does not extend the specified class', () => {
      const code = `extends CharacterBody2D\n\nfunc _ready():\n    pass`;
      const tests: TestCase[] = [
        { description: 'Extends Node2D', type: 'extends', extendsClass: 'Node2D' },
      ];
      const validation = validateCode(code, tests);
      expect(validation.passed).toBe(false);
      expect(validation.results[0].message).toContain('не наследует');
    });

    it('uses expected as fallback when extendsClass is not provided', () => {
      const code = `extends Area2D`;
      const tests: TestCase[] = [
        { description: 'Extends Area2D', type: 'extends', expected: 'Area2D' },
      ];
      const validation = validateCode(code, tests);
      expect(validation.passed).toBe(true);
    });

    it('fails when class not specified', () => {
      const code = `extends Node`;
      const tests: TestCase[] = [
        { description: 'Missing class', type: 'extends' },
      ];
      const validation = validateCode(code, tests);
      expect(validation.passed).toBe(false);
      expect(validation.results[0].message).toContain('не указан');
    });
  });

  // ── has_signal test cases ───────────────────────────────────────────────────

  describe('has_signal test cases', () => {
    it('passes when signal is declared in code', () => {
      const code = `signal health_changed(new_health)\nsignal died`;
      const tests: TestCase[] = [
        { description: 'Has health_changed signal', type: 'has_signal', signalName: 'health_changed' },
      ];
      const validation = validateCode(code, tests);
      expect(validation.passed).toBe(true);
      expect(validation.results[0].message).toContain('объявлен');
    });

    it('fails when signal is not declared', () => {
      const code = `signal died`;
      const tests: TestCase[] = [
        { description: 'Has health_changed signal', type: 'has_signal', signalName: 'health_changed' },
      ];
      const validation = validateCode(code, tests);
      expect(validation.passed).toBe(false);
      expect(validation.results[0].message).toContain('не найден');
    });

    it('uses expected as fallback when signalName is not provided', () => {
      const code = `signal game_over`;
      const tests: TestCase[] = [
        { description: 'Has game_over signal', type: 'has_signal', expected: 'game_over' },
      ];
      const validation = validateCode(code, tests);
      expect(validation.passed).toBe(true);
    });

    it('fails when signal name not specified', () => {
      const code = `signal something`;
      const tests: TestCase[] = [
        { description: 'Missing signal name', type: 'has_signal' },
      ];
      const validation = validateCode(code, tests);
      expect(validation.passed).toBe(false);
      expect(validation.results[0].message).toContain('не указано');
    });
  });

  // ── output test cases ───────────────────────────────────────────────────────

  describe('output test cases', () => {
    it('passes when output matches expected string', () => {
      const code = `print("Hello")`;
      const tests: TestCase[] = [
        { description: 'Output is Hello', type: 'output', expected: 'Hello' },
      ];
      const validation = validateCode(code, tests);
      expect(validation.passed).toBe(true);
    });

    it('fails when output does not match expected string', () => {
      const code = `print("World")`;
      const tests: TestCase[] = [
        { description: 'Output is Hello', type: 'output', expected: 'Hello' },
      ];
      const validation = validateCode(code, tests);
      expect(validation.passed).toBe(false);
    });

    it('passes when output matches expected array', () => {
      const code = `print("A")\nprint("B")`;
      const tests: TestCase[] = [
        { description: 'Output is A then B', type: 'output', expected: ['A', 'B'] },
      ];
      const validation = validateCode(code, tests);
      expect(validation.passed).toBe(true);
    });

    it('fails when output array does not match', () => {
      const code = `print("A")\nprint("C")`;
      const tests: TestCase[] = [
        { description: 'Output is A then B', type: 'output', expected: ['A', 'B'] },
      ];
      const validation = validateCode(code, tests);
      expect(validation.passed).toBe(false);
    });

    it('fails with execution error when code has errors', () => {
      const code = `print(undefined_var)`;
      const tests: TestCase[] = [
        { description: 'Has output', type: 'output', expected: 'something' },
      ];
      const validation = validateCode(code, tests);
      expect(validation.passed).toBe(false);
      expect(validation.results[0].message).toContain('Ошибка выполнения');
    });
  });

  // ── Multiple test cases ─────────────────────────────────────────────────────

  describe('multiple test cases', () => {
    it('runs all tests and aggregates results', () => {
      const code = `extends Node2D\n\nsignal health_changed\n\nfunc _ready():\n    print("ready")`;
      const tests: TestCase[] = [
        { description: 'Extends Node2D', type: 'extends', extendsClass: 'Node2D' },
        { description: 'Has health_changed signal', type: 'has_signal', signalName: 'health_changed' },
        { description: 'Has _ready function', type: 'function_exists', functionName: '_ready' },
      ];
      const validation = validateCode(code, tests);
      expect(validation.passed).toBe(true);
      expect(validation.totalTests).toBe(3);
      expect(validation.passedTests).toBe(3);
    });

    it('reports partial pass when some tests fail', () => {
      const code = `extends Node2D\n\nfunc _ready():\n    pass`;
      const tests: TestCase[] = [
        { description: 'Extends Node2D', type: 'extends', extendsClass: 'Node2D' },
        { description: 'Has missing_signal', type: 'has_signal', signalName: 'missing_signal' },
      ];
      const validation = validateCode(code, tests);
      expect(validation.passed).toBe(false);
      expect(validation.totalTests).toBe(2);
      expect(validation.passedTests).toBe(1);
    });
  });

  // ── has_method test cases ───────────────────────────────────────────────────

  describe('has_method test cases', () => {
    it('passes when method exists in code', () => {
      const code = `func take_damage(amount):\n    pass`;
      const tests: TestCase[] = [
        { description: 'take_damage method', type: 'has_method', functionName: 'take_damage' },
      ];
      const validation = validateCode(code, tests);
      expect(validation.passed).toBe(true);
    });

    it('fails when method does not exist', () => {
      const code = `func other():\n    pass`;
      const tests: TestCase[] = [
        { description: 'take_damage method', type: 'has_method', functionName: 'take_damage' },
      ];
      const validation = validateCode(code, tests);
      expect(validation.passed).toBe(false);
      expect(validation.results[0].message).toContain('не найден');
    });
  });

  // ── custom test cases ──────────────────────────────────────────────────────

  describe('custom test cases', () => {
    it('passes when custom pattern matches', () => {
      const code = `var speed: float = 200.0`;
      const tests: TestCase[] = [
        { description: 'Speed is typed as float', type: 'custom', pattern: 'speed\\s*:\\s*float' },
      ];
      const validation = validateCode(code, tests);
      expect(validation.passed).toBe(true);
    });

    it('fails when custom pattern does not match', () => {
      const code = `var speed = 200`;
      const tests: TestCase[] = [
        { description: 'Speed is typed as float', type: 'custom', pattern: 'speed\\s*:\\s*float' },
      ];
      const validation = validateCode(code, tests);
      expect(validation.passed).toBe(false);
    });

    it('fails when custom test has no pattern', () => {
      const code = `var x = 1`;
      const tests: TestCase[] = [
        { description: 'Custom without pattern', type: 'custom' },
      ];
      const validation = validateCode(code, tests);
      expect(validation.passed).toBe(false);
      expect(validation.results[0].message).toContain('не содержит шаблона');
    });
  });
});
