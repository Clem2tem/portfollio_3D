import React from 'react'
import { useLoading } from '../contexts/LoadingContext'

interface IntroScreenProps {
  onEnterPortfolio: () => void
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onEnterPortfolio }) => {
  const { progress } = useLoading()

  const clampedProgress = React.useMemo(() => Math.min(Math.max(progress, 0), 100), [progress])
  const isComplete = clampedProgress >= 100

  return (
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center bg-gradient-to-br from-gray-950 via-black to-gray-900 backdrop-blur-sm">

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

    @keyframes nudgeRight {
      0%, 100% {
        transform: translateX(0);
      }
      50% {
        transform: translateX(10px);
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
            <span
              className="relative inline-block font-bold whitespace-nowrap transition-[padding-right] duration-500 ease-out"
              style={{ paddingRight: isComplete ? 'clamp(2rem, 5vw, 5rem)' : '0' }}
            >
              <span className="relative inline-block">
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
              <button
                type="button"
                onClick={onEnterPortfolio}
                aria-label="Entrer dans le portail"
                className="absolute right-0 top-1/2 flex -translate-y-1/2 items-center justify-center text-[#FFC82A] transition-transform hover:text-purple-400 active:scale-95"
                style={{
                  opacity: isComplete ? 1 : 0,
                  transform: isComplete ? 'translate(clamp(1rem, 3vw, 2rem), -50%)' : 'translate(2.5rem, -50%)',
                  pointerEvents: isComplete ? 'auto' : 'none',
                  transition: 'opacity 0.45s ease, transform 0.45s ease'
                }}
              >
                <span
                  className="transition-transform hover:scale-110"
                  style={{
                    animation: isComplete ? 'nudgeRight 1.4s ease-in-out infinite 0.4s' : 'none'
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 10 24 4"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-8 h-8 sm:w-16 sm:h-16 lg:w-24 lg:h-24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
                  </svg>
                </span>
              </button>
            </span>

          </p>
        </div>


      </div>
    </div>
  )
}

export default IntroScreen
