// event and observable

export function Eve() {
  const call = subs => value => { for (const fn of subs) fn(value) }
  Eve = (data, opts) => {
    const subs = new Set()
    const on = fn => (subs.add(fn), () => subs.delete(fn))
    const next = () => new Promise(once)
    const once = fn => subs.add(function $(prev, next) {
      fn(prev, next)
      subs.delete($)
    })
    if (data === undefined) return { next, once, on, trigger: call(subs) }
    return {
      once,
      next,
      get: () => data,
      on: fn => (fn(data), on(fn)),
      set: (next, force) => {
        if (force || next === data) return
        const prev = data
              data = next
        for (const fn of subs) fn(next, prev)
      },
    }
  }

  return Eve()
}
