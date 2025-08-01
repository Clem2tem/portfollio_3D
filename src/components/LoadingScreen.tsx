import React from 'react'

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-gray-900 via-blue-900 to-black flex items-center justify-center z-50">
      <div className="text-center">
        <div className="relative">
          {/* Animation de loading circulaire */}
          <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          
          {/* Îlot animé */}
          <div className="w-8 h-8 bg-green-600 rounded-full animate-float mx-auto mb-4 relative">
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"></div>
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-green-800 rounded-full"></div>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">
          Chargement de l'univers nocturne...
        </h1>
        <p className="text-blue-200 text-sm">
          Préparation de l'île interactive
        </p>
      </div>
    </div>
  )
}

export default LoadingScreen
