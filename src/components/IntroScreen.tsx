import React from 'react'
import { useLoading } from '../contexts/LoadingContext'

interface IntroScreenProps {
  onEnterPortfolio: () => void
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onEnterPortfolio }) => {
  const { progress, loaded } = useLoading()

  const [delayedLoaded, setDelayedLoaded] = React.useState(loaded)
              React.useEffect(() => {
                const id = setTimeout(() => setDelayedLoaded(loaded), 1000)
                return () => clearTimeout(id)
              }, [loaded])

  return (
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 backdrop-blur-sm">
      {/* Fond animé avec particules (positions calculées une seule fois pour éviter reset au re-render) */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-400/20 via-transparent to-transparent animate-pulse" />
        {/* Particules flottantes - générées une fois au montage */}
        {React.useMemo(() => {
          const particles = Array.from({ length: 20 }).map(() => ({
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            delay: `${Math.random() * 3}s`,
            duration: `${3 + Math.random() * 2}s`
          }))
          return particles.map((p, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/30 rounded-full animate-float"
              style={{
                left: p.left,
                top: p.top,
                animationDelay: p.delay,
                animationDuration: p.duration
              }}
            />
          ))
        // empty deps => generate once
        }, [])}
      </div>

      {/* Contenu principal */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Titre principal */}
        <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent mb-6 animate-fade-in-up">
          Clément
          <br />
          DE TEMMERMAN
        </h1>
        
        {/* Sous-titre */}
        <h2 className="text-2xl md:text-3xl text-white/90 font-light mb-8 animate-fade-in-up animation-delay-300">
          Ingénieur Logiciel / Développeur Full-Stack
        </h2>

        {/* Description */}
        <div className="max-w-2xl mx-auto mb-12 animate-fade-in-up animation-delay-600">
          <p className="text-lg md:text-xl text-white/80 leading-relaxed mb-6">
            Salut ! Je m'appelle Clément et je commence ma carrière de développeur Fullstack !
            Si vous êtes curieux de découvrir mon travail, et ses évolutions vous êtes au bon endroit !
          </p>
          <p className="text-base md:text-lg text-white/70">
            Explorez mes projets, découvrez mes compétences et plongez dans mon univers
            dans un monde en 3D intéractif.
          </p>
        </div>

        {/* Fonctionnalités */}
        <div className="grid md:grid-cols-3 gap-6 mb-12 animate-fade-in-up animation-delay-900">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-3xl mb-3">🏗️</div>
            <h3 className="text-lg font-semibold text-white mb-2">Projets Interactifs</h3>
            <p className="text-white/70 text-sm">Chaque bâtiment raconte l'histoire d'un projet unique</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-3xl mb-3">🌟</div>
            <h3 className="text-lg font-semibold text-white mb-2">Technologies</h3>
            <p className="text-white/70 text-sm">Découvrez les technologies que je maîtrise</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="text-lg font-semibold text-white mb-2">Expérience</h3>
            <p className="text-white/70 text-sm">Explorez mon parcours professionnel</p>
          </div>
        </div>

        {/* Bouton d'entrée */}
        <button
          onClick={() => { if (delayedLoaded) onEnterPortfolio() }}
          disabled={!delayedLoaded}
          className={`group relative px-12 py-4 text-white font-semibold text-lg rounded-full transition-all duration-300 shadow-lg animate-fade-in-up animation-delay-1200 ${loaded ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 hover:scale-105' : 'bg-gray-700/60 cursor-not-allowed'}`}
          aria-disabled={!delayedLoaded}
        >
          <span className="relative z-10 flex items-center gap-3">
            {delayedLoaded ? 'Entrez dans mon monde !' : `Chargement ${Math.round(progress)}%`}
            {delayedLoaded &&
            <svg className={`w-6 h-6 transition-transform duration-300 ${delayedLoaded ? 'group-hover:translate-x-1' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            }
          </span>

          {/* Progress fill visual */}
          <div className="absolute left-0 top-0 bottom-0 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 opacity-30 pointer-events-none"
            style={{ width: `${Math.min(Math.max(progress, 0), 100)}%`, transition: 'width 200ms linear' }}
          />
        </button>
      </div>
    </div>
  )
}

export default IntroScreen
