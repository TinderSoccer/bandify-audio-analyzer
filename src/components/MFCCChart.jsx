import { useEffect, useRef } from 'react'

export default function MFCCChart({ mfcc }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!mfcc || !ref.current) return
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const w = canvas.offsetWidth
    const h = canvas.offsetHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, w, h)
    const maxVal = Math.max(...mfcc.map(Math.abs), 1)
    const barW = w / mfcc.length

    mfcc.forEach((v, i) => {
      const norm = Math.abs(v) / maxVal
      const barH = norm * (h / 2 - 4)
      const x = i * barW + barW * 0.1
      const bw = barW * 0.8
      const alpha = 0.35 + norm * 0.65
      ctx.fillStyle = `rgba(83,74,183,${alpha.toFixed(2)})`
      if (v >= 0) ctx.fillRect(x, h / 2 - barH, bw, barH)
      else ctx.fillRect(x, h / 2, bw, -barH)
    })

    ctx.strokeStyle = 'rgba(83,74,183,0.25)'
    ctx.lineWidth = 0.5
    ctx.beginPath()
    ctx.moveTo(0, h / 2)
    ctx.lineTo(w, h / 2)
    ctx.stroke()
  }, [mfcc])

  return (
    <canvas
      ref={ref}
      style={{ width: '100%', height: 64, borderRadius: 4, display: 'block' }}
    />
  )
}
