import React from 'react'

interface SectionNavigationProps {
  sections: { id: string; label: string }[]
  activeId: string
  onSelect: (id: string) => void
}

const SectionNavigation: React.FC<SectionNavigationProps> = ({ sections, activeId, onSelect }) => {
  return (
    <div className="hidden xl:flex fixed right-10 top-1/2 -translate-y-1/2 z-40 flex-col gap-4 text-right items-end">
      {sections.map((section) => {
        const isActive = activeId === section.id
        return (
          <button
            key={section.id}
            type="button"
            onClick={() => onSelect(section.id)}
            className="group flex items-center gap-3 text-right"
          >
            <span className={`text-xs tracking-[0.3em] uppercase transition-opacity duration-300 ${
              isActive ? 'opacity-100 text-white' : 'opacity-0 group-hover:opacity-60 text-gray-400'
            }`}
            >
              {section.label}
            </span>
            <span
              className={`h-3 w-3 rounded-full border transition-all duration-300 ${
                isActive
                  ? 'border-purple-400 bg-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.8)] scale-125'
                  : 'border-white/30 group-hover:border-white/60'
              }`}
            />
          </button>
        )
      })}
    </div>
  )
}

export default SectionNavigation
