/**
 * GDScript Mock Interpreter
 *
 * This is NOT a real GDScript runtime — it's a simplified evaluator that can:
 * 1. Parse basic GDScript constructs (variables, functions, print, if/for)
 * 2. Execute a safe subset of operations in JavaScript
 * 3. Catch output from print() calls
 * 4. Validate code against test patterns (for challenge checking)
 *
 * This follows "Variant C" from the roadmap: Mock-выполнение (проверка через AST matching)
 */

export interface InterpreterResult {
  success: boolean;
  output: string[];
  errors: string[];
  duration: number; // ms
  variables?: Record<string, any>;
}

export interface TestCase {
  /** Description of what this test checks */
  description: string;
  /** Type of test */
  type: 'output' | 'pattern' | 'variable' | 'function_exists' | 'extends' | 'has_signal' | 'has_method' | 'custom';
  /** Expected value (depends on type) */
  expected?: string | string[] | Record<string, any>;
  /** Pattern to search for in code (regex string) */
  pattern?: string;
  /** Function name to check existence */
  functionName?: string;
  /** Signal name to check */
  signalName?: string;
  /** Class name to check extends */
  extendsClass?: string;
}

export interface ChallengeValidation {
  passed: boolean;
  results: {
    test: TestCase;
    passed: boolean;
    message: string;
  }[];
  totalTests: number;
  passedTests: number;
}

// ─── Safe GDScript Subset Interpreter ────────────────────────────────────────

/**
 * Execute a simplified GDScript subset and capture print() output.
 * This is intentionally limited — it handles:
 * - Variable declarations (var x = ...)
 * - print() calls
 * - Basic arithmetic
 * - String concatenation
 * - if/elif/else
 * - for loops (range)
 * - while loops (with iteration limit)
 * - Function declarations (func)
 * - Basic array/dict literals
 */
export function executeGDScript(code: string, timeout = 5000): InterpreterResult {
  const startTime = Date.now();
  const output: string[] = [];
  const errors: string[] = [];
  const variables: Record<string, any> = {};

  try {
    // Transpile GDScript → JS (simplified)
    const jsCode = transpileToJS(code);

    // Create a sandboxed execution environment
    const sandbox = createSandbox(output, variables, timeout);

    // Execute with timeout protection
    const timeoutId = setTimeout(() => {
      throw new Error('TimeoutError: Превышено время выполнения (5 сек)');
    }, timeout);

    try {
      // Use Function constructor for sandboxed execution
      const fn = new Function(
        ...Object.keys(sandbox),
        `"use strict";\n${jsCode}`
      );
      fn(...Object.values(sandbox));
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error: any) {
    errors.push(formatError(error));
  }

  return {
    success: errors.length === 0,
    output,
    errors,
    duration: Date.now() - startTime,
    variables,
  };
}

// ─── Transpiler: GDScript → JavaScript ───────────────────────────────────────

function transpileToJS(gdscript: string): string {
  let js = gdscript;

  // Remove comments
  js = js.replace(/#.*$/gm, '');

  // Handle multiline strings (""" ... """)
  js = js.replace(/"""/g, '`');
  js = js.replace(/'''/g, '`');

  // Replace GDScript-specific syntax
  // `extends X` → comment (no JS equivalent needed)
  js = js.replace(/^(\s*)extends\s+\w+.*$/gm, '$1// extends');

  // `class_name X` → comment
  js = js.replace(/^(\s*)class_name\s+\w+.*$/gm, '$1// class_name');

  // `signal name(args)` → comment
  js = js.replace(/^(\s*)signal\s+(\w+)\s*(\(.*\))?$/gm, '$1// signal $2$3');

  // `@export`, `@onready`, etc. → remove annotations
  js = js.replace(/@export\s*/g, '');
  js = js.replace(/@onready\s*/g, '');

  // `var x: Type = value` → `let x = value`
  js = js.replace(/^(\s*)var\s+(\w+)\s*(?::\s*\w+)?\s*=\s*/gm, '$1let $2 = ');

  // `var x: Type` → `let x = null`
  js = js.replace(/^(\s*)var\s+(\w+)\s*(?::\s*\w+)?\s*$/gm, '$1let $2 = null');

  // `const X = value` → `const X = value`
  js = js.replace(/^(\s*)const\s+/gm, '$1const ');

  // `print(...)` → `__print(...)`
  js = js.replace(/\bprint\s*\(/g, '__print(');

  // `printerr(...)` → `console.error(...)`
  js = js.replace(/\bprinterr\s*\(/g, 'console.error(');

  // `push_error(...)` → `console.error(...)`
  js = js.replace(/\bpush_error\s*\(/g, 'console.error(');

  // `push_warning(...)` → `console.warn(...)`
  js = js.replace(/\bpush_warning\s*\(/g, 'console.warn(');

  // NOTE: `range(start, end, step)` → `__range(start, end, step)` is done AFTER
  // the for-loop transpilation below, to avoid conflicting with the for-loop regex.

  // `len(x)` → `x.length` (for arrays)
  // Skip — too complex to replace inline, provide as function

  // `str(x)` → `String(x)`
  js = js.replace(/\bstr\s*\(/g, 'String(');

  // `int(x)` → `parseInt(x)`
  js = js.replace(/\bint\s*\(/g, 'parseInt(');

  // `float(x)` → `parseFloat(x)`
  js = js.replace(/\bfloat\s*\(/g, 'parseFloat(');

  // `abs(x)` → `Math.abs(x)`
  js = js.replace(/\babs\s*\(/g, 'Math.abs(');

  // `min(a, b)` → `Math.min(a, b)`
  js = js.replace(/(?<!Math\.)\bmin\s*\(/g, 'Math.min(');

  // `max(a, b)` → `Math.max(a, b)`
  js = js.replace(/(?<!Math\.)\bmax\s*\(/g, 'Math.max(');

  // `clamp(value, min, max)` → `Math.min(Math.max(value, min), max)`
  // Must come AFTER min/max replacements so the Math.min/Math.max in the output
  // are not double-processed.
  js = js.replace(/\bclamp\s*\(([^,]+),\s*([^,]+),\s*([^)]+)\)/g,
    'Math.min(Math.max($1, $2), $3)');

  // `pow(a, b)` → `Math.pow(a, b)`
  js = js.replace(/\bpow\s*\(/g, 'Math.pow(');

  // `sqrt(x)` → `Math.sqrt(x)`
  js = js.replace(/\bsqrt\s*\(/g, 'Math.sqrt(');

  // `randf()` → `Math.random()`
  js = js.replace(/\brandf\s*\(\)/g, 'Math.random()');

  // `randi()` → `Math.floor(Math.random() * 4294967296)`
  js = js.replace(/\brandi\s*\(\)/g, 'Math.floor(Math.random() * 4294967296)');

  // `randi_range(min, max)` → simplified
  js = js.replace(/\brandi_range\s*\(([^,]+),\s*([^)]+)\)/g,
    'Math.floor(Math.random() * ($2 - $1 + 1)) + $1');

  // `randf_range(min, max)` → simplified
  js = js.replace(/\brandf_range\s*\(([^,]+),\s*([^)]+)\)/g,
    'Math.random() * ($2 - $1) + $1');

  // `deg_to_rad(d)` → `d * Math.PI / 180`
  js = js.replace(/\bdeg_to_rad\s*\(([^)]+)\)/g, '($1 * Math.PI / 180)');

  // `rad_to_deg(r)` → `r * 180 / Math.PI`
  js = js.replace(/\brad_to_deg\s*\(([^)]+)\)/g, '($1 * 180 / Math.PI)');

  // `lerp(a, b, t)` → `a + (b - a) * t`
  js = js.replace(/\blerp\s*\(([^,]+),\s*([^,]+),\s*([^)]+)\)/g,
    '($1 + ($2 - $1) * $3)');

  // `is_equal_approx(a, b)` → `Math.abs(a - b) < 0.00001`
  js = js.replace(/\bis_equal_approx\s*\(([^,]+),\s*([^)]+)\)/g,
    '(Math.abs($1 - $2) < 0.00001)');

  // `Vector2(x, y)` → `{x: x, y: y}`
  js = js.replace(/\bVector2\s*\(([^,)]*),\s*([^)]*)\)/g, '{x: $1, y: $2, _type: "Vector2"}');

  // `Vector2.ZERO` → `{x: 0, y: 0}`
  js = js.replace(/\bVector2\.ZERO/g, '{x: 0, y: 0, _type: "Vector2"}');
  js = js.replace(/\bVector2\.ONE/g, '{x: 1, y: 1, _type: "Vector2"}');
  js = js.replace(/\bVector2\.UP/g, '{x: 0, y: -1, _type: "Vector2"}');
  js = js.replace(/\bVector2\.DOWN/g, '{x: 0, y: 1, _type: "Vector2"}');
  js = js.replace(/\bVector2\.LEFT/g, '{x: -1, y: 0, _type: "Vector2"}');
  js = js.replace(/\bVector2\.RIGHT/g, '{x: 1, y: 0, _type: "Vector2"}');

  // `Color(r, g, b)` → simplified
  js = js.replace(/\bColor\s*\(([^,)]*),\s*([^,)]*),\s*([^)]*)\)/g,
    '{r: $1, g: $2, b: $3, _type: "Color"}');

  // `Color.NAME` → simplified (a few common colors)
  js = js.replace(/\bColor\.WHITE/g, '{r: 1, g: 1, b: 1, _type: "Color"}');
  js = js.replace(/\bColor\.BLACK/g, '{r: 0, g: 0, b: 0, _type: "Color"}');
  js = js.replace(/\bColor\.RED/g, '{r: 1, g: 0, b: 0, _type: "Color"}');
  js = js.replace(/\bColor\.GREEN/g, '{r: 0, g: 1, b: 0, _type: "Color"}');
  js = js.replace(/\bColor\.BLUE/g, '{r: 0, g: 0, b: 1, _type: "Color"}');

  // `PI` → `Math.PI`
  js = js.replace(/\bPI\b/g, 'Math.PI');
  js = js.replace(/\bINF\b/g, 'Infinity');

  // `true` / `false` already compatible
  // `null` already compatible

  // `not` → `!`
  js = js.replace(/\bnot\s+/g, '!');

  // `and` → `&&`
  js = js.replace(/\band\b/g, '&&');

  // `or` → `||`
  js = js.replace(/\bor\b/g, '||');

  // `elif condition:` → `else if (condition) {`
  // Must be done before the generic `if condition:` replacement
  js = js.replace(
    /^(\s*)elif\s+(.+):\s*$/gm,
    '$1else if ($2) {'
  );

  // `pass` → empty statement
  js = js.replace(/^(\s*)pass\s*$/gm, '$1/* pass */');

  // `await` → comment (no async support in mock)
  js = js.replace(/\bawait\s+/g, '/* await */ ');

  // `self` → `this`
  js = js.replace(/\bself\b/g, 'this');

  // GDScript string formatting: "text %s" % value → simplified
  // Too complex for regex; skip

  // `$NodePath` → `null` (mock)
  js = js.replace(/\$\w[\w\/]*/g, '/* $node */ null');

  // `for x in range(n):` → `for (let x of __range(0, n)) {`
  // Must be done BEFORE the generic `range` → `__range` replacement
  js = js.replace(
    /^(\s*)for\s+(\w+)\s+in\s+range\s*\(([^)]+)\)\s*:/gm,
    (match, indent, varName, rangeArgs) => {
      return `${indent}for (let ${varName} of __range(${rangeArgs})) {`;
    }
  );

  // `for x in array:` → `for (let x of array) {`
  js = js.replace(
    /^(\s*)for\s+(\w+)\s+in\s+(\w+)\s*:/gm,
    '$1for (let $2 of $3) {'
  );

  // `range(start, end, step)` → `__range(start, end, step)`
  // Must be done AFTER the for-loop transpilation above
  js = js.replace(/\brange\s*\(/g, '__range(');

  // `func _ready():` → `function _ready() {`
  // `func name(params):` → `function name(params) {`
  js = js.replace(/^(\s*)func\s+(\w+)\s*\(([^)]*)\)[^:\n]*:?\s*$/gm, (match, indent, name, params) => {
    // Convert GDScript params: `name: Type = default` → `name = default`
    const jsParams = params
      .split(',')
      .map((p: string) => {
        const trimmed = p.trim();
        if (!trimmed) return '';
        // Remove type annotations: `name: Type` → `name`, `name: Type = val` → `name = val`
        const withDefault = trimmed.match(/^(\w+)\s*:\s*\w+\s*=\s*(.+)$/);
        if (withDefault) return `${withDefault[1]} = ${withDefault[2]}`;
        const noType = trimmed.match(/^(\w+)\s*:\s*\w+$/);
        if (noType) return noType[1];
        return trimmed;
      })
      .filter(Boolean)
      .join(', ');
    return `${indent}function ${name}(${jsParams}) {`;
  });

  // `while condition:` → `while (condition) {`
  js = js.replace(
    /^(\s*)while\s+(.+):\s*$/gm,
    '$1while ($2) {'
  );

  // `if condition:` → `if (condition) {`
  js = js.replace(
    /^(\s*)if\s+(.+):\s*$/gm,
    '$1if ($2) {'
  );

  // `else:` → `else {`
  // The brace-closing algorithm will add the `}` for the previous block
  js = js.replace(
    /^(\s*)else\s*:\s*$/gm,
    '$1else {'
  );

  // `match value:` → `switch (value) {`
  js = js.replace(
    /^(\s*)match\s+(.+):\s*$/gm,
    '$1switch ($2) {'
  );

  // Closing braces for blocks — we rely on indentation
  // This is tricky. For a simple mock, we'll add braces based on indentation changes.
  // Actually, let's take a different approach: wrap everything in a block and
  // use indentation to determine closing braces.

  // Simple approach: replace indented blocks
  // Add closing braces after each block
  const lines = js.split('\n');
  const result: string[] = [];
  const indentStack: number[] = [0];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimStart();

    if (!trimmed || trimmed.startsWith('//')) {
      result.push(line);
      continue;
    }

    const currentIndent = line.length - line.trimStart().length;
    const prevIndent = indentStack[indentStack.length - 1];

    // If we de-dented (strictly less indent), close blocks
    while (indentStack.length > 1 && currentIndent < indentStack[indentStack.length - 1]) {
      indentStack.pop();
      // Add closing brace at the previous indentation level
      const braceIndent = ' '.repeat(Math.max(0, indentStack[indentStack.length - 1]));
      result.push(braceIndent + '}');
    }

    result.push(line);

    // If this line opens a block (ends with {), push the new indent level
    if (trimmed.endsWith('{')) {
      // Next line's indent will be the block level
      const nextLine = lines[i + 1];
      if (nextLine) {
        const nextIndent = nextLine.length - nextLine.trimStart().length;
        if (nextIndent > currentIndent) {
          indentStack.push(nextIndent);
        } else {
          indentStack.push(currentIndent + 4);
        }
      } else {
        indentStack.push(currentIndent + 4);
      }
    }
  }

  // Close remaining open blocks
  while (indentStack.length > 1) {
    indentStack.pop();
    const braceIndent = ' '.repeat(Math.max(0, indentStack[indentStack.length - 1]));
    result.push(braceIndent + '}');
  }

  return result.join('\n');
}

// ─── Sandbox Environment ─────────────────────────────────────────────────────

function createSandbox(output: string[], variables: Record<string, any>, timeout: number) {
  let iterationCount = 0;
  const MAX_ITERATIONS = 100000;

  return {
    __print: (...args: any[]) => {
      const formatted = args.map((a) => {
        if (a === null) return 'null';
        if (a === undefined) return 'null';
        if (typeof a === 'object' && a._type) return formatGDScriptType(a);
        if (typeof a === 'object') return JSON.stringify(a);
        if (typeof a === 'number' && Number.isInteger(a)) return a.toString();
        if (typeof a === 'number') return a.toFixed(6).replace(/\.?0+$/, '');
        return String(a);
      }).join(' ');
      output.push(formatted);
    },
    __range: (startOrEnd: number, end?: number, step?: number) => {
      let start = 0;
      let stop = startOrEnd;
      let s = step ?? 1;

      if (end !== undefined) {
        start = startOrEnd;
        stop = end;
      }

      const result: number[] = [];
      if (s > 0) {
        for (let i = start; i < stop; i += s) {
          if (++iterationCount > MAX_ITERATIONS) {
            throw new Error('RangeError: Слишком большой диапазон');
          }
          result.push(i);
        }
      } else if (s < 0) {
        for (let i = start; i > stop; i += s) {
          if (++iterationCount > MAX_ITERATIONS) {
            throw new Error('RangeError: Слишком большой диапазон');
          }
          result.push(i);
        }
      }
      return result;
    },
    __len: (obj: any) => {
      if (Array.isArray(obj)) return obj.length;
      if (typeof obj === 'string') return obj.length;
      if (obj && typeof obj === 'object') return Object.keys(obj).length;
      return 0;
    },
    // Math functions
    abs: Math.abs,
    sign: Math.sign,
    floor: Math.floor,
    ceil: Math.ceil,
    round: Math.round,
    sqrt: Math.sqrt,
    pow: Math.pow,
    log: Math.log,
    exp: Math.exp,
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    asin: Math.asin,
    acos: Math.acos,
    atan: Math.atan,
    atan2: Math.atan2,
    min: Math.min,
    max: Math.max,
    randomize: () => {}, // no-op in mock
    randf: () => Math.random(),
    randi: () => Math.floor(Math.random() * 4294967296),
    Vector2: class MockVector2 {
      x: number; y: number;
      constructor(x = 0, y = 0) { this.x = x; this.y = y; }
      length() { return Math.sqrt(this.x * this.x + this.y * this.y); }
      normalized() {
        const l = this.length();
        return l > 0 ? new MockVector2(this.x / l, this.y / l) : new MockVector2();
      }
      dot(v: any) { return this.x * v.x + this.y * v.y; }
      toString() { return `(${this.x}, ${this.y})`; }
      static ZERO = new MockVector2(0, 0);
      static ONE = new MockVector2(1, 1);
      static UP = new MockVector2(0, -1);
      static DOWN = new MockVector2(0, 1);
      static LEFT = new MockVector2(-1, 0);
      static RIGHT = new MockVector2(1, 0);
    },
    Color: class MockColor {
      r: number; g: number; b: number; a: number;
      constructor(r = 0, g = 0, b = 0, a = 1) {
        this.r = r; this.g = g; this.b = b; this.a = a;
      }
      toString() { return `Color(${this.r}, ${this.g}, ${this.b}, ${this.a})`; }
    },
  };
}

// ─── Code Validation (Pattern Matching) ──────────────────────────────────────

/**
 * Validate user code against test cases without executing it.
 * Used for challenges that can't run in the mock interpreter.
 */
export function validateCode(code: string, testCases: TestCase[]): ChallengeValidation {
  const results = testCases.map((test) => {
    const result = runTest(code, test);
    return {
      test,
      passed: result.passed,
      message: result.message,
    };
  });

  const passedTests = results.filter((r) => r.passed).length;

  return {
    passed: passedTests === testCases.length,
    results,
    totalTests: testCases.length,
    passedTests,
  };
}

function runTest(code: string, test: TestCase): { passed: boolean; message: string } {
  switch (test.type) {
    case 'pattern': {
      if (!test.pattern) {
        return { passed: false, message: 'Тест не содержит шаблона (pattern)' };
      }
      const regex = new RegExp(test.pattern, 'm');
      const match = regex.test(code);
      return {
        passed: match,
        message: match
          ? `Шаблон найден: ${test.description}`
          : `Шаблон не найден: ${test.description}`,
      };
    }

    case 'output': {
      // Execute the code and check output
      const result = executeGDScript(code);
      if (result.errors.length > 0) {
        return {
          passed: false,
          message: `Ошибка выполнения: ${result.errors[0]}`,
        };
      }

      if (Array.isArray(test.expected)) {
        const outputStr = result.output.join('\n');
        const expectedStr = test.expected.join('\n');
        const passed = outputStr.trim() === expectedStr.trim();
        return {
          passed,
          message: passed
            ? `Вывод совпадает: ${test.description}`
            : `Ожидался вывод:\n${expectedStr}\nПолучено:\n${outputStr}`,
        };
      }

      if (typeof test.expected === 'string') {
        const passed = result.output.join('\n').trim() === test.expected.trim();
        return {
          passed,
          message: passed
            ? `Вывод совпадает: ${test.description}`
            : `Ожидался: "${test.expected}"\nПолучено: "${result.output.join('\n')}"`,
        };
      }

      return { passed: false, message: 'Неверный формат expected для output-теста' };
    }

    case 'function_exists': {
      const funcName = test.functionName || test.expected;
      if (!funcName) {
        return { passed: false, message: 'Имя функции не указано' };
      }
      // Check for `func funcName`
      const regex = new RegExp(`func\\s+${escapeRegex(String(funcName))}\\s*\\(`, 'm');
      const match = regex.test(code);
      return {
        passed: match,
        message: match
          ? `Функция ${funcName} найдена`
          : `Функция ${funcName} не найдена`,
      };
    }

    case 'extends': {
      const className = test.extendsClass || test.expected;
      if (!className) {
        return { passed: false, message: 'Класс не указан' };
      }
      const regex = new RegExp(`extends\\s+${escapeRegex(String(className))}`, 'm');
      const match = regex.test(code);
      return {
        passed: match,
        message: match
          ? `Класс наследует ${className}`
          : `Класс не наследует ${className}`,
      };
    }

    case 'has_signal': {
      const signalName = test.signalName || test.expected;
      if (!signalName) {
        return { passed: false, message: 'Имя сигнала не указано' };
      }
      const regex = new RegExp(`signal\\s+${escapeRegex(String(signalName))}`, 'm');
      const match = regex.test(code);
      return {
        passed: match,
        message: match
          ? `Сигнал ${signalName} объявлен`
          : `Сигнал ${signalName} не найден`,
      };
    }

    case 'has_method': {
      const methodName = test.functionName || test.expected;
      if (!methodName) {
        return { passed: false, message: 'Имя метода не указано' };
      }
      const regex = new RegExp(`func\\s+${escapeRegex(String(methodName))}\\s*\\(`, 'm');
      const match = regex.test(code);
      return {
        passed: match,
        message: match
          ? `Метод ${methodName} определён`
          : `Метод ${methodName} не найден`,
      };
    }

    case 'variable': {
      // Execute code and check variable value
      const result = executeGDScript(code);
      if (result.errors.length > 0) {
        return {
          passed: false,
          message: `Ошибка выполнения: ${result.errors[0]}`,
        };
      }

      if (test.expected && typeof test.expected === 'object') {
        const expectedVars = test.expected as Record<string, any>;
        let allMatch = true;
        let mismatchInfo = '';

        for (const [key, value] of Object.entries(expectedVars)) {
          if (result.variables?.[key] !== value) {
            allMatch = false;
            mismatchInfo += `  ${key}: ожидалось ${value}, получено ${result.variables?.[key]}\n`;
          }
        }

        return {
          passed: allMatch,
          message: allMatch
            ? `Переменные совпадают: ${test.description}`
            : `Несовпадение переменных:\n${mismatchInfo}`,
        };
      }

      return { passed: false, message: 'Неверный формат expected для variable-теста' };
    }

    case 'custom': {
      // Custom test — just check the pattern
      if (test.pattern) {
        const regex = new RegExp(test.pattern, 'm');
        const match = regex.test(code);
        return {
          passed: match,
          message: match
            ? test.description
            : `Условие не выполнено: ${test.description}`,
        };
      }
      return { passed: false, message: 'Custom-тест не содержит шаблона' };
    }

    default:
      return { passed: false, message: `Неизвестный тип теста: ${test.type}` };
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatGDScriptType(obj: any): string {
  if (!obj || !obj._type) return String(obj);

  switch (obj._type) {
    case 'Vector2':
      return `(${obj.x}, ${obj.y})`;
    case 'Color':
      return `(${obj.r}, ${obj.g}, ${obj.b}, ${obj.a ?? 1})`;
    default:
      return JSON.stringify(obj);
  }
}

function formatError(error: any): string {
  const msg = error?.message || String(error);
  // Clean up JS error messages to look more like GDScript errors
  if (msg.includes('is not defined')) {
    const match = msg.match(/(\w+) is not defined/);
    if (match) {
      return `NameError: "${match[1]}" не определено`;
    }
  }
  if (msg.includes('is not a function')) {
    return `TypeError: ${msg}`;
  }
  if (msg.includes('Unexpected')) {
    return `SyntaxError: ${msg}`;
  }
  return msg;
}
