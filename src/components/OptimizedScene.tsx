import React from 'react'
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor'
import Lighting from './Lighting'
import Island from './Island'
import Room from './Room'
import Desk from './Desk'
import POPClemStatic from './POPClemStatic'
import ProjectBuildings from './ProjectBuildings'
import Portal from './Portal'
import { Environment } from '@react-three/drei'

const OptimizedScene: React.FC = () => {
  const performanceSettings = usePerformanceMonitor()

  return (
    <>
      <Lighting enableShadows={performanceSettings.enableShadows} />
      <Island />
      <Room />
      <Desk />
      <POPClemStatic />
      <ProjectBuildings />
      <Environment 
        files="/hdri/office.hdr" 
        environmentIntensity={0.15} 
        background={false} 
        backgroundIntensity={0.8} 
        blur={0.05} 
      />
      <Portal />
    </>
  )
}

export default OptimizedScene
