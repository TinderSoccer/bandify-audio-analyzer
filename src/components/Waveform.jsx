import { useEffect, useRef } from 'react'

export default function Waveform({ rawSignal, color = '#534AB7' }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!rawSignal || !ref.current) return
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const w = canvas.offsetWidth
    const h = canvas.offsetHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#14141f'
    ctx.fillRect(0, 0, w, h)

    const step = Math.ceil(rawSignal.length / w)
    ctx.strokeStyle = color
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let i = 0; i < w; i++) {
      let max = 0
      for (let j = 0; j < step; j++) {
        const v = Math.abs(rawSignal[i * step + j] || 0)
        if (v > max) max = v
      }
      const amp = max * (h / 2 - 4)
      const cy = h / 2
      ctx.moveTo(i, cy - amp)
      ctx.lineTo(i, cy + amp)
    }
    ctx.stroke()

    // Center line
    ctx.strokeStyle = 'rgba(83,74,183,0.2)'
    ctx.lineWidth = 0.5
    ctx.beginPath()
    ctx.moveTo(0, h / 2)
    ctx.lineTo(w, h / 2)
    ctx.stroke()
  }, [rawSignal, color])

  return (
    <canvas
      ref={ref}
      style={{ width: '100%', height: 80, borderRadius: 6, display: 'block' }}
    />
  )
}
