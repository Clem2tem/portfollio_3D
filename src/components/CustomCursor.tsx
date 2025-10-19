import React, { useEffect, useState } from 'react'

interface Particle {
  id: number
  x: number
  y: number
  life: number
  opacity: number
  size: number
}

const CustomCursor: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [particles, setParticles] = useState<Particle[]>([])
  const [isMoving, setIsMoving] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [isTouchDevice, setIsTouchDevice] = useState<boolean | null>(null)

  // Detect touch device (smartphones and tablets only, not touch-enabled PCs)
  useEffect(() => {
    const checkTouchDevice = () => {
      // Check if it's a mobile/tablet device based on user agent
      const userAgent = navigator.userAgent.toLowerCase()
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i.test(userAgent)
      
      // Check screen size (typical mobile/tablet sizes)
      const isMobileScreen = window.innerWidth <= 1024
      
      // Check if primary input is touch (not just touch capability)
      const isPrimaryTouch = window.matchMedia('(pointer: coarse)').matches
      
      // It's a mobile/tablet if:
      // 1. Mobile user agent detected, OR
      // 2. Small screen AND primary input is touch
      return isMobileUA || (isMobileScreen && isPrimaryTouch)
    }
    setIsTouchDevice(checkTouchDevice())
  }, [])

  useEffect(() => {
    let moveTimeout: NodeJS.Timeout
    let particleCounter = 0

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
      setIsMoving(true)

      // Créer des particules lors du mouvement
      if (particleCounter % 3 === 0) { // Une particule tous les 3 mouvements pour ne pas surcharger
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

    // Animation des particules
    const animateParticles = () => {
      setParticles(prev => 
        prev
          .map(particle => ({
            ...particle,
            life: particle.life - 0.025,
            opacity: particle.opacity * 0.96,
            y: particle.y - 0.5 // Les particules montent légèrement
          }))
          .filter(particle => particle.life > 0)
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

  // Don't render custom cursor on touch devices
  if (isTouchDevice === true) return null
  
  // Render cursor (including when isTouchDevice is still null or false)
  if (!isVisible) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[999999999]" style={{ cursor: 'none' }}>
      {/* Curseur principal */}
      <div
        className={`absolute transform -translate-x-1/2 -translate-y-1/2`}
        style={{
          left: mousePosition.x,
          top: mousePosition.y,
          transition: 'width 0.1s, height 0.1s',
          width: isMoving ? 40 : 32,
          height: isMoving ? 40 : 32,
        }}
      >
        {/* Cercle extérieur */}
        <div className="w-full h-full rounded-full border-2 border-purple-500/60 bg-purple-500/10 backdrop-blur-sm relative">
          {/* Point central */}
          <div className="w-2 h-2 bg-purple-500 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-lg shadow-blue-400/50" />
          {/* Ring animé */}
          <div className={`absolute inset-0 rounded-full border border-blue-300/40 ${isMoving ? 'animate-ping' : ''}`} />
        </div>
      </div>

      {/* Particules */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-gradient-to-r from-purple-500 to-indigo-300"
          style={{
            left: particle.x,
            top: particle.y,
            opacity: particle.opacity,
            width: particle.size,
            height: particle.size,
            transform: 'translate(-50%, -50%)',
            boxShadow: `0 0 ${particle.size * 2}px rgba(59, 130, 246, ${particle.opacity * 0.5})`
          }}
        />
      ))}
    </div>
  )
}

export default CustomCursor
