import React, { useState } from 'react'
import ContactModal from './ContactModal'
import { useProjectView } from '../contexts/ProjectViewContext'

interface UIProps {
  isNightMode: boolean
  setIsNightMode: (value: boolean) => void
  onBackToHome?: () => void
}

const UI: React.FC<UIProps> = ({ isNightMode, setIsNightMode, onBackToHome }) => {
  // Use global project view state so camera-driven selection can show details here
  const { viewedProject, setViewedProject, setPanelVisible } = useProjectView()
  const [showContactModal, setShowContactModal] = useState(false)

  return (
    <>
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-40 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1
              className={`text-2xl font-bold leading-tight ${isNightMode ? 'text-gray-100 ' : 'text-gray-200'} drop-shadow-lg`}
              style={{ lineHeight: '1' }}
            >
              Clement's <br />Island
            </h1>
          </div>

          <div className="flex gap-4 items-center">
            {/* Bouton retour à l'accueil */}
            {onBackToHome && (
              <button
                onClick={onBackToHome}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
              >
                <span className="text-lg">🏠</span>
                <span className="font-semibold">Accueil</span>
              </button>
            )}

            {/* Bouton jour/nuit */}
            <button
              onClick={() => setIsNightMode(!isNightMode)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105"
              style={{
                background: isNightMode
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
              }}
            >
              <span className="text-lg">
                {isNightMode ? '☀️' : '🌙'}
              </span>
              <span className="text-white font-semibold">
                {isNightMode ? 'Mode Jour' : 'Mode Nuit'}
              </span>
            </button>

            <button className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors">
              À propos
            </button>
            <button
              onClick={() => setShowContactModal(true)}
              className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors"
            >
              Contact
            </button>
          </div>
        </div>
      </header>

      {/* Instructions de contrôle */}
      <div className="absolute bottom-6 left-6 z-40 w-s">
        <div
          id="controls-panel"
          className="mt-3 p-3 bg-black/50 backdrop-blur-md rounded-lg border border-white/5 text-white space-y-3 shadow-lg"
        >
          <div className="flex items-start gap-3">
            <div className="text-sm">
              <div className="font-semibold">Déplacement</div>
              <div className="text-xs text-white/70 flex gap-2 mt-1">
                <kbd className="bg-white/10 px-2 py-1 rounded">Z/W</kbd>
                <kbd className="bg-white/10 px-2 py-1 rounded">Q/A</kbd>
                <kbd className="bg-white/10 px-2 py-1 rounded">S</kbd>
                <kbd className="bg-white/10 px-2 py-1 rounded">D</kbd>
                <span className="ml-2 mt-1">Se déplacer</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="text-sm">
              <div className="font-semibold">Saut & Interaction</div>
              <div className="text-xs text-white/70 flex gap-3 mt-1">
                <div><kbd className="bg-white/10 px-2 py-1 mr-2 rounded">SPACE</kbd> Sauter</div>
                <div><kbd className="bg-white/10 px-2 py-1 mr-2 rounded">Clic</kbd> Interagir</div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="text-sm">
              <div className="font-semibold">Caméra</div>
              <div className="text-xs text-white/70 mt-1 flex items-center gap-3">
                <div><kbd className="bg-white/10 px-2 py-1 mr-2 rounded">Scroll</kbd> Zoom</div>
                <div className="ml-2">Maintenez clic gauche + déplacer pour orienter</div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between">
            <div className="text-xs text-white/60">Astuce : cliquez sur l&apos;icône d&apos;un b&acirc;timent pour voir le projet</div>
          </div>
        </div>
      </div>
      {viewedProject && (
        <>
          <div className="absolute left-6 top-1/2 transform -translate-y-3/4 z-40 min-w-[200px] max-w-xs">
            <div
              id="controls-panel"
              className="mt-3 p-3 bg-black/50 backdrop-blur-md rounded-lg border border-white/5 text-white space-y-3 shadow-lg w-s"
            >
              <h3 className="font-semibold text-white mb-3">Technologies</h3>
              {viewedProject.technologies.map((tech, index) => (
                <div key={index} className="flex items-center gap-3 bg-gray-700/40 p-2 rounded w-s">
                  <img src={`/logos/${tech.replace(/\s+/g, '_')}.png`} alt={tech} className="w-8 h-8 object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                  <span className="text-sm text-gray-200">{tech}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-40 min-w-[500px] max-w-lg">
            <div
              id="controls-panel"
              className="mt-3 p-3 bg-black/50 backdrop-blur-md rounded-lg border border-white/5 text-white space-y-3 shadow-lg w-s"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{(() => {
                      const icons: Record<string, string> = { hospital: '🏥', office: '🏢', house: '🏠', tower: '🗼', factory: '🏭', school: '🏫' }
                      return icons[viewedProject.buildingType] || '🏗️'
                    })()}</span>
                    <h2 className="text-2xl font-bold text-white">{viewedProject.title}</h2>
                  </div>
                  <p className="text-gray-300">{viewedProject.description}</p>
                </div>
                <button onClick={() => { setPanelVisible(false); setTimeout(() => setViewedProject(null), 220) }} className="text-gray-400 hover:text-white ml-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div className="absolute right-6 top-1/2 transform -translate-y-1/2 z-40 min-w-[200px] max-w-xs">
            <div
              id="controls-panel"
              className="mt-3 p-3 bg-black/50 backdrop-blur-md rounded-lg border border-white/5 text-white space-y-3 shadow-lg w-s"
            >
              <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-white mb-2">🎯 Défi</h3>
                    <p className="text-gray-300">{viewedProject.details.challenge}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-white mb-2">💡 Solution</h3>
                    <p className="text-gray-300">{viewedProject.details.solution}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-white mb-2">✨ Fonctionnalités</h3>
                    <ul className="list-disc list-inside text-gray-300 space-y-1">
                      {viewedProject.details.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-white mb-2">📚 Apprentissages</h3>
                    <ul className="list-disc list-inside text-gray-300 space-y-1">
                      {viewedProject.details.learnings.map((learning, index) => (
                        <li key={index}>{learning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
            </div>
          </div>
          
        </>
      )}

      {/* Modal de contact */}
      {showContactModal && (
        <ContactModal onClose={() => setShowContactModal(false)} />
      )}
    </>
  )
}

export default UI
