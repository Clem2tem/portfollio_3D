# Optimisations de Performance

Ce document explique les optimisations mises en place pour améliorer les performances du portfolio 3D, particulièrement sur les PC moins puissants.

## Optimisations Implémentées

### 1. Configuration WebGL Optimisée (`HomePage.tsx`)
- **powerPreference**: 'high-performance' - utilise le GPU dédié si disponible
- **antialias**: adaptatif selon les performances
- **alpha**: false - désactive le canal alpha inutile
- **stencil**: false - désactive le buffer stencil non utilisé
- **dpr**: limité à [1, 2] - évite les pixels trop nombreux sur écrans haute résolution

### 2. Optimisation des Ombres (`Lighting.tsx`)
- **Shadow Map**: résolution réduite à 1024x1024 (au lieu de 2048+)
- **Shadow Camera**: bounds optimisés (-20 à +20) pour couvrir uniquement la scène visible
- **Type**: PCFSoftShadowMap - bon compromis qualité/performance
- **Ombres désactivables**: peuvent être désactivées automatiquement sur PC faibles

### 3. Moniteur de Performance Automatique (`usePerformanceMonitor.ts`)

Le système détecte automatiquement les performances et ajuste la qualité :

#### Modes de Qualité
- **High** (FPS > 50): Ombres ON, Antialiasing ON, DPR auto (max 2)
- **Medium** (FPS 30-50): Ombres ON, Antialiasing OFF, DPR = 1
- **Low** (FPS < 30): Ombres OFF, Antialiasing OFF, DPR = 1

#### Détection Initiale
- Détecte automatiquement les appareils mobiles
- Vérifie la mémoire disponible (si < 4GB → mode Medium)
- Commence en mode Medium sur ces appareils

#### Ajustement Dynamique
- Mesure le FPS toutes les 60 frames (~1 seconde)
- Ajuste automatiquement la qualité sans intervention
- Logs dans la console pour le débogage

### 4. Chargement Progressif
- Le Canvas 3D ne se monte qu'après 5 secondes
- Permet au navigateur de charger les assets critiques d'abord
- L'écran d'intro masque le chargement

### 5. Contexte de Chargement Optimisé
- Utilise `requestAnimationFrame` pour les mises à jour
- Évite les warnings React "cannot update during render"
- Progression fluide de 0 à 100%

## Impact Attendu

### PC Puissants
- Qualité maximale maintenue
- FPS stables à 60+
- Toutes les fonctionnalités actives

### PC Moyens
- Ajustement automatique en Medium
- FPS stables entre 45-60
- Ombres conservées, antialiasing désactivé

### PC Faibles / Mobiles
- Passage automatique en Low
- FPS minimum de 30
- Expérience fluide sans ombres

## Tests Recommandés

1. **Test sur PC puissant**: Vérifier que le mode High est maintenu
2. **Test sur PC moyen**: Vérifier le passage en Medium
3. **Test sur mobile**: Vérifier le démarrage en Medium/Low
4. **Test de charge**: Ouvrir d'autres onglets pour simuler une charge GPU

## Surveillance

En mode développement, les logs suivants apparaissent dans la console :
- `📱 Mobile or low memory device detected, starting with medium quality`
- `🔻 Performance low, switching to low quality`
- `🔻 Performance medium, switching to medium quality`
- `🔺 Performance good, switching to high quality`

## Améliorations Futures Possibles

1. **Texture LOD**: Charger des textures basse résolution sur PC faibles
2. **Geometry LOD**: Simplifier les modèles 3D selon la distance/performance
3. **Occlusion Culling**: Ne rendre que les objets visibles
4. **Instance Rendering**: Pour les éléments répétitifs (arbres, rochers)
5. **Lazy Loading**: Charger les projets uniquement quand nécessaires
