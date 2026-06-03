/**
 * GDScript Language Definition for Monaco Editor
 * Monarch tokenizer + completion items for Godot 4.x GDScript
 */

import type { languages } from 'monaco-editor';

// ─── GDScript Keywords (Godot 4.x) ───────────────────────────────────────────

const KEYWORDS = [
  'extends', 'class_name', 'var', 'const', 'func', 'signal',
  'enum', 'class', 'if', 'elif', 'else', 'for', 'while', 'match',
  'break', 'continue', 'pass', 'return', 'await', 'yield',
  'in', 'not', 'and', 'or', 'is', 'as', 'self', 'super',
  'true', 'false', 'null', 'void', 'static', 'preload',
  'onready', 'export', 'setget', 'remote', 'master', 'puppet',
  'remotesync', 'mastersync', 'puppetsync', 'pi',
  'TYPENODE', 'INF', 'NAN',
];

// ─── Built-in Types ──────────────────────────────────────────────────────────

const BUILT_IN_TYPES = [
  'bool', 'int', 'float', 'String', 'StringName', 'Vector2', 'Vector2i',
  'Vector3', 'Vector3i', 'Vector4', 'Vector4i', 'Color', 'Rect2', 'Rect2i',
  'Transform2D', 'Transform3D', 'Plane', 'Quaternion', 'AABB', 'Basis',
  'RID', 'Object', 'Callable', 'Signal', 'Dictionary', 'Array',
  'PackedByteArray', 'PackedInt32Array', 'PackedInt64Array',
  'PackedFloat32Array', 'PackedFloat64Array', 'PackedStringArray',
  'PackedVector2Array', 'PackedVector3Array', 'PackedColorArray',
  'Variant', 'NodePath',
];

// ─── Built-in Functions ──────────────────────────────────────────────────────

const BUILT_IN_FUNCTIONS = [
  'print', 'print_rich', 'printerr', 'printraw', 'prints', 'printt',
  'push_error', 'push_warning',
  'range', 'type_of', 'type_exists', 'typeof',
  'str', 'var_to_str', 'str_to_var', 'var_to_bytes', 'bytes_to_var',
  'hash', 'instance_from_id',
  'is_instance_valid', 'is_same', 'is_equal_approx', 'is_zero_approx',
  'is_instance_of', 'is_class',
  'absf', 'absi', 'abs', 'sign', 'signf', 'signi',
  'min', 'max', 'minf', 'maxf', 'mini', 'maxi',
  'clamp', 'clampf', 'clampi',
  'lerp', 'lerpf', 'lerp_angle',
  'inverse_lerp', 'inverse_lerpf',
  'remap', 'smoothstep', 'move_toward',
  'rotate_toward', 'angle_difference',
  'deg_to_rad', 'rad_to_deg',
  'linear_to_db', 'db_to_linear',
  'wrap', 'wrapf', 'wrapi',
  'pow', 'log', 'exp', 'sqrt', 'cbrt',
  'ceil', 'ceilf', 'ceili',
  'floor', 'floorf', 'floori',
  'round', 'roundf', 'roundi',
  'sin', 'cos', 'tan', 'sinh', 'cosh', 'tanh',
  'asin', 'acos', 'atan', 'atan2',
  'randf', 'randi', 'randf_range', 'randi_range',
  'rand_from_seed', 'rand_seed', 'seed',
  'randomize', 'rand_weighted',
  'fmod', 'fposmod', 'posmod',
  'rid_allocate_id', 'rid_from_int64',
  'len', 'sort', 'sort_custom',
  'merge', 'find', 'has', 'erase', 'append', 'push_back', 'push_front',
  'pop_back', 'pop_front', 'pop_at',
  'insert', 'remove_at', 'fill', 'resize', 'clear', 'is_empty',
  'keys', 'values', 'get', 'set',
  'dict_to_inst', 'inst_to_dict',
  'load', 'preload', 'ResourceLoader',
  'convert', 'char', 'ord', 'str_to_var',
  'validate_unicode',
];

// ─── Common Godot Node Methods ───────────────────────────────────────────────

const NODE_METHODS = [
  'get_node', 'get_parent', 'get_children', 'add_child', 'remove_child',
  'queue_free', 'free', 'call', 'call_deferred',
  'get', 'set', 'connect', 'disconnect', 'is_connected',
  'emit_signal', 'has_signal',
  'get_tree', 'get_viewport', 'get_window',
  'process_mode', 'process_priority',
  'visible', 'position', 'rotation', 'scale', 'global_position',
  'global_rotation', 'global_scale',
  'name', 'owner', 'scene_file_path',
  'is_node_ready', 'ready', 'enter_tree', 'exit_tree',
  '_ready', '_process', '_physics_process', '_input', '_unhandled_input',
  '_draw', '_enter_tree', '_exit_tree',
  'move_and_slide', 'move_and_collide',
  'play', 'stop', 'pause', 'seek',
  'start', 'wait_time', 'one_shot', 'autostart',
  'timeout', 'finished', 'body_entered', 'body_exited',
  'area_entered', 'area_exited',
  'add_to_group', 'remove_from_group', 'is_in_group',
  'duplicate', 'is_class', 'get_class',
  'print_tree', 'get_path', 'get_path_to',
  'find_child', 'find_children', 'find_parent',
];

// ─── Common Godot Classes (for extends/completion) ───────────────────────────

const GODOT_CLASSES = [
  'Node', 'Node2D', 'Node3D', 'Control', 'CanvasItem',
  'Sprite2D', 'AnimatedSprite2D', 'Sprite3D',
  'CharacterBody2D', 'CharacterBody3D', 'RigidBody2D', 'RigidBody3D',
  'StaticBody2D', 'StaticBody3D', 'Area2D', 'Area3D',
  'CollisionShape2D', 'CollisionShape3D', 'CollisionPolygon2D',
  'Camera2D', 'Camera3D',
  'Label', 'RichTextLabel', 'Button', 'TextureButton', 'LinkButton',
  'LineEdit', 'TextEdit', 'CodeEdit',
  'HSlider', 'VSlider', 'HScrollBar', 'VScrollBar',
  'ProgressBar', 'TextureProgressBar',
  'Panel', 'PanelContainer', 'BoxContainer', 'HBoxContainer', 'VBoxContainer',
  'GridContainer', 'FlowContainer', 'MarginContainer', 'CenterContainer',
  'ScrollContainer', 'SplitContainer', 'TabContainer',
  'Timer', 'AudioStreamPlayer', 'AudioStreamPlayer2D', 'AudioStreamPlayer3D',
  'AnimationPlayer', 'AnimationTree', 'Tween',
  'Resource', 'ResourceLoader', 'ResourceSaver',
  'SceneTree', 'Viewport', 'Window', 'SubViewport',
  'Input', 'InputMap', 'InputEvent', 'InputEventKey', 'InputEventMouseButton',
  'OS', 'Engine', 'ProjectSettings', 'GD',
  'PackedScene', 'Material', 'ShaderMaterial', 'Shader',
  'TileMap', 'TileMapLayer', 'TileSet',
  'RayCast2D', 'RayCast3D', 'ShapeCast2D', 'ShapeCast3D',
  'GPUParticles2D', 'GPUParticles3D', 'CPUParticles2D', 'CPUParticles3D',
  'Light2D', 'Light3D', 'DirectionalLight3D', 'OmniLight3D', 'SpotLight3D',
  'MeshInstance3D', 'CsgMesh3D', 'CollisionPolygon3D',
  'NavigationRegion2D', 'NavigationRegion3D', 'NavigationAgent2D', 'NavigationAgent3D',
  'RefCounted', 'FileAccess', 'DirAccess', 'JSON', 'JSONParser',
  'Vector2', 'Vector3', 'Color', 'Rect2', 'Transform2D', 'Transform3D',
  'AudioStream', 'AudioStreamWAV', 'AudioStreamOggVorbis',
  'Texture2D', 'CompressedTexture2D', 'ImageTexture', 'AtlasTexture',
  'Curve2D', 'Curve3D', 'Path2D', 'Path3D', 'PathFollow2D', 'PathFollow3D',
];

// ─── Monarch Tokenizer ───────────────────────────────────────────────────────

export const gdscriptLanguageDef: languages.IMonarchLanguage = {
  defaultToken: '',
  tokenPostfix: '.gdscript',

  keywords: KEYWORDS,
  typeKeywords: BUILT_IN_TYPES,

  operators: [
    '=', '>', '<', '!', '~', '?', ':',
    '==', '<=', '>=', '!=', '&&', '||', '??',
    '+', '-', '*', '/', '%', '&', '|', '^', '<<', '>>',
    '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=',
    '<<=', '>>=',
  ],

  symbols: /[=><!~?:&|+\-*/^%]+/,

  escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

  tokenizer: {
    root: [
      // Annotation / decorator
      [/@[a-zA-Z_]\w*/, 'keyword', '@annotation'],

      // Strings
      [/"([^"\\]|\\.)*$/, 'string.invalid'],  // non-terminated string
      [/'([^'\\]|\\.)*$/, 'string.invalid'],
      [/"([^"\\]|\\.)*"/, 'string'],
      [/'([^'\\]|\\.)*'/, 'string'],

      // Multi-line strings (triple quotes)
      [/"""/, 'string', '@string_triple_double'],
      [/'''/, 'string', '@string_triple_single'],

      // $ node path
      [/\$/, 'keyword', '@nodepath'],

      // Numbers
      [/\d*\.\d+([eE][+-]?\d+)?/, 'number.float'],
      [/0[xX][0-9a-fA-F]+/, 'number.hex'],
      [/0[bB][01]+/, 'number.binary'],
      [/\d+/, 'number'],

      // Identifiers and keywords
      [/[a-zA-Z_]\w*/, {
        cases: {
          '@keywords': 'keyword',
          '@typeKeywords': 'type',
          '@default': 'identifier',
        },
      }],

      // Whitespace
      [/\s+/, 'white'],

      // Comments
      [/#.*$/, 'comment'],

      // Delimiters
      [/[{}()\[\]]/, '@brackets'],
      [/[;,]/, 'delimiter'],

      // Operators
      [
        /@symbols/,
        {
          cases: {
            '@operators': 'operator',
            '@default': '',
          },
        },
      ],
    ],

    annotation: [
      [/[a-zA-Z_]\w*/, 'keyword'],
      ['', '', '@pop'],
    ],

    string_triple_double: [
      [/[^"]+/, 'string'],
      [/"""$/, 'string', '@pop'],
      [/"/, 'string'],
    ],

    string_triple_single: [
      [/[^']+/, 'string'],
      [/'''$/, 'string', '@pop'],
      [/'/, 'string'],
    ],

    nodepath: [
      [/[a-zA-Z_]\w*/, 'type'],
      [/\//, 'delimiter'],
      ['', '', '@pop'],
    ],
  },
};

// ─── Completion Items ────────────────────────────────────────────────────────

export function getGDScriptCompletions(): languages.CompletionItem[] {
  const items: languages.CompletionItem[] = [];

  // Keywords
  for (const kw of KEYWORDS) {
    items.push({
      label: kw,
      kind: 14, // monaco.languages.CompletionItemKind.Keyword
      insertText: kw,
      detail: 'Ключевое слово GDScript',
    });
  }

  // Built-in types
  for (const t of BUILT_IN_TYPES) {
    items.push({
      label: t,
      kind: 6, // monaco.languages.CompletionItemKind.Class
      insertText: t,
      detail: 'Встроенный тип',
    });
  }

  // Built-in functions
  for (const fn of BUILT_IN_FUNCTIONS) {
    items.push({
      label: fn,
      kind: 1, // monaco.languages.CompletionItemKind.Function
      insertText: fn.endsWith('(') ? fn : `${fn}($0)`,
      insertTextRules: 4, // InsertTextRule.InsertAsSnippet
      detail: 'Встроенная функция',
    });
  }

  // Node methods
  for (const m of NODE_METHODS) {
    items.push({
      label: m,
      kind: 2, // monaco.languages.CompletionItemKind.Method
      insertText: m.startsWith('_') ? m : `${m}($0)`,
      insertTextRules: 4,
      detail: 'Метод Node',
    });
  }

  // Godot classes
  for (const cls of GODOT_CLASSES) {
    items.push({
      label: cls,
      kind: 6,
      insertText: cls,
      detail: 'Класс Godot',
    });
  }

  return items;
}

// ─── Snippet Completions ─────────────────────────────────────────────────────

export function getGDScriptSnippets(): languages.CompletionItem[] {
  return [
    {
      label: 'func _ready',
      kind: 15, // Snippet
      insertText: 'func _ready():\n\t$0',
      detail: 'Функция готовности узла',
    },
    {
      label: 'func _process',
      kind: 15,
      insertText: 'func _process(delta: float) -> void:\n\t$0',
      detail: 'Функция кадра',
    },
    {
      label: 'func _physics_process',
      kind: 15,
      insertText: 'func _physics_process(delta: float) -> void:\n\t$0',
      detail: 'Функция физического кадра',
    },
    {
      label: 'func _input',
      kind: 15,
      insertText: 'func _input(event: InputEvent) -> void:\n\t$0',
      detail: 'Функция ввода',
    },
    {
      label: 'extends',
      kind: 15,
      insertText: 'extends ${1:Node2D}\n\n$0',
      detail: 'Наследование от класса',
    },
    {
      label: 'var',
      kind: 15,
      insertText: 'var ${1:name}: ${2:Type} = ${3:value}',
      detail: 'Переменная с типом',
    },
    {
      label: 'signal',
      kind: 15,
      insertText: 'signal ${1:signal_name}(${2:args})',
      detail: 'Объявление сигнала',
    },
    {
      label: 'export var',
      kind: 15,
      insertText: '@export var ${1:name}: ${2:Type} = ${3:value}',
      detail: 'Экспортируемая переменная',
    },
    {
      label: 'onready var',
      kind: 15,
      insertText: '@onready var ${1:name} = $${2:NodePath}',
      detail: 'Onready переменная с путём узла',
    },
    {
      label: 'if-elif-else',
      kind: 15,
      insertText: 'if ${1:condition}:\n\t$0\nelif ${2:condition}:\n\t\nelse:\n\t',
      detail: 'Условная конструкция',
    },
    {
      label: 'for-in',
      kind: 15,
      insertText: 'for ${1:i} in range(${2:0}, ${3:10}):\n\t$0',
      detail: 'Цикл for с range',
    },
    {
      label: 'for-element',
      kind: 15,
      insertText: 'for ${1:element} in ${2:array}:\n\t$0',
      detail: 'Цикл for по коллекции',
    },
    {
      label: 'while',
      kind: 15,
      insertText: 'while ${1:condition}:\n\t$0',
      detail: 'Цикл while',
    },
    {
      label: 'match',
      kind: 15,
      insertText: 'match ${1:value}:\n\t${2:pattern}:\n\t\t$0\n\t_:\n\t\t',
      detail: 'Match-выражение',
    },
    {
      label: 'class',
      kind: 15,
      insertText: 'class_name ${1:ClassName}\nextends ${2:Node}\n\n$0',
      detail: 'Объявление класса',
    },
    {
      label: 'connect',
      kind: 15,
      insertText: '${1:node}.${2:signal_name}.connect(${3:callback})',
      detail: 'Подключение сигнала (Godot 4)',
    },
    {
      label: 'await',
      kind: 15,
      insertText: 'await ${1:get_tree()}.create_timer(${2:1.0}).timeout',
      detail: 'Ожидание таймера',
    },
    {
      label: 'print debug',
      kind: 15,
      insertText: 'print("${1:debug}: ", ${2:value})',
      detail: 'Отладочный вывод',
    },
    {
      label: 'Input.is_action',
      kind: 15,
      insertText: 'Input.is_action_pressed("${1:action_name}")',
      detail: 'Проверка ввода',
    },
    {
      label: 'move_and_slide',
      kind: 15,
      insertText: 'velocity = ${1:Vector2.ZERO}\n$0\nmove_and_slide()',
      detail: 'Движение персонажа 2D',
    },
  ];
}
