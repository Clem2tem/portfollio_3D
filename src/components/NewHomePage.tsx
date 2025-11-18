import React, { useState, useEffect, useRef, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import AnimatedBackground from './AnimatedBackground'
import ContactModal from './ContactModal'
import HospitalGLTF from './HospitalGLTF'
import House from './House'
import ExcavatorGLTF from './ExcavatorGLTF'
import POPClemStatic from './POPClemStatic'
import Portal from './Portal'
import { projects } from '../data/projects'

interface HomePageProps {
  onEnter3DMode: () => void
}

interface SectionProps {
  children: React.ReactNode | ((isVisible: boolean) => React.ReactNode)
  className?: string
  delay?: number
}

const ScrollSection: React.FC<SectionProps> = ({ children, className = '', delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => setIsVisible(true), delay)
          }
        })
      },
      { threshold: 0.2 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current)
      }
    }
  }, [delay])

  return (
    <div
      ref={sectionRef}
      className={`min-h-screen flex items-center justify-center transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
      } ${className}`}
    >
      {typeof children === 'function' ? children(isVisible) : children}
    </div>
  )
}

const NewHomePage: React.FC<HomePageProps> = ({ onEnter3DMode }) => {
  const [showContact, setShowContact] = useState(false)
  const [activeSection, setActiveSection] = useState(0)
  
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([])

  const sections = [
    { id: 'hero', label: 'Accueil' },
    { id: 'about', label: 'À propos' },
    ...projects.map((p, i) => ({ id: `project-${i}`, label: p.title })),
    { id: 'popclem', label: 'Avatar' },
    { id: 'portal', label: 'Portail' },
    { id: 'cta', label: 'Contact' }
  ]

  useEffect(() => {
    const observers = sectionRefs.current.map((ref, index) => {
      if (!ref) return null
      
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveSection(index)
            }
          })
        },
        { threshold: 0.5 }
      )
      
      observer.observe(ref)
      return observer
    })

    return () => {
      observers.forEach((observer, index) => {
        if (observer && sectionRefs.current[index]) {
          observer.unobserve(sectionRefs.current[index]!)
        }
      })
    }
  }, [])

  const scrollToSection = (index: number) => {
    sectionRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const technologies = [
    { name: 'React', icon: '/logos/React.png' },
    { name: 'TypeScript', icon: '/logos/TypeScript.svg' },
    { name: 'Next.js', icon: '/logos/Next.js.png' },
    { name: 'Node.js', icon: '/logos/Node.js.png' },
    { name: 'Firebase', icon: '/logos/Firebase.png' },
    { name: 'Supabase', icon: '/logos/Supabase.png' }
  ]

  return (
    <div className="relative overflow-y-auto h-screen">
      <AnimatedBackground />
      
      {/* Stepper Navigation */}
      <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col gap-4">
        {sections.map((section, index) => (
          <button
            key={section.id}
            onClick={() => scrollToSection(index)}
            className="group flex items-center gap-3"
            title={section.label}
          >
            <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {section.label}
            </span>
            <div className={`w-3 h-3 rounded-full border-2 transition-all ${
              activeSection === index
                ? 'bg-purple-500 border-purple-500 scale-125'
                : 'border-gray-600 hover:border-purple-400'
            }`} />
          </button>
        ))}
      </div>
      
      {/* Navigation fixe */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-8 py-6 flex justify-between items-center backdrop-blur-md bg-black/20">
        <h1 className="text-2xl font-bold text-white">Clément De Temmerman</h1>
        <button
          onClick={() => setShowContact(true)}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition-all hover:scale-105"
        >
          Contact
        </button>
      </nav>

      {/* Hero Section */}
      <ScrollSection>
        <div ref={el => { sectionRefs.current[0] = el }} className="relative z-10 text-center px-6 max-w-6xl mx-auto">
          <div className="relative inline-block">
            <h1 
              className="text-7xl md:text-9xl font-bold text-white mb-6"
              style={{
                textShadow: '0 0 80px rgba(139, 92, 246, 0.5)'
              }}
            >
              Développeur
            </h1>
            <h2 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent mb-8">
              Fullstack
            </h2>
          </div>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Je crée des expériences web modernes et performantes avec une attention particulière 
            portée au design et à l'expérience utilisateur.
          </p>
        </div>
      </ScrollSection>

      {/* About Section */}
      <ScrollSection delay={100}>
        <div ref={el => { sectionRefs.current[1] = el }} className="relative z-10 px-6 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
                À propos
              </h2>
              <p className="text-lg text-gray-300 leading-relaxed mb-6">
                Avec 22 ans et une passion pour le développement, je me spécialise dans la création 
                d'applications web complètes utilisant les technologies les plus récentes.
              </p>
              <p className="text-lg text-gray-300 leading-relaxed">
                Mon approche combine créativité technique et rigueur professionnelle pour livrer 
                des solutions qui dépassent les attentes.
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-3xl blur-xl"></div>
              <div className="relative bg-gray-900/50 backdrop-blur-sm border border-purple-500/30 rounded-3xl p-8">
                <h3 className="text-2xl font-bold text-white mb-6">Technologies</h3>
                <div className="grid grid-cols-3 gap-4">
                  {technologies.map((tech) => (
                    <div
                      key={tech.name}
                      className="flex flex-col items-center gap-2 p-4 bg-gray-800/50 rounded-xl hover:bg-gray-700/50 transition-all hover:scale-110 cursor-pointer"
                    >
                      <img src={tech.icon} alt={tech.name} className="w-12 h-12 object-contain" />
                      <span className="text-xs text-gray-300 text-center">{tech.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollSection>

      {/* Projects Section */}
      {projects.map((project, index) => (
        <ScrollSection key={project.id} delay={index * 50}>
          {(isVisible) => (
          <div ref={el => { sectionRefs.current[2 + index] = el }} className="relative z-10 px-6 max-w-6xl mx-auto w-full">
            <div className={`grid md:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
              <div className={index % 2 === 1 ? 'md:order-2' : ''}>
                <span className="text-purple-400 text-sm font-semibold uppercase tracking-wider">
                  {project.category}
                </span>
                <h3 className="text-4xl md:text-5xl font-bold text-white mt-2 mb-4">
                  {project.title}
                </h3>
                <p className="text-lg text-gray-300 leading-relaxed mb-6">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {project.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="px-4 py-2 bg-purple-600/20 border border-purple-500/30 rounded-full text-sm text-purple-300"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <div className="flex gap-4">
                  {project.liveUrl && project.liveUrl !== 'private' && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition-all hover:scale-105"
                    >
                      Voir le projet
                    </a>
                  )}
                  {project.githubUrl && project.githubUrl !== 'private' && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-white font-semibold transition-all hover:scale-105"
                    >
                      GitHub
                    </a>
                  )}
                </div>
              </div>
              <div className={`relative ${index % 2 === 1 ? 'md:order-1' : ''}`}>
                <div className="absolute inset-0 overflow-visible w-[100dvw] h-[100dvh]"></div>
                <div className="relative overflow-visible group">
                  <div className="absolute inset-0 transition-all"></div>
                  {isVisible && (
                    <Canvas
                      camera={{ position: [0, 5, 5], fov: 50 }}
                      style={{ width: '100%', height: '100%' }}
                      gl={{ alpha: true, antialias: true, preserveDrawingBuffer: false }}
                    >
                      <Suspense fallback={null}>
                        {index === 0 && <HospitalGLTF position={[0, -1, 0]} />}
                        {index === 1 && (
                          <group scale={0.8}>
                            <House position={[-2, -1, 0]} />
                            <ExcavatorGLTF position={[2, -1, 0]} />
                          </group>
                        )}
                        <Environment preset="sunset" />
                      </Suspense>
                      <OrbitControls
                        enableZoom={false}
                        enablePan={false}
                      />
                    </Canvas>
                  )}
                </div>
              </div>
            </div>
          </div>
          )}
        </ScrollSection>
      ))}

      {/* POPClem Section */}
      <ScrollSection delay={100}>
        {(isVisible) => (
        <div ref={el => { sectionRefs.current[2 + projects.length] = el }} className="relative z-10 px-6 max-w-6xl mx-auto w-full">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-purple-400 text-sm font-semibold uppercase tracking-wider">
                Avatar 3D
              </span>
              <h3 className="text-4xl md:text-5xl font-bold text-white mt-2 mb-4">
                POPClem
              </h3>
              <p className="text-lg text-gray-300 leading-relaxed mb-6">
                Mon avatar 3D personnalisé qui m'accompagne dans cette aventure virtuelle.
              </p>
            </div>
            <div className="relative md:order-1">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-3xl blur-2xl"></div>
              <div className="relative aspect-video bg-gray-900/50 backdrop-blur-sm border border-purple-500/30 rounded-3xl overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent group-hover:from-purple-600/20 transition-all"></div>
                {isVisible && (
                  <Canvas
                    camera={{ position: [0, 1, 3], fov: 50 }}
                    style={{ width: '100%', height: '100%' }}
                    gl={{ alpha: true, antialias: true, preserveDrawingBuffer: false }}
                  >
                    <color attach="background" args={['transparent']} />
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[5, 5, 5]} intensity={1} />
                    <Suspense fallback={null}>
                      <group position={[0, -1, 0]}>
                        <POPClemStatic />
                      </group>
                      <Environment preset="sunset" />
                    </Suspense>
                    <OrbitControls
                      enableZoom={false}
                      enablePan={false}
                      autoRotate
                      autoRotateSpeed={2}
                    />
                  </Canvas>
                )}
              </div>
            </div>
          </div>
        </div>
        )}
      </ScrollSection>

      {/* Portal Section */}
      <ScrollSection delay={150}>
        {(isVisible) => (
        <div ref={el => { sectionRefs.current[3 + projects.length] = el }} className="relative z-10 px-6 max-w-6xl mx-auto w-full">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="md:order-2">
              <span className="text-purple-400 text-sm font-semibold uppercase tracking-wider">
                Navigation 3D
              </span>
              <h3 className="text-4xl md:text-5xl font-bold text-white mt-2 mb-4">
                Le Portail
              </h3>
              <p className="text-lg text-gray-300 leading-relaxed mb-6">
                La porte d'entrée vers mon univers 3D interactif.
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-3xl blur-2xl"></div>
              <div className="relative aspect-video bg-gray-900/50 backdrop-blur-sm border border-purple-500/30 rounded-3xl overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent group-hover:from-purple-600/20 transition-all"></div>
                {isVisible && (
                  <Canvas
                    camera={{ position: [0, 2, 8], fov: 50 }}
                    style={{ width: '100%', height: '100%' }}
                    gl={{ alpha: true, antialias: true, preserveDrawingBuffer: false }}
                  >
                    <color attach="background" args={['transparent']} />
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[5, 5, 5]} intensity={1} />
                    <Suspense fallback={null}>
                      <group position={[0, 0, 0]}>
                        <Portal />
                      </group>
                      <Environment preset="sunset" />
                    </Suspense>
                    <OrbitControls
                      enableZoom={false}
                      enablePan={false}
                      autoRotate
                      autoRotateSpeed={1}
                    />
                  </Canvas>
                )}
              </div>
            </div>
          </div>
        </div>
        )}
      </ScrollSection>




      {/* CTA Section */}
      <ScrollSection delay={100}>
        <div ref={el => { sectionRefs.current[4 + projects.length] = el }} className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-7xl font-bold text-white mb-8">
            Prêt à explorer ?
          </h2>
          <p className="text-xl text-gray-300 mb-12">
            Découvrez mes projets en 3D dans une expérience immersive
          </p>
          <button
            onClick={onEnter3DMode}
            className="group relative px-12 py-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl text-white text-xl font-bold transition-all hover:scale-110 hover:shadow-2xl hover:shadow-purple-500/50"
          >
            <span className="relative z-10">Entrer dans le monde 3D</span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-pink-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
        </div>
      </ScrollSection>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 text-center border-t border-gray-800">
        <p className="text-gray-400">
          © 2024 Clément De Temmerman - Tous droits réservés
        </p>
      </footer>

      {showContact && <ContactModal onClose={() => setShowContact(false)} />}
    </div>
  )
}

export default NewHomePage
