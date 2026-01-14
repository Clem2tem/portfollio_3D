import React from 'react'

interface ContactModalProps {
  onClose: () => void
}

const ContactModal: React.FC<ContactModalProps> = ({ onClose }) => {


  return (
    <div 
      className='fixed bg-black/80 backdrop-blur-md z-[99999] flex items-center justify-center p-4'
      style={{
        top: 'env(safe-area-inset-top)',
        left: 'env(safe-area-inset-left)',
        right: 'env(safe-area-inset-right)',
        bottom: 'env(safe-area-inset-bottom)',
      }}
    > 
    <button
            onClick={onClose}
            className="absolute text-white/70 hover:text-white text-3xl font-bold transition-colors duration-300  right-4 md:right-8 top-4 md:top-6 z-[9999]"
          >
            ×
          </button>
    <div className="relative w-full max-w-[90vw] md:max-w-[1200px] max-h-[85vh] overflow-hidden">
      {/* Fond animé avec particules */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full animate-float-particles"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${6 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>
      

      {/* Contenu principal avec scroll */}
      <div className="relative z-10 w-full h-full overflow-y-auto p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
        {/* Header avec bouton fermer */}
        <div className="flex justify-between items-center mb-6 md:mb-8">
          <div className="text-center flex-1">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 md:mb-4 animate-fade-in-up">
              Contactez-moi
            </h1>
            <p className="text-base md:text-xl text-white/80 animate-fade-in-up animation-delay-300">
              Une question ? Un projet ? N'hésitez pas à me contacter !
            </p>
          </div>
        </div>

        {/* Formulaire de contact */}
        <div className="space-y-4 md:space-y-6 animate-fade-in-up animation-delay-600">

          {/* Informations de contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-4 text-center">
            {/* Téléphone */}
            <a
              href="tel:+33615651016"
              className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white/20 hover:scale-105 transition-transform duration-300 group  flex flex-col items-center"
              aria-label="Appeler le numéro"
            >
              <div className="text-xl md:text-2xl mb-1 md:mb-2">📱</div>
              <h3 className="text-white font-semibold mb-1 text-sm md:text-base">Téléphone</h3>
              <p className="text-white/70 text-xs md:text-sm">+33 6 15 65 10 16</p>
            </a>
            {/* Email */}
            <a
              href="mailto:cldetemmerman@icloud.com"
              className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white/20 hover:scale-105 transition-transform duration-300 group  flex flex-col items-center"
              aria-label="Envoyer un email"
            >
              <div className="text-xl md:text-2xl mb-1 md:mb-2">📧</div>
              <h3 className="text-white font-semibold mb-1 text-sm md:text-base">Email</h3>
              <p className="text-white/70 text-xs md:text-sm">cldetemmerman@icloud.com</p>
            </a>
            <a
              href="https://www.linkedin.com/in/cl%C3%A9ment-de-temmerman-8975882a0/"
              className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white/20 hover:scale-105 transition-transform duration-300 group  flex flex-col items-center"
              aria-label="Voir le profil LinkedIn"
              target="_blank"
              rel="noopener noreferrer"
            >
                <div className="text-xl md:text-2xl mb-1 md:mb-2">💼</div>
                <h3 className="text-white font-semibold mb-1 text-sm md:text-base">LinkedIn</h3>
                <p className="text-white/70 text-xs md:text-sm">Clément DE TEMMERMAN</p>
            </a>
            <a
              href="https://github.com/clem2tem"
              className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white/20 hover:scale-105 transition-transform duration-300 group  flex flex-col items-center"
              aria-label="Voir le profil GitHub"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="text-xl md:text-2xl mb-1 md:mb-2">🚀</div>
              <h3 className="text-white font-semibold mb-1 text-sm md:text-base">GitHub</h3>
              <p className="text-white/70 text-xs md:text-sm">@clem2tem</p>
            </a>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}

export default ContactModal
