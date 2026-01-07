let lastFn = Promise.resolve();
export const queue = (fn) => {
  lastFn = lastFn.then(fn).catch(() => {});
  return lastFn;
};
