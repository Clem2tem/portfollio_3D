import React from 'react'

interface IntroScreenProps {
  onEnterPortfolio: () => void
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onEnterPortfolio }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-purple-900/30 via-blue-900/30 to-indigo-900/30 backdrop-blur-sm">
      {/* Fond animé avec particules */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-400/20 via-transparent to-transparent animate-pulse"></div>
        {/* Particules flottantes */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/30 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Contenu principal */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Titre principal */}
        <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent mb-6 animate-fade-in-up">
          Mon Portfolio
        </h1>
        
        {/* Sous-titre */}
        <h2 className="text-2xl md:text-3xl text-white/90 font-light mb-8 animate-fade-in-up animation-delay-300">
          Développeur Full-Stack
        </h2>

        {/* Description */}
        <div className="max-w-2xl mx-auto mb-12 animate-fade-in-up animation-delay-600">
          <p className="text-lg md:text-xl text-white/80 leading-relaxed mb-6">
            Bienvenue dans mon univers interactif en 3D ! Chaque élément de cette île paradisiaque 
            représente une étape importante de mon parcours dans le développement.
          </p>
          <p className="text-base md:text-lg text-white/70">
            Explorez mes projets, découvrez mes compétences et plongez dans mon expérience 
            à travers une navigation immersive et intuitive.
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
          onClick={onEnterPortfolio}
          className="group relative px-12 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-lg rounded-full hover:from-purple-500 hover:to-blue-500 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 animate-fade-in-up animation-delay-1200"
        >
          <span className="relative z-10 flex items-center gap-3">
            Entrer dans le Portfolio
            <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
        </button>

        {/* Instructions subtiles */}
        <div className="mt-8 text-white/50 text-sm animate-fade-in-up animation-delay-1500">
          <p>Navigation : Souris pour explorer • Molette pour zoomer • Clic pour interagir</p>
        </div>
      </div>
    </div>
  )
}

export default IntroScreen
