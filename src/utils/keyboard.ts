export function isImeComposing(event: KeyboardEvent, composing = false): boolean {
  return composing || event.isComposing || event.keyCode === 229;
}
