import React from 'react'

interface ContactModalProps {
  onClose: () => void
}

const ContactModal: React.FC<ContactModalProps> = ({ onClose }) => {


  return (
    <div 
      className='fixed bg-black/60 backdrop-blur-md z-50 flex items-center justify-center'
      style={{
        top: 'env(safe-area-inset-top)',
        left: 'env(safe-area-inset-left)',
        right: 'env(safe-area-inset-right)',
        bottom: 'env(safe-area-inset-bottom)',
      }}
    > 
    <div className="w-full max-w-[90vw] md:max-w-[1200px] max-h-[80vh] md:h-[600px] z-50 flex items-center justify-center bg-gradient-to-br/90 from-purple-900/90 via-blue-900/90 to-indigo-900/90 backdrop-blur-sm rounded-3xl border border-white/60 p-6">
      {/* Fond animé avec particules */}
      <div className="absolute inset-0 overflow-hidden">
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
      <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-3xl font-bold transition-colors duration-300 cursor-none right-12 top-6 absolute"
          >
            ×
          </button>

      {/* Contenu principal */}
      <div className="relative z-10 w-full max-w-2xl mx-4">
        {/* Header avec bouton fermer */}
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <h1 className="text-5xl font-bold text-white mb-4 animate-fade-in-up">
              Contactez-moi
            </h1>
            <p className="text-xl text-white/80 animate-fade-in-up animation-delay-300">
              Une question ? Un projet ? N'hésitez pas à me contacter !
            </p>
          </div>
        </div>

        {/* Formulaire de contact */}
        <div className="space-y-6 animate-fade-in-up animation-delay-600">

          {/* Informations de contact */}
          <div className="grid md:grid-cols-2 gap-4 my-8 text-center">
            {/* Téléphone */}
            <a
              href="tel:+33615651016"
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:scale-105 transition-transform duration-300 group cursor-none flex flex-col items-center"
              aria-label="Appeler le numéro"
            >
              <div className="text-2xl mb-2">📱</div>
              <h3 className="text-white font-semibold mb-1">Téléphone</h3>
              <p className="text-white/70 text-sm">+33 6 15 65 10 16</p>
            </a>
            {/* Email */}
            <a
              href="mailto:cldetemmerman@icloud.com"
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:scale-105 transition-transform duration-300 group cursor-none flex flex-col items-center"
              aria-label="Envoyer un email"
            >
              <div className="text-2xl mb-2">📧</div>
              <h3 className="text-white font-semibold mb-1">Email</h3>
              <p className="text-white/70 text-sm">cldetemmerman@icloud.com</p>
            </a>
            <a
              href="https://www.linkedin.com/in/cl%C3%A9ment-de-temmerman-8975882a0/"
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:scale-105 transition-transform duration-300 group cursor-none flex flex-col items-center"
              aria-label="Voir le profil LinkedIn"
              target="_blank"
              rel="noopener noreferrer"
            >
                <div className="text-2xl mb-2">💼</div>
                <h3 className="text-white font-semibold mb-1">LinkedIn</h3>
                <p className="text-white/70 text-sm">@monprofil</p>
            </a>
            <a
              href="https://github.com/clem2tem"
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:scale-105 transition-transform duration-300 group cursor-none flex flex-col items-center"
              aria-label="Voir le profil GitHub"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="text-2xl mb-2">🚀</div>
              <h3 className="text-white font-semibold mb-1">GitHub</h3>
              <p className="text-white/70 text-sm">@clem2tem</p>
            </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactModal
