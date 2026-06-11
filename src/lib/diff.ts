import { diffWords } from 'diff';

import type { DiffChunk } from '@/store/useStore';

export function computeDiff(original: string, edited: string): DiffChunk[] {
  return diffWords(original, edited).map((part) => ({
    type: part.added ? 'insert' : part.removed ? 'delete' : 'equal',
    value: part.value,
  }));
}
