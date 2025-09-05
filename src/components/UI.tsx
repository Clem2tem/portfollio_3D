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

      {/* Instructions de navigation */}
      <div className="absolute bottom-6 left-6 z-40">
        <div className="bg-black/50 backdrop-blur-sm text-white p-4 rounded-lg max-w-xs">
          <h3 className="font-semibold mb-2">Navigation</h3>
          <ul className="text-sm space-y-1">
            <li>🖱️ Clic gauche + glisser : Rotation caméra</li>
            <li>🔄 Molette : Rotation de l'île</li>
            <li>👆 Survol : Bulle d'informations</li>
            <li>🎯 Clic : Détails du projet</li>
          </ul>
        </div>
      </div>

      {/* Boutons de navigation */}
      <div className="absolute bottom-6 right-6 z-40 flex gap-2">
        <button className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-colors">
          ←
        </button>
        <button className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-colors">
          →
        </button>
      </div>

      {/* Instructions de contrôle */}
      <div className="absolute bottom-4 left-4 z-40">
        <div className="bg-black/50 backdrop-blur-sm text-white p-3 rounded-lg space-y-1 text-sm">
          <div><kbd className="bg-white/20 px-2 py-1 rounded">WASD</kbd> Se déplacer</div>
          <div><kbd className="bg-white/20 px-2 py-1 rounded">SPACE</kbd> Sauter</div>
          <div><kbd className="bg-white/20 px-2 py-1 rounded">H</kbd> Afficher/masquer hitboxes</div>
          <div><kbd className="bg-white/20 px-2 py-1 rounded">J</kbd> Cycle île/objets/toutes</div>
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
