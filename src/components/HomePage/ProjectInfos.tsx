import React, { useState, useEffect } from 'react';
import { projects } from '../../data/projects';


const ProjectDetailsPanel: React.FC<{ project: string, className?: string }> = ({ project, className = "" }) => {
    const [activeTab, setActiveTab] = useState<'challenge' | 'solution' | 'features' | 'learnings'>('challenge');

    // Réinitialise l'onglet sur "Défi" à chaque fois que le projet change
    useEffect(() => {
        setActiveTab('challenge');
    }, [project]);

    return (
        <div className={`${className}`}>
            <div
              id="controls-panel"
              className="mt-3 p-3 bg-black/50 backdrop-blur-md rounded-lg border border-white/5 text-white shadow-lg w-s h-[350px] overflow-y-auto"
            >
              {/* Tabs header */}
              <div className="flex gap-2 mb-3">
                <button
                  className={`px-2 py-1 rounded-md text-sm ${activeTab === 'challenge' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                  onClick={() => setActiveTab('challenge')}
                >🎯 Défi</button>
                <button
                  className={`px-2 py-1 rounded-md text-sm ${activeTab === 'solution' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                  onClick={() => setActiveTab('solution')}
                >💡 Solution</button>
                <button
                  className={`px-2 py-1 rounded-md text-sm ${activeTab === 'features' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                  onClick={() => setActiveTab('features')}
                >✨ Fonctionnalités</button>
                <button
                  className={`px-2 py-1 rounded-md text-sm ${activeTab === 'learnings' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                  onClick={() => setActiveTab('learnings')}
                >📚 Apprentissages</button>
              </div>

              <div className="text-gray-300">
                {activeTab === 'challenge' && (
                  <div>
                    <h4 className="font-semibold text-white mb-2">🎯 Défi</h4>
                    <p className="text-gray-300">{projects.find(p => p.id === project)?.details.challenge}</p>
                  </div>
                )}

                {activeTab === 'solution' && (
                  <div>
                    <h4 className="font-semibold text-white mb-2">💡 Solution</h4>
                    <p className="text-gray-300">{projects.find(p => p.id === project)?.details.solution}</p>
                  </div>
                )}

                {activeTab === 'features' && (
                  <div>
                    <h4 className="font-semibold text-white mb-2">✨ Fonctionnalités</h4>
                    <ul className="list-disc list-inside text-gray-300 space-y-1">
                      {projects.find(p => p.id === project)?.details.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {activeTab === 'learnings' && (
                  <div>
                    <h4 className="font-semibold text-white mb-2">📚 Apprentissages</h4>
                    <ul className="list-disc list-inside text-gray-300 space-y-1">
                      {projects.find(p => p.id === project)?.details.learnings.map((learning, index) => (
                        <li key={index}>{learning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
    );
};

export default ProjectDetailsPanel;