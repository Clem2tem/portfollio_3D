import React, { useEffect, useState } from 'react'
import { Project } from '../types/Project'

interface ProjectPopupProps {
  project: Project
  onClose: () => void
}

const ProjectPopup: React.FC<ProjectPopupProps> = ({ project, onClose }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Animation d'entrée
    setTimeout(() => setIsVisible(true), 10)
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300) // Délai pour l'animation de sortie
  }

  const getBuildingIcon = (type: string) => {
    const icons = {
      hospital: '🏥',
      office: '🏢',
      house: '🏠',
      tower: '🗼',
      factory: '🏭',
      school: '🏫'
    }
    return icons[type as keyof typeof icons] || '🏗️'
  }

  return (
    <div className="popup-overlay" onClick={handleClose}>
      <div 
        className={`popup-content ${isVisible ? 'show' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{getBuildingIcon(project.buildingType)}</span>
                <h2 className="text-2xl font-bold text-gray-900">{project.title}</h2>
              </div>
              <p className="text-gray-600">{project.description}</p>
            </div>
            <button 
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Technologies */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Technologies utilisées</h3>
          <div className="flex flex-wrap gap-2">
            {project.technologies.map((tech, index) => (
              <span 
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Détails */}
        <div className="p-6 space-y-6">
          {/* Challenge */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">🎯 Défi</h3>
            <p className="text-gray-700">{project.details.challenge}</p>
          </div>

          {/* Solution */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">💡 Solution</h3>
            <p className="text-gray-700">{project.details.solution}</p>
          </div>

          {/* Features */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">✨ Fonctionnalités clés</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              {project.details.features.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </div>

          {/* Learnings */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">📚 Apprentissages</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              {project.details.learnings.map((learning, index) => (
                <li key={index}>{learning}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 flex gap-4">
          {project.liveUrl && (
            <a 
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-blue-600 text-white text-center py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              🌐 Voir le projet
            </a>
          )}
          {project.githubUrl && (
            <a 
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-gray-800 text-white text-center py-3 px-6 rounded-lg hover:bg-gray-900 transition-colors font-medium"
            >
              📂 Code source
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProjectPopup
