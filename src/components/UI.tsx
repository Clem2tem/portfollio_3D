import React, { useState } from 'react'
import ProjectPopup from './ProjectPopup'
import { Project } from '../types/Project'

const UI: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  return (
    <>
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-40 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white drop-shadow-lg">
              Mon Portfolio 3D
            </h1>
            <p className="text-white/80 text-sm drop-shadow">
              Explorez mes projets dans cet univers interactif
            </p>
          </div>
          
          <div className="flex gap-4">
            <button className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors">
              À propos
            </button>
            <button className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors">
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

      {/* Popup de projet */}
      {selectedProject && (
        <ProjectPopup 
          project={selectedProject} 
          onClose={() => setSelectedProject(null)}
        />
      )}
    </>
  )
}

export default UI
