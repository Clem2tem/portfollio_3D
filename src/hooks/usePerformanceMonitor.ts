import { useEffect, useState, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'

interface PerformanceSettings {
  enableShadows: boolean
  enableAntialiasing: boolean
  dpr: number
  quality: 'low' | 'medium' | 'high'
}

export const usePerformanceMonitor = () => {
  const [settings, setSettings] = useState<PerformanceSettings>({
    enableShadows: true,
    enableAntialiasing: true,
    dpr: Math.min(window.devicePixelRatio, 2),
    quality: 'high'
  })

  const { gl } = useThree()
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(Date.now())

  useFrame(() => {
    frameCountRef.current++
      
    // Check FPS every 60 frames
    if (frameCountRef.current >= 60) {
      const currentTime = Date.now()
      const deltaTime = currentTime - lastTimeRef.current
      const currentFps = (60 * 1000) / deltaTime
      
      lastTimeRef.current = currentTime
      
      // Adjust quality based on FPS
      if (currentFps < 30 && settings.quality !== 'low') {
        console.log('🔻 Performance low, switching to low quality')
        setSettings({
          enableShadows: false,
          enableAntialiasing: false,
          dpr: 1,
          quality: 'low'
        })
      } else if (currentFps < 45 && settings.quality === 'high') {
        console.log('🔻 Performance medium, switching to medium quality')
        setSettings({
          enableShadows: true,
          enableAntialiasing: false,
          dpr: 1,
          quality: 'medium'
        })
      } else if (currentFps > 50 && settings.quality !== 'high') {
        console.log('🔺 Performance good, switching to high quality')
        setSettings({
          enableShadows: true,
          enableAntialiasing: true,
          dpr: Math.min(window.devicePixelRatio, 2),
          quality: 'high'
        })
      }
      
      frameCountRef.current = 0
    }
  })

  useEffect(() => {
    // Initial performance check based on device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    const hasLowMemory = (navigator as any).deviceMemory && (navigator as any).deviceMemory < 4
    
    if (isMobile || hasLowMemory) {
      console.log('📱 Mobile or low memory device detected, starting with medium quality')
      setSettings({
        enableShadows: false,
        enableAntialiasing: false,
        dpr: 1,
        quality: 'medium'
      })
    }
  }, [])

  useEffect(() => {
    // Apply DPR changes
    gl.setPixelRatio(settings.dpr)
  }, [settings.dpr, gl])

  return settings
}
