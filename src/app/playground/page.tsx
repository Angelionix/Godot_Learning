import type { Metadata } from 'next';
import PlaygroundClient from './playground-client';

export const metadata: Metadata = {
  title: 'GDScript Playground — Godot Learning',
  description: 'Интерактивная среда для практики GDScript. Пишите код, запускайте и проверяйте челленджи прямо в браузере.',
};

export default function PlaygroundPage() {
  return <PlaygroundClient />;
}
