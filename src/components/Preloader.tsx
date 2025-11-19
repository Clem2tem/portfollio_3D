import React from 'react'

interface PreloaderProps {
  isVisible: boolean
}

const Preloader: React.FC<PreloaderProps> = ({ isVisible }) => {
  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#030308] text-white transition-opacity duration-700 ease-out ${
        isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="flex items-center gap-3 text-xs uppercase tracking-[0.4em] text-purple-400 mb-6">
        <span className="h-1 w-6 bg-purple-500 animate-pulse" />
        Initialisation
        <span className="h-1 w-6 bg-purple-500 animate-pulse" />
      </div>
      <div className="relative text-4xl md:text-6xl font-semibold">
        <span className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-purple-500 to-pink-500" />
      </div>
      <div className="mt-8 w-48 h-[2px] bg-white/10 overflow-hidden">
        <div className="h-full w-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 animate-[loading_2s_ease-in-out_infinite]" />
      </div>
    </div>
  )
}

export default Preloader
