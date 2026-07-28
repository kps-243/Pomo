/* Petit générateur de confettis maison (Canvas), sans dépendance. Respecte prefers-reduced-motion et se nettoie tout seul.*/
export function useConfetti() {
  function celebrate(originX = 0.5, originY = 0.4) {
    if (typeof window === 'undefined') return
    // Accessibilité : on ne lance rien si l'utilisateur a réduit les animations.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const width = window.innerWidth
    const height = window.innerHeight

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999'
    document.body.appendChild(canvas)

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      canvas.remove()
      return
    }
    const context = ctx

    // Couleurs de marque + une touche d'accent
    const colors = ['#22c1a1', '#4ed4b2', '#84e8c7', '#1ba889', '#f59e0b', '#ffffff']

    interface Particle {
      x: number
      y: number
      vx: number
      vy: number
      size: number
      color: string
      rot: number
      vr: number
    }

    const particles: Particle[] = []
    const count = 150
    const startX = width * originX
    const startY = height * originY

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 6 + Math.random() * 8
      particles.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        size: 5 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
      })
    }

    const gravity = 0.28
    const friction = 0.99
    const maxFrames = 180
    let frame = 0

    function tick() {
      context.clearRect(0, 0, width, height)
      frame += 1
      const fade = Math.max(0, 1 - frame / maxFrames)

      for (const p of particles) {
        p.vy += gravity
        p.vx *= friction
        p.vy *= friction
        p.x += p.vx
        p.y += p.vy
        p.rot += p.vr

        context.save()
        context.globalAlpha = fade
        context.translate(p.x, p.y)
        context.rotate(p.rot)
        context.fillStyle = p.color
        context.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
        context.restore()
      }

      if (frame < maxFrames) {
        requestAnimationFrame(tick)
      } else {
        canvas.remove()
      }
    }

    requestAnimationFrame(tick)
  }

  return { celebrate }
}
