'use client';

import React, { useCallback, useState } from 'react';
import { Play, RotateCcw, Save, Download, Upload, BookOpen } from 'lucide-react';
import Link from 'next/link';
import GDScriptEditor from '@/components/playground/gdscript-editor';
import OutputConsole from '@/components/playground/output-console';
import { executeGDScript, type InterpreterResult } from '@/lib/gdscript-interpreter';

const DEFAULT_CODE = `# Добро пожаловать в GDScript Playground!
# Пишите GDScript код и запускайте его прямо в браузере.
# Поддерживаются: переменные, функции, циклы, условия, print()

# Пример: вывод чисел от 1 до 5
for i in range(1, 6):
    print("Число: " + str(i))

# Пример: функция с возвратом
func calculate_damage(base: int, multiplier: float) -> int:
    var result = base * multiplier
    return int(result)

# Вызов функции
var damage = calculate_damage(10, 2.5)
print("Урон: " + str(damage))
`;

const EXAMPLES = [
  {
    name: 'Привет, мир!',
    code: `# Простейший пример
print("Привет, Godot!")
print("GDScript работает в браузере!")
`,
  },
  {
    name: 'Переменные и типы',
    code: `# Переменные и типы данных GDScript
var health: int = 100
var speed: float = 250.5
var name: String = "Hero"
var is_alive: bool = true

print("Здоровье: " + str(health))
print("Скорость: " + str(speed))
print("Имя: " + name)
print("Жив: " + str(is_alive))
`,
  },
  {
    name: 'Функции',
    code: `# Функции в GDScript
func greet(name: String) -> String:
    return "Привет, " + name + "!"

func add(a: int, b: int) -> int:
    return a + b

# Вызовы функций
print(greet("Игрок"))
print("2 + 3 = " + str(add(2, 3)))

# Функция с значениями по умолчанию
func create_enemy(hp: int = 50, damage: int = 10):
    print("Враг: HP=" + str(hp) + " DMG=" + str(damage))

create_enemy()
create_enemy(100, 25)
`,
  },
  {
    name: 'Циклы',
    code: `# Циклы в GDScript

# for с range
print("=== Цикл for ===")
for i in range(5):
    print("Итерация: " + str(i))

# Обратный отсчёт
print("\\n=== Обратный отсчёт ===")
for i in range(10, 0, -1):
    print(str(i) + "...")
print("Пуск!")

# for по массиву
print("\\n=== Перебор массива ===")
var fruits = ["Яблоко", "Банан", "Вишня"]
for fruit in fruits:
    print("- " + fruit)
`,
  },
  {
    name: 'Условия',
    code: `# Условные конструкции
var score = 85

if score >= 90:
    print("Оценка: A (Отлично!)")
elif score >= 80:
    print("Оценка: B (Хорошо)")
elif score >= 70:
    print("Оценка: C (Удовлетворительно)")
elif score >= 60:
    print("Оценка: D (Ещё подтянуть)")
else:
    print("Оценка: F (Нужно больше практики)")

# Тернарный оператор (в GDScript — через if/else в одну строку)
var level = "Высокий" if score > 75 else "Низкий"
print("Уровень: " + level)

# match (аналог switch)
var direction = "up"
match direction:
    "up":
        print("Движение вверх")
    "down":
        print("Движение вниз")
    "left":
        print("Движение влево")
    "right":
        print("Движение вправо")
    _:
        print("Неизвестное направление")
`,
  },
  {
    name: 'Массивы и словари',
    code: `# Массивы
var inventory = ["Меч", "Щит", "Зелье"]
print("Инвентарь: " + str(inventory))
print("Первый предмет: " + inventory[0])
print("Количество: " + str(len(inventory)))

# Добавление
inventory.append("Лук")
print("После добавления: " + str(inventory))

# Словари
var player = {
    "name": "Hero",
    "level": 5,
    "hp": 100
}
print("\\nИгрок: " + str(player))
print("Имя: " + player["name"])
print("Уровень: " + str(player["level"]))
`,
  },
  {
    name: 'Математика',
    code: `# Математические функции GDScript
print("=== Базовые операции ===")
print("2 + 3 = " + str(2 + 3))
print("10 - 4 = " + str(10 - 4))
print("3 * 7 = " + str(3 * 7))
print("15 / 4 = " + str(15 / 4))  # float
print("15 % 4 = " + str(15 % 4))  # остаток

print("\\n=== Функции ===")
print("abs(-5) = " + str(abs(-5)))
print("max(3, 7) = " + str(max(3, 7)))
print("min(3, 7) = " + str(min(3, 7)))
print("clamp(15, 0, 10) = " + str(clamp(15, 0, 10)))
print("lerp(0, 100, 0.5) = " + str(lerp(0, 100, 0.5)))

print("\\n=== Тригонометрия ===")
print("PI = " + str(PI))
print("deg_to_rad(90) = " + str(deg_to_rad(90)))
print("sin(PI/2) = " + str(sin(PI / 2)))
`,
  },
];

export default function PlaygroundClient() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [result, setResult] = useState<InterpreterResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showExamples, setShowExamples] = useState(false);

  const handleRun = useCallback(async () => {
    setIsRunning(true);
    await new Promise((r) => setTimeout(r, 50));
    const res = executeGDScript(code);
    setResult(res);
    setIsRunning(false);
  }, [code]);

  const handleReset = useCallback(() => {
    setCode(DEFAULT_CODE);
    setResult(null);
  }, []);

  const handleSave = useCallback(() => {
    try {
      localStorage.setItem('gdscript-playground-code', code);
      alert('Код сохранён в локальное хранилище');
    } catch {
      alert('Не удалось сохранить код');
    }
  }, [code]);

  const handleLoad = useCallback(() => {
    try {
      const saved = localStorage.getItem('gdscript-playground-code');
      if (saved) {
        setCode(saved);
        setResult(null);
      } else {
        alert('Сохранённый код не найден');
      }
    } catch {
      alert('Не удалось загрузить код');
    }
  }, []);

  const handleExport = useCallback(() => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'script.gd';
    a.click();
    URL.revokeObjectURL(url);
  }, [code]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.gd,.txt';
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        setCode(text);
        setResult(null);
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  const loadExample = useCallback((exampleCode: string) => {
    setCode(exampleCode);
    setResult(null);
    setShowExamples(false);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎮</span>
              <h1 className="text-lg font-bold">GDScript Playground</h1>
            </div>
            <span className="text-xs text-gray-500 hidden sm:block">
              Интерактивная среда для практики GDScript
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/learn"
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Уроки</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Code Editor */}
          <div className="space-y-3">
            {/* Toolbar */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRun}
                  disabled={isRunning}
                  className="flex items-center gap-2 px-4 py-2 bg-[#ff7085] hover:bg-[#ff5a70] text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#ff7085]/20"
                >
                  <Play className="w-4 h-4" />
                  Запуск
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Сброс
                </button>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleSave}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  title="Сохранить в localStorage"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={handleLoad}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  title="Загрузить из localStorage"
                >
                  <Upload className="w-4 h-4" />
                </button>
                <button
                  onClick={handleExport}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  title="Скачать .gd файл"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={handleImport}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  title="Импортировать файл"
                >
                  <Upload className="w-3 h-3 rotate-180" />
                </button>
              </div>
            </div>

            {/* Examples dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExamples(!showExamples)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
              >
                📚 Примеры
              </button>
              {showExamples && (
                <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 min-w-[200px]">
                  {EXAMPLES.map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => loadExample(ex.code)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors first:rounded-t-lg last:rounded-b-lg"
                    >
                      {ex.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Editor */}
            <GDScriptEditor
              value={code}
              onChange={setCode}
              height="calc(100vh - 280px)"
              minHeight="400px"
            />
          </div>

          {/* Right: Output */}
          <div className="space-y-4">
            <OutputConsole
              result={result}
              isRunning={isRunning}
              className="min-h-[300px]"
            />

            {/* Info panel */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">
                О Playground
              </h3>
              <div className="text-xs text-gray-500 space-y-1.5">
                <p>
                  Это <strong className="text-gray-400">упрощённый интерпретатор</strong> GDScript,
                  работающий в браузере. Он поддерживает базовые конструкции:
                  переменные, функции, циклы, условия, print().
                </p>
                <p>
                  <strong className="text-gray-400">Не поддерживается:</strong> узлы сцены ($NodePath),
                  сигналы, await, ресурсы (load/preload), классы Godot API
                  (CharacterBody2D, Timer и т.д.).
                </p>
                <p>
                  Для полноценной практики с Godot API используйте локальный
                  Godot Editor и челленджи в уроках.
                </p>
              </div>
            </div>

            {/* Quick reference */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">
                Быстрый справочник
              </h3>
              <div className="grid grid-cols-1 gap-1.5 text-xs font-mono">
                <div className="text-gray-400"><span className="text-[#ff7085]">var</span> name: Type = value</div>
                <div className="text-gray-400"><span className="text-[#ff7085]">func</span> name(params){' -> '}ReturnType:</div>
                <div className="text-gray-400"><span className="text-[#ff7085]">for</span> i <span className="text-[#ff7085]">in</span> range(n):</div>
                <div className="text-gray-400"><span className="text-[#ff7085]">while</span> condition:</div>
                <div className="text-gray-400"><span className="text-[#ff7085]">if</span> / <span className="text-[#ff7085]">elif</span> / <span className="text-[#ff7085]">else</span>:</div>
                <div className="text-gray-400"><span className="text-[#ff7085]">match</span> value:</div>
                <div className="text-gray-400"><span className="text-[#77e57a]">print</span>(value)</div>
                <div className="text-gray-400"><span className="text-[#77e57a]">range</span>(start, end, step)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
