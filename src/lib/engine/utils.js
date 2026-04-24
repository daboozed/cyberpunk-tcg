export function shuffle(arr) {
  const copy = [...arr];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
 
  return copy;
}

export function clone(o) {
  return JSON.parse(JSON.stringify(o));
}

export function uid() {
  return Math.random().toString(36).slice(2);
}
