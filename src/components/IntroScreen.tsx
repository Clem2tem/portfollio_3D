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
      className="fixed z-[9999999] flex items-center justify-center bg-gradient-to-br from-gray-950 via-black to-gray-900 backdrop-blur-sm transition-transform duration-1000 ease-in-out"
      style={{
        transform: isComplete ? 'translateY(-100%)' : 'translateY(0)',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
        minHeight: '100vh', // Dynamic viewport height for mobile
        height: '100vh',
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
        transform: translate(-50%, -200px);
      }
    }

    @keyframes fadeOutSmallMobile {
      0% {
        opacity: 1;
        transform: translate(-50%, -50%);
      }
      100% {
        opacity: 0;
        transform: translate(-50%, -100px);
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

    @media (max-width: 640px) {
      .animate-fadeout-small {
        animation: fadeOutSmallMobile 1.4s ease-in-out 3.3s forwards !important;
      }
    }
  `}</style>

          {/* Bonjour */}
          <p
            className="text-[80px] sm:text-[200px] lg:text-[300px] text-purple-500 font-bold leading-tight sm:leading-relaxed absolute top-[50dvh] left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center"
            style={{
              animation: 'fadeOut 1.4s ease-in-out 0.3s forwards',
            }}
          >
            Bonjour
          </p>

          {/* Moi c'est Clément */}
          <p
            className="text-[24px] sm:text-[50px] lg:text-[70px] text-white/80 leading-tight sm:leading-relaxed absolute top-[50dvh] left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 px-6 sm:px-4 text-center animate-fadeout-small w-full"
            style={{
              animation:
                'fadeIn 1.4s cubic-bezier(0.25, 0.1, 0.25, 1) 0.8s forwards, fadeOutSmall 1.4s ease-in-out 3.3s forwards',
            }}
          >
            Moi c'est <span className="text-[#FFC82A] font-bold">Clément</span> <br className="sm:hidden" />et je suis <br />
            <span className="text-purple-500 font-bold">Développeur Fullstack</span>
          </p>

          <p
            className="text-[18px] sm:text-[40px] lg:text-[70px] text-white/80 leading-tight sm:leading-relaxed absolute top-[50dvh] left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 px-6 sm:px-4 text-center w-full max-w-[95vw] sm:max-w-none mx-auto"
            style={{
              animation:
                'fadeIn 1.8s cubic-bezier(0.25, 0.1, 0.25, 1) 3.7s forwards',
            }}
          >
            <span className="block sm:inline">Vous pourrez accéder</span>
            <span className="block sm:inline"> à mon portfolio</span>
            <span className="block sm:inline"> après ce petit{' '}</span>
            <span className="relative inline-block font-bold whitespace-nowrap">
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
