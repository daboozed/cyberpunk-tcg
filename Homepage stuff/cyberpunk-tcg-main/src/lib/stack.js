export function createStack() {
  return [];
}

export function pushStack(state, item) {
  state.stack.push(item);
}

export function resolveStack(state) {
  while (state.stack.length > 0) {
    const item = state.stack.pop();
    item.resolve();
  }
}