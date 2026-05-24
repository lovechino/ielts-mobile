import type { Href } from 'expo-router';

export function href(path: string): Href {
  return path as Href;
}
