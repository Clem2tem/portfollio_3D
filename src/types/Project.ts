export interface Project {
  id: string
  title: string
  description: string
  technologies: string[]
  category: 'web' | 'mobile' | 'backend' | 'fullstack' | 'design'
  image?: string
  liveUrl?: string
  githubUrl?: string
  details: {
    challenge: string
    solution: string
    features: string[]
    learnings: string[]
  }
  position: [number, number, number] // Position 3D sur l'île
  buildingType: 'hospital' | 'office' | 'house' | 'tower' | 'factory' | 'school'
}
