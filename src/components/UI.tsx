import React, { useState } from 'react'
import ProjectPopup from './ProjectPopup'
import ContactModal from './ContactModal'
import { Project } from '../types/Project'

interface UIProps {
  isNightMode: boolean
  setIsNightMode: (value: boolean) => void
}

const UI: React.FC<UIProps> = ({ isNightMode, setIsNightMode }) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
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

      {/* Popup de projet */}
      {selectedProject && (
        <ProjectPopup
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}

      {/* Modal de contact */}
      {showContactModal && (
        <ContactModal onClose={() => setShowContactModal(false)} />
      )}
    </>
  )
}

export default UI
