import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { Project } from '../types/Project'
import { projects } from '../data/projects'

type ProjectViewContextType = {
  viewedProject: Project | null
  setViewedProject: (p: Project | null) => void
  viewProjectById: (id: string | null) => void
  panelVisible: boolean
  setPanelVisible: (v: boolean) => void
}

const ProjectViewContext = createContext<ProjectViewContextType | undefined>(undefined)

export const ProjectViewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [viewedProject, setViewedProject] = useState<Project | null>(null)
  const [panelVisible, setPanelVisible] = useState(false)

  const viewProjectById = useCallback((id: string | null) => {
    if (!id) {
  setViewedProject(null)
  setPanelVisible(false)
      return
    }
    const found = projects.find(p => p.id === id)
    if (found) setViewedProject(found)
    else setViewedProject(null)
  }, [])

  // ensure panelVisible follows viewedProject in case other modules call setViewedProject directly
  useEffect(() => {
    if (viewedProject) setPanelVisible(true)
    else setPanelVisible(false)
  }, [viewedProject])

  // expose a lightweight debug helper on window for quick testing in the browser console
  useEffect(() => {
    try {
      ;(window as any).__viewProject = viewProjectById
    } catch (e) {}
    return () => {
      try { delete (window as any).__viewProject } catch (e) {}
    }
  }, [viewProjectById])

  return (
    <ProjectViewContext.Provider value={{ viewedProject, setViewedProject, viewProjectById, panelVisible, setPanelVisible }}>
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
