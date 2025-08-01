# 🏝️ Portfolio 3D Interactif

Un portfolio immersif en 3D présentant mes projets sous forme de bâtiments sur une île paradisiaque. Inspiré par l'univers d'Animal Crossing, cette expérience interactive permet de découvrir mes réalisations dans un environnement ludique et engageant.

## ✨ Fonctionnalités

- **🌴 Île circulaire 3D** - Navigation infinie autour d'une île tropicale
- **🏗️ Bâtiments interactifs** - Chaque projet représenté par un bâtiment thématique
- **💬 Tooltips dynamiques** - Informations au survol avec animations fluides
- **📱 Popups détaillés** - Descriptions complètes avec technologies et liens
- **🎮 Contrôles intuitifs** - Navigation à la souris/tactile naturelle
- **🌅 Atmosphère immersive** - Éclairage dynamique et environnement réaliste

## 🛠️ Technologies

### Frontend
- **React 18** - Interface utilisateur moderne
- **TypeScript** - Développement type-safe
- **Three.js** - Moteur 3D performant
- **React Three Fiber** - Intégration React/Three.js
- **React Three Drei** - Composants 3D utilitaires

### Styling & Build
- **Tailwind CSS** - Framework CSS utilitaire
- **Vite** - Build tool ultra-rapide
- **PostCSS** - Traitement CSS avancé

## 🚀 Installation et Lancement

```bash
# Installation des dépendances
npm install

# Lancement en mode développement
npm run dev

# Build pour production
npm run build

# Aperçu de la version de production
npm run preview
```

Le projet sera accessible sur `http://localhost:3000`

## 🎯 Utilisation

### Navigation
- **Clic gauche + glisser** : Rotation de la caméra
- **Molette** : Zoom avant/arrière
- **Survol** : Affichage des informations projet
- **Clic** : Ouverture du popup détaillé

### Projets Présentés
1. **🏥 Système Hospitalier** - Application de gestion médicale
2. **🏢 Plateforme E-commerce** - Boutique en ligne complète
3. **🏫 App d'Apprentissage** - Application mobile éducative
4. **🏭 Dashboard IoT** - Interface de monitoring industriel

## 📁 Structure du Projet

```
src/
├── components/          # Composants React/Three.js
│   ├── Scene.tsx       # Scène 3D principale
│   ├── Island.tsx      # Île avec végétation
│   ├── ProjectBuildings.tsx  # Bâtiments interactifs
│   ├── Lighting.tsx    # Système d'éclairage
│   ├── UI.tsx          # Interface utilisateur
│   ├── ProjectPopup.tsx # Popups de détails
│   └── LoadingScreen.tsx # Écran de chargement
├── data/
│   └── projects.ts     # Données des projets
├── types/
│   └── Project.ts      # Types TypeScript
└── main.tsx           # Point d'entrée
```

## 🎨 Personnalisation

### Ajouter un Projet
1. Modifiez `src/data/projects.ts`
2. Définissez la position 3D et le type de bâtiment
3. Ajoutez les détails (technologies, description, liens)

### Modifier l'Île
- `src/components/Island.tsx` - Géométrie et décoration
- `src/components/Lighting.tsx` - Ambiance lumineuse
- Tailwind config - Couleurs et animations

### Types de Bâtiments Disponibles
- `hospital` 🏥 - Avec croix rouge
- `office` 🏢 - Tour avec fenêtres éclairées
- `school` 🏫 - Bâtiment avec clocher
- `factory` 🏭 - Usine avec cheminées
- `house` 🏠 - Maison résidentielle
- `tower` 🗼 - Tour moderne

## 🔧 Développement

### Scripts Disponibles
- `npm run dev` - Serveur de développement avec HMR
- `npm run build` - Build optimisé pour production
- `npm run preview` - Prévisualisation du build
- `npm run lint` - Vérification du code

### Performance 3D
- Géométries instanciées pour les éléments répétés
- Matériaux partagés pour optimiser le rendu
- Niveau de détail adaptatif selon la distance
- Frustum culling automatique

## 🌟 Fonctionnalités Futures

- [ ] Mode VR/AR
- [ ] Animations de transition entre projets
- [ ] Système de particules avancé
- [ ] Mode nuit/jour dynamique
- [ ] Son ambiant et effets audio
- [ ] Sauvegarde des préférences utilisateur

## 📝 Licence

MIT License - Libre d'utilisation et de modification

## 👤 Auteur

Créé avec ❤️ pour présenter mes projets de manière unique et immersive.

---

*Explorez, découvrez, et laissez-vous transporter dans cet univers 3D !* 🚀
