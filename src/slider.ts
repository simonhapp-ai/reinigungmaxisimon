/** Vorher/Nachher-Regler: ein unsichtbarer <input type="range"> steuert die CSS-Variable --pos. */
export function initSliders(root: ParentNode = document) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  root.querySelectorAll<HTMLElement>('[data-ba]').forEach((el) => {
    const range = el.querySelector<HTMLInputElement>('.ba-range')
    if (!range) return
    const set = (v: number) => el.style.setProperty('--pos', `${v}%`)
    range.addEventListener('input', () => set(range.valueAsNumber))
    set(range.valueAsNumber)

    if (reduceMotion) return
    // Einmal kurz "anstupsen", sobald der Regler sichtbar wird – zeigt, dass man ziehen kann.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect()
        nudge(range, set)
      },
      { threshold: 0.6 },
    )
    io.observe(el)
  })
}

function nudge(range: HTMLInputElement, set: (v: number) => void) {
  const keyframes = [50, 70, 30, 50]
  const duration = 1600
  const start = performance.now()
  let touched = false
  range.addEventListener('pointerdown', () => (touched = true), { once: true })

  const tick = (now: number) => {
    if (touched) return
    const t = Math.min((now - start) / duration, 1)
    const seg = Math.min(Math.floor(t * (keyframes.length - 1)), keyframes.length - 2)
    const local = t * (keyframes.length - 1) - seg
    const ease = 0.5 - Math.cos(local * Math.PI) / 2
    const v = keyframes[seg] + (keyframes[seg + 1] - keyframes[seg]) * ease
    range.value = String(v)
    set(v)
    if (t < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}
