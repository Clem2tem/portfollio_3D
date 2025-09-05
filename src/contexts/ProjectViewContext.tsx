import React, { createContext, useContext, useState } from 'react'
import { Project } from '../types/Project'

type ProjectViewContextType = {
  viewedProject: Project | null
  setViewedProject: (p: Project | null) => void
}

const ProjectViewContext = createContext<ProjectViewContextType | undefined>(undefined)

export const ProjectViewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [viewedProject, setViewedProject] = useState<Project | null>(null)
  return (
    <ProjectViewContext.Provider value={{ viewedProject, setViewedProject }}>
      {children}
    </ProjectViewContext.Provider>
  )
}

export const useProjectView = (): ProjectViewContextType => {
  const ctx = useContext(ProjectViewContext)
  if (!ctx) throw new Error('useProjectView must be used inside ProjectViewProvider')
  return ctx
}

export default ProjectViewContext
