import React, { useEffect, useState } from 'react'

interface Particle {
  id: number
  x: number
  y: number
  life: number
  opacity: number
  size: number
}

export const cursorPointerEvent = new EventTarget();

const CustomCursor: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [particles, setParticles] = useState<Particle[]>([])
  const [isMoving, setIsMoving] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [isPointer, setIsPointer] = useState(false)
  const [isPointerForce, setIsPointerForce] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState<boolean | null>(null)

  /* --------------------------- Detect Touch Devices --------------------------- */
  useEffect(() => {
    const checkTouchDevice = () => {
      const ua = navigator.userAgent.toLowerCase()
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua)
      const isMobileScreen = window.innerWidth <= 1024
      const isPrimaryTouch = window.matchMedia('(pointer: coarse)').matches
      return isMobileUA || (isMobileScreen && isPrimaryTouch)
    }
    setIsTouchDevice(checkTouchDevice())
  }, [])

  useEffect(() => {
    const enter = () => { console.log("Cursor Pointer Enter"); setIsPointerForce(true) }
    const leave = () => { console.log("Cursor Pointer Leave"); setIsPointerForce(false) }

    cursorPointerEvent.addEventListener("enter", enter)
    cursorPointerEvent.addEventListener("leave", leave)
    console.log("Cursor Pointer Event Listeners Added");

    return () => {
      cursorPointerEvent.removeEventListener("enter", enter)
      cursorPointerEvent.removeEventListener("leave", leave)
    }
  }, [])

  /* ----------------------- Cursor Movement & Particles ----------------------- */
  useEffect(() => {
    let moveTimeout: NodeJS.Timeout
    let particleCounter = 0

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
      setIsMoving(true)

      if (particleCounter % 3 === 0) {
        const newParticle: Particle = {
          id: Date.now() + Math.random(),
          x: e.clientX + (Math.random() - 0.5) * 30,
          y: e.clientY + (Math.random() - 0.5) * 30,
          life: 1,
          opacity: Math.random() * 0.8 + 0.2,
          size: Math.random() * 3 + 1
        }
        setParticles(prev => [...prev.slice(-12), newParticle])
      }
      particleCounter++

      clearTimeout(moveTimeout)
      moveTimeout = setTimeout(() => setIsMoving(false), 150)
    }

    const handleMouseEnter = () => setIsVisible(true)
    const handleMouseLeave = () => setIsVisible(false)

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseenter', handleMouseEnter)
    document.addEventListener('mouseleave', handleMouseLeave)

    /* ----------------------------- Particle Drift ----------------------------- */
    const animateParticles = () => {
      setParticles(prev =>
        prev
          .map(p => ({
            ...p,
            life: p.life - 0.03,
            opacity: p.opacity * 0.96,
            y: p.y - 0.5
          }))
          .filter(p => p.life > 0)
      )
    }

    const interval = setInterval(animateParticles, 16)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseenter', handleMouseEnter)
      document.removeEventListener('mouseleave', handleMouseLeave)
      clearInterval(interval)
      clearTimeout(moveTimeout)
    }
  }, [])

  /* ------------------- Detect "pointer" (clickable elements) ------------------ */
  useEffect(() => {
    const detectPointer = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const clickable =
        target.closest('[data-cursor="pointer"]') ||
        target.closest('.cursor-pointer') ||
        target.closest("[data-cursor]") ||
        ['A', 'BUTTON'].includes(target.tagName)

      setIsPointer(Boolean(clickable))
    }

    window.addEventListener('mousemove', detectPointer)
    return () => window.removeEventListener('mousemove', detectPointer)
  }, [])

  /* ----------------------------- Click Explosion ----------------------------- */
  const handleClick = (e: MouseEvent) => {
    const burstParticles: Particle[] = Array.from({ length: 20 }).map(() => ({
      id: Date.now() + Math.random(),
      x: e.clientX + (Math.random() - 0.5) * 10,
      y: e.clientY + (Math.random() - 0.5) * 10,
      life: 1,
      opacity: 1,
      size: Math.random() * 4 + 2
    }))
    setParticles(prev => [...prev, ...burstParticles])
  }

  useEffect(() => {
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  /* ------------------------------ No cursor on Mobile ----------------------------- */
  if (isTouchDevice === true) return null
  if (!isVisible) return null

  /* ---------------------------------- Render ---------------------------------- */
  return (
    <div className="pointer-events-none fixed inset-0 z-[999999999]" style={{ cursor: 'none' }}>

      {/* Main Cursor */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform"
        style={{
          left: mousePosition.x,
          top: mousePosition.y,
          width: isPointer || isPointerForce ? 50 : isMoving ? 40 : 32,
          height: isPointer || isPointerForce ? 50 : isMoving ? 40 : 32,
        }}
      >
        <div
          className="w-full h-full rounded-full backdrop-blur-sm border-2 transition-transform flex items-center justify-center"
          style={{
            borderColor: isPointer || isPointerForce ? '#00eaff' : 'rgba(147,51,234,0.6)',
            backgroundColor: isPointer || isPointerForce ? 'rgba(0,234,255,0.12)' : 'rgba(147,51,234,0.1)',
            boxShadow: isPointer
              ? '0 0 12px rgba(0,234,255,0.7)'
              : '0 0 8px rgba(147,51,234,0.5)'
          }}
        >
          {/* Center dot */}
          <div
            className="rounded-full transition-transform"
            style={{
              width: isPointer || isPointerForce ? 6 : 4,
              height: isPointer || isPointerForce ? 6 : 4,
              backgroundColor: isPointer || isPointerForce ? '#00eaff' : '#a855f7'
            }}
          />
        </div>
      </div>

      {/* Particles */}
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(circle, rgba(147,51,234,1), rgba(59,130,246,0.3))`,
            boxShadow: `0 0 ${p.size * 2}px rgba(59,130,246,${p.opacity * 0.6})`
          }}
        />
      ))}

    </div>
  )
}

export default CustomCursor
