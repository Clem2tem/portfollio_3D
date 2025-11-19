import { useEffect, useRef, useCallback } from 'react'
import Lenis, { LenisOptions } from '@studio-freight/lenis'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export type ScrollTarget = number | string | HTMLElement
type ScrollToConfig = Parameters<Lenis['scrollTo']>[1]

interface SmoothScrollController {
  scrollTo: (target: ScrollTarget, options?: ScrollToConfig) => void
}

const useSmoothScroll = (options?: Partial<LenisOptions>): SmoothScrollController => {
  const lenisRef = useRef<Lenis | null>(null)
  const frameRef = useRef<number | null>(null)
  const scrollY = useRef(0)

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.3,
      lerp: 0.08,
      smoothWheel: true,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      ...options
    })

    lenisRef.current = lenis

    const handleScroll = ({ scroll }: { scroll: number }) => {
      scrollY.current = scroll
      ScrollTrigger.update()
    }

    lenis.on('scroll', handleScroll)

    const raf = (time: number) => {
      lenis.raf(time)
      frameRef.current = requestAnimationFrame(raf)
    }

    frameRef.current = requestAnimationFrame(raf)

    ScrollTrigger.scrollerProxy(document.body, {
      scrollTop(value) {
        if (value !== undefined) {
          lenis.scrollTo(value, { immediate: true })
        }
        return scrollY.current
      },
      getBoundingClientRect() {
        return {
          top: 0,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight
        }
      }
    })

    ScrollTrigger.defaults({ scroller: document.body })
    ScrollTrigger.refresh()

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
      lenis.off('scroll', handleScroll)
      lenis.destroy()
    }
  }, [options])

  const scrollTo = useCallback<SmoothScrollController['scrollTo']>((target, opts) => {
    if (!lenisRef.current) return
    const extra = (opts || {}) as ScrollToConfig
    lenisRef.current.scrollTo(target, {
      offset: -120,
      duration: 1.2,
      ...extra
    })
  }, [])

  return { scrollTo }
}

export default useSmoothScroll
