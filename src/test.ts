const s = AbortSignal.timeout(0)

console.log(s.aborted)

setTimeout(() => {
  console.log(s.aborted)
});