import React from 'react'
import { useLoading } from '../contexts/LoadingContext'

interface IntroScreenProps {
  onEnterPortfolio: () => void
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onEnterPortfolio }) => {
  const { progress } = useLoading()

  const clampedProgress = React.useMemo(() => Math.min(Math.max(progress, 0), 100), [progress])
  const isComplete = clampedProgress >= 100

  // Auto-hide screen when loading is complete
  React.useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(() => {
        onEnterPortfolio()
      }, 1000) // Wait 1 second after completion before sliding up
      return () => clearTimeout(timer)
    }
  }, [isComplete, onEnterPortfolio])

  return (
    <div 
      className="fixed inset-0 z-[9999999] flex items-center justify-center bg-gradient-to-br from-gray-950 via-black to-gray-900 backdrop-blur-sm transition-transform duration-1000 ease-in-out"
      style={{
        transform: isComplete ? 'translateY(-100%)' : 'translateY(0)'
      }}
    >

      {/* Contenu principal */}
      <div className="relative z-10 w-full p-6 h-full">

        {/* Description */}
        <div className="max-w-full mx-auto mb-12 text-center h-full justify-center relative overflow-hidden">
          <style>{`
    @keyframes fadeOut {
      0% {
        opacity: 1;
        transform: translate(-50%, -50%);
      }
      100% {
        opacity: 0;
        transform: translate(-50%, -120%);
      }
    }

    @keyframes fadeOutSmall {
      0% {
        opacity: 1;
        transform: translate(-50%, -50%);
      }
      100% {
        opacity: 0;
        transform: translate(-50%, -300px);
      }
    }

    @keyframes fadeIn {
      0% {
        opacity: 0;
        transform: translate(-50%, 20%);
      }
      100% {
        opacity: 1;
        transform: translate(-50%, -50%);
      }
    }
  `}</style>

          {/* Bonjour */}
          <p
            className="text-[120px] sm:text-[200px] lg:text-[300px] text-purple-500 font-bold leading-relaxed absolute top-[50dvh] left-[50dvw] -translate-x-1/2 -translate-y-1/2"
            style={{
              animation: 'fadeOut 1.4s ease-in-out 0.3s forwards',
            }}
          >
            Bonjour
          </p>

          {/* Moi c'est Clément */}
          <p
            className="text-[28px] sm:text-[50px] lg:text-[70px] text-white/80 leading-relaxed absolute top-[50dvh] left-[50dvw] -translate-x-1/2 -translate-y-1/2 opacity-0 px-4 text-center"
            style={{
              animation:
                'fadeIn 1.4s cubic-bezier(0.25, 0.1, 0.25, 1) 0.8s forwards, fadeOutSmall 1.4s ease-in-out 3.3s forwards',
            }}
          >
            Moi c'est <span className="text-[#FFC82A] font-bold">Clément</span> et je suis <br />
            <span className="text-purple-500 font-bold">Développeur Fullstack</span>
          </p>

          <p
            className="text-[20px] sm:text-[40px] lg:text-[70px] text-white/80 leading-relaxed absolute top-[50dvh] left-[50dvw] -translate-x-1/2 -translate-y-1/2 opacity-0 px-4 text-center max-w-[95vw] sm:max-w-none"
            style={{
              animation:
                'fadeIn 1.8s cubic-bezier(0.25, 0.1, 0.25, 1) 3.7s forwards',
            }}
          >
            <span className="block sm:inline">Vous pourrez accéder à mon portfolio</span>
            <span className="block sm:inline"> après ce petit{' '}</span>
            <span className="relative inline-block font-bold">
              <span className="text-white/25">chargement</span>
              <span
                aria-hidden={true}
                className="absolute inset-0 text-[#FFC82A]"
                style={{
                  clipPath: `inset(0 ${100 - clampedProgress}% 0 0)`
                }}
              >
                chargement
              </span>
            </span>
          </p>
        </div>


      </div>
    </div>
  )
}

export default IntroScreen
