// Playground components barrel export
export { default as GDScriptEditor } from './gdscript-editor';
export { default as OutputConsole } from './output-console';
export { default as ChallengeResults } from './challenge-results';
export { default as InteractiveChallenge } from './interactive-challenge';
export {
  executeGDScript,
  validateCode,
  type InterpreterResult,
  type ChallengeValidation,
  type TestCase,
} from '@/lib/gdscript-interpreter';
