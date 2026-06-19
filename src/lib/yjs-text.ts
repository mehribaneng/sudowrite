import { diffChars } from "diff";
import * as Y from "yjs";

export function applyLocalTextChange(
  ydoc: Y.Doc,
  ytext: Y.Text,
  nextText: string,
) {
  const previousText = ytext.toString();
  if (previousText === nextText) {
    return;
  }

  let prefixLength = 0;
  const sharedLength = Math.min(previousText.length, nextText.length);
  while (
    prefixLength < sharedLength &&
    previousText[prefixLength] === nextText[prefixLength]
  ) {
    prefixLength += 1;
  }

  let suffixLength = 0;
  while (
    suffixLength < previousText.length - prefixLength &&
    suffixLength < nextText.length - prefixLength &&
    previousText[previousText.length - 1 - suffixLength] ===
      nextText[nextText.length - 1 - suffixLength]
  ) {
    suffixLength += 1;
  }

  const deleteLength = previousText.length - prefixLength - suffixLength;
  const insertion = nextText.slice(prefixLength, nextText.length - suffixLength);

  ydoc.transact(() => {
    if (deleteLength > 0) {
      ytext.delete(prefixLength, deleteLength);
    }
    if (insertion) {
      ytext.insert(prefixLength, insertion);
    }
  }, "local-editor");
}

export function applyApprovedEdit(
  ydoc: Y.Doc,
  ytext: Y.Text,
  original: string,
  edited: string,
) {
  if (ytext.toString() !== original) {
    return false;
  }

  ydoc.transact(() => {
    let index = 0;

    for (const part of diffChars(original, edited)) {
      if (part.removed) {
        ytext.delete(index, part.value.length);
      } else if (part.added) {
        ytext.insert(index, part.value);
        index += part.value.length;
      } else {
        index += part.value.length;
      }
    }
  }, "ai-edit");

  return true;
}
