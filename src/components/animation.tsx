import React, { useEffect, useRef } from 'react'

interface AnimationProps {
  /** frames per second for playback */
  fps?: number
  /** total number of frames available in public/animation */
  frameCount?: number
  /** the file name prefix, e.g. 'Composition 1_' (the component will append zero-padded numbers and .png) */
  prefix?: string
  /** zero-based index of first frame (default 0) */
  startIndex?: number
  className?: string
  style?: React.CSSProperties
}

const zeroPad = (num: number, size: number) => {
  let s = String(num)
  while (s.length < size) s = '0' + s
  return s
}

/**
 * Simple sequence player / preloader using images from public/animation
 * Ex: prefix='Composition 1_' and frameCount=36 will request
 * /animation/Composition 1_00000.png ... Composition 1_00035.png
 */
const SequenceAnimation: React.FC<AnimationProps> = ({
  fps = 24,
  frameCount = 36,
  prefix = 'Composition 1_',
  startIndex = 0,
  className,
  style
}) => {
  // we just play the sequence in loop; no progress UI
  const playing = true
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const imagesRef = useRef<HTMLImageElement[]>([])
  const rafRef = useRef<number | null>(null)

  // Preload images
  useEffect(() => {
    let cancelled = false
    imagesRef.current = new Array(frameCount)

    for (let i = 0; i < frameCount; i++) {
      const idx = startIndex + i
      // Construct filename with 5-digit zero padding like 00000
      const fileName = `${prefix}${zeroPad(idx, 5)}.png`
      const url = `/animation/${fileName}`
      const img = new Image()
      img.src = url
      img.onload = () => {
        if (cancelled) return
        imagesRef.current[i] = img
      }
      img.onerror = () => {
        if (cancelled) return
        imagesRef.current[i] = img
      }
    }

    return () => { cancelled = true }
  }, [frameCount, prefix, startIndex])

  // Playback loop: draw to canvas
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d') || null
    if (!ctx) return
    let start = performance.now()
    let frame = 0
    const msPerFrame = 1000 / fps

    const loop = (t: number) => {
      if (!playing) return
      const elapsed = t - start
      frame = Math.floor(elapsed / msPerFrame) % Math.max(1, frameCount)
      const img = imagesRef.current[frame]
      if (img && img.complete && img.naturalWidth) {
        // Resize canvas to image if needed
        if (canvasRef.current!.width !== img.naturalWidth || canvasRef.current!.height !== img.naturalHeight) {
          canvasRef.current!.width = img.naturalWidth
          canvasRef.current!.height = img.naturalHeight
        }
        ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height)
        ctx.drawImage(img, 0, 0)
      }
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null }
  }, [fps, frameCount, playing])

  return (
    <div className={className} style={style}>
      <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
    </div>
  )
}

export default SequenceAnimation
