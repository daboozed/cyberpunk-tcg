export function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

export function clone(o) {
  return JSON.parse(JSON.stringify(o));
}

export function uid() {
  return Math.random().toString(36).slice(2);
}
