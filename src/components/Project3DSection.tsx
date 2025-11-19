import React, { useState, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'

interface Project3DSectionProps {
  project: {
    id: string
    title: string
    description: string
    category: string
    technologies: string[]
    liveUrl?: string
    githubUrl?: string
  }
  children: React.ReactNode
  isVisible: boolean
}

const Project3DSection: React.FC<Project3DSectionProps> = ({ project, children, isVisible }) => {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null)

  return (
    <div 
      className="relative w-full h-screen"
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100
        
        // Zones de détection pour les annotations
        if (x > 70 && y < 30) setHoveredZone('tech')
        else if (x < 30 && y < 30) setHoveredZone('title')
        else if (x < 30 && y > 70) setHoveredZone('category')
        else if (x > 70 && y > 70) setHoveredZone('links')
        else setHoveredZone(null)
      }}
      onMouseLeave={() => setHoveredZone(null)}
    >
      {/* Canvas 3D plein écran */}
      {isVisible && (
        <Canvas
          camera={{ position: [0, 2, 5], fov: 50 }}
          className="absolute inset-0"
          gl={{ alpha: true, antialias: true, preserveDrawingBuffer: false }}
        >
          <color attach="background" args={['transparent']} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <Suspense fallback={null}>
            {children}
            <Environment preset="sunset" />
          </Suspense>
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.5}
          />
        </Canvas>
      )}

      {/* Annotations style igloo.inc */}
      {/* Titre - Haut gauche */}
      <div 
        className={`absolute top-20 left-8 transition-all duration-300 ${
          hoveredZone === 'title' ? 'opacity-100 scale-110' : 'opacity-70'
        }`}
      >
        <div className="relative">
          <div className="absolute -inset-2 bg-purple-600/20 blur-xl"></div>
          <div className="relative bg-black/50 backdrop-blur-md border border-purple-500/30 p-4 rounded-lg max-w-md">
            <span className="text-purple-400 text-xs font-mono uppercase tracking-wider block mb-1">
              {project.id}
            </span>
            <h3 className="text-2xl font-bold text-white">
              {project.title}
            </h3>
            {hoveredZone === 'title' && (
              <p className="text-sm text-gray-300 mt-2">
                {project.description}
              </p>
            )}
          </div>
          {/* Ligne de connexion */}
          <svg className="absolute -right-16 top-1/2 -translate-y-1/2 w-16 h-1 pointer-events-none opacity-50">
            <line x1="0" y1="0" x2="64" y2="0" stroke="rgba(139, 92, 246, 0.5)" strokeWidth="1" />
          </svg>
        </div>
      </div>

      {/* Technologies - Haut droite */}
      <div 
        className={`absolute top-20 right-8 transition-all duration-300 ${
          hoveredZone === 'tech' ? 'opacity-100 scale-110' : 'opacity-70'
        }`}
      >
        <div className="relative">
          <div className="absolute -inset-2 bg-purple-600/20 blur-xl"></div>
          <div className="relative bg-black/50 backdrop-blur-md border border-purple-500/30 p-4 rounded-lg">
            <span className="text-purple-400 text-xs font-mono uppercase tracking-wider block mb-2">
              Technologies
            </span>
            <div className="flex flex-wrap gap-2 max-w-xs">
              {project.technologies.slice(0, hoveredZone === 'tech' ? undefined : 3).map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1 bg-purple-600/30 border border-purple-500/50 rounded text-xs text-white whitespace-nowrap"
                >
                  {tech}
                </span>
              ))}
              {hoveredZone !== 'tech' && project.technologies.length > 3 && (
                <span className="text-purple-400 text-xs">+{project.technologies.length - 3}</span>
              )}
            </div>
          </div>
          {/* Ligne de connexion */}
          <svg className="absolute -left-16 top-1/2 -translate-y-1/2 w-16 h-1 pointer-events-none opacity-50">
            <line x1="0" y1="0" x2="64" y2="0" stroke="rgba(139, 92, 246, 0.5)" strokeWidth="1" />
          </svg>
        </div>
      </div>

      {/* Catégorie - Bas gauche */}
      <div 
        className={`absolute bottom-20 left-8 transition-all duration-300 ${
          hoveredZone === 'category' ? 'opacity-100 scale-110' : 'opacity-70'
        }`}
      >
        <div className="relative">
          <div className="absolute -inset-2 bg-purple-600/20 blur-xl"></div>
          <div className="relative bg-black/50 backdrop-blur-md border border-purple-500/30 px-4 py-2 rounded-lg">
            <span className="text-purple-400 text-sm font-mono uppercase tracking-wider">
              {project.category}
            </span>
          </div>
        </div>
      </div>

      {/* Actions - Bas droite */}
      {(project.liveUrl || project.githubUrl) && (
        <div 
          className={`absolute bottom-20 right-8 transition-all duration-300 ${
            hoveredZone === 'links' ? 'opacity-100 scale-110' : 'opacity-70'
          }`}
        >
          <div className="relative">
            <div className="absolute -inset-2 bg-purple-600/20 blur-xl"></div>
            <div className="relative bg-black/50 backdrop-blur-md border border-purple-500/30 p-4 rounded-lg flex gap-3">
              <span className="text-purple-400 text-xs font-mono uppercase tracking-wider mr-2">
                Actions
              </span>
              {project.liveUrl && project.liveUrl !== 'private' && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm text-white font-semibold transition-all"
                >
                  Voir
                </a>
              )}
              {project.githubUrl && project.githubUrl !== 'private' && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white font-semibold transition-all"
                >
                  GitHub
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Project3DSection
