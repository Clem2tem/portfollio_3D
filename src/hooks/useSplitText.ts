import { useEffect } from 'react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface SplitOptions {
  stagger?: number
  duration?: number
}

const useSplitText = (selector: string, options?: SplitOptions) => {
  useEffect(() => {
    const elements = gsap.utils.toArray<HTMLElement>(selector)
    const animations: gsap.core.Animation[] = []

    elements.forEach((element) => {
      const originalText = element.textContent || ''
      element.setAttribute('data-original', originalText)

      const tokens = originalText.split(/(\s+)/)
      element.innerHTML = ''

      tokens.forEach((token) => {
        if (token.trim() === '') {
          element.appendChild(document.createTextNode(token))
          return
        }

        const wordWrapper = document.createElement('span')
        wordWrapper.className = 'split-word'
        token.split('').forEach((char) => {
          const span = document.createElement('span')
          span.className = 'split-char'
          span.textContent = char
          wordWrapper.appendChild(span)
        })
        element.appendChild(wordWrapper)
      })

      const chars = element.querySelectorAll('.split-char')
      const animation = gsap.fromTo(
        chars,
        { yPercent: 120, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: options?.duration ?? 1,
          ease: 'power3.out',
          stagger: options?.stagger ?? 0.02,
          scrollTrigger: {
            trigger: element,
            start: 'top 80%'
          }
        }
      )

      animations.push(animation)
    })

    return () => {
      animations.forEach((animation) => animation.kill())
      elements.forEach((element) => {
        const original = element.getAttribute('data-original')
        if (original) {
          element.textContent = original
        }
      })
    }
  }, [selector, options?.duration, options?.stagger])
}

export default useSplitText
