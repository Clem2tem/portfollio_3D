# Optimisations Mobile

Ce document détaille les optimisations apportées pour améliorer l'expérience mobile du portfolio 3D.

## Problèmes Identifiés

1. **Textes trop grands** - Les tailles fixes ne s'adaptaient pas aux petits écrans
2. **Pas d'interactions tactiles** - Uniquement navigation au wheel (souris)
3. **Éléments UI trop espacés** - Perte d'espace précieux sur mobile
4. **Carte technologies mal positionnée** - Cachait le contenu sur mobile

## Solutions Implémentées

### 1. IntroScreen Responsive (`IntroScreen.tsx`)

#### Tailles de Texte Adaptatives
```tsx
// Avant: text-[300px] (trop grand)
// Après: text-[120px] sm:text-[200px] lg:text-[300px]
```

**Breakpoints utilisés:**
- Mobile (< 640px): Tailles réduites (120px, 28px, 20px)
- Tablet (640px+): Tailles moyennes (200px, 50px, 40px)
- Desktop (1024px+): Tailles originales (300px, 70px, 70px)

#### Améliorations
- Padding horizontal ajouté (`px-4`)
- Texte centré avec `text-center`
- Largeur maximale (`max-w-[95vw]`) pour éviter le débordement
- Flèche redimensionnée (`w-8 h-8` sur mobile → `w-24 h-24` sur desktop)
- Feedback tactile avec `active:scale-95`

### 2. HomePage Responsive

#### Header Adapté
- Titre réduit: `text-base sm:text-xl lg:text-2xl`
- Sous-titre caché sur mobile, version courte affichée
- Bouton contact plus compact
- Espacement réduit (`px-3` → `px-2` sur mobile)

#### Navigation Stepper
- Position ajustée: `top-16 sm:top-20` (plus bas sur mobile)
- Indicateurs plus petits: `h-1.5 sm:h-2`, `w-3 sm:w-4`
- Espacement réduit: `gap-1 sm:gap-2`
- Feedback tactile: `active:scale-95`

#### Bulle de Dialogue
- Padding réduit: `p-3 sm:p-6`
- Texte plus petit: `text-sm sm:text-base lg:text-lg`
- Bordures arrondies ajustées: `rounded-xl sm:rounded-2xl`
- Position plus proche du bas: `bottom-3 sm:bottom-6`

#### Carte Technologies
**Repositionnement intelligent:**
- **Mobile**: En bas à gauche (`bottom-28`), au-dessus de la bulle
- **Desktop**: À mi-hauteur à gauche (`sm:top-1/2`)

**Layout flexible:**
- **Mobile**: `flex flex-wrap` - logos sur une ligne
- **Desktop**: `sm:block` - empilés verticalement

**Tailles adaptées:**
- Padding: `p-2 sm:p-3`
- Titre: `text-xs sm:text-sm`
- Logos: `w-6 h-6 sm:w-8 sm:h-8`
- Texte: `text-xs sm:text-sm`

### 3. Interactions Tactiles (`HomePage.tsx`)

#### Gestes de Swipe
Ajout de la navigation par swipe vertical :

```typescript
// Swipe vers le haut = avancer
// Swipe vers le bas = reculer
```

**Paramètres:**
- Distance minimale: 50px
- Temps maximum: 500ms
- Détection tactile non-blocking (`passive: true`)

**Comportement:**
- Même logique que le wheel (avance dialogues puis projets)
- Throttling naturel par la validation du geste
- Compatible avec le clic pour avancer

#### Zones de Touch Agrandies
- Tous les boutons ont `active:scale-95` pour feedback visuel
- Stepper avec targets plus larges sur mobile
- Espacement suffisant entre éléments cliquables

### 4. Performance Mobile

Le système de détection de performance (`usePerformanceMonitor`) détecte automatiquement les mobiles :

```typescript
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
```

**Sur mobile:**
- Démarre en qualité Medium
- Ombres désactivées si FPS < 30
- DPR fixé à 1 (pas de haute résolution)

## Classes Tailwind Utilisées

### Breakpoints
- `sm:` (640px+) - Tablettes portrait
- `lg:` (1024px+) - Desktop

### Responsive Utilities
- `text-[size] sm:text-[size] lg:text-[size]` - Texte adaptatif
- `p-[size] sm:p-[size]` - Padding adaptatif
- `hidden sm:block` - Affichage conditionnel
- `w-[size] sm:w-[size]` - Largeur adaptative

### Touch Feedback
- `active:scale-95` - Réduction au touch
- `active:bg-[color]` - Changement de couleur au touch
- `transition-transform` - Animation fluide

## Tests Recommandés

### Test Mobile
1. Ouvrir Chrome DevTools
2. Toggle Device Toolbar (Cmd/Ctrl + Shift + M)
3. Tester sur différents devices:
   - iPhone SE (375px)
   - iPhone 12/13 Pro (390px)
   - Pixel 5 (393px)
   - iPad (768px)

### Test Tactile
1. Utiliser un vrai appareil tactile si possible
2. Vérifier:
   - Swipe vertical pour naviguer
   - Touch sur stepper pour sauter
   - Touch sur boutons (feedback visuel)
   - Zones de touch suffisamment grandes

### Test Orientation
1. Portrait (défaut)
2. Paysage - vérifier que tout reste lisible

## Métriques de Succès

✅ **Texte lisible** - Plus de débordement ou texte trop petit
✅ **Navigation tactile** - Swipe fonctionne comme attendu
✅ **UI compacte** - Tout visible sans scroll horizontal
✅ **Performance** - FPS stable sur mobile (>30)
✅ **Feedback visuel** - Tous les éléments interactifs répondent

## Améliorations Futures

1. **Orientation paysage** - Layout spécifique pour landscape
2. **Gestes avancés** - Pinch to zoom, rotation, etc.
3. **Keyboard mobile** - Meilleure gestion du clavier virtuel
4. **PWA** - Transformer en Progressive Web App
5. **Animations optimisées** - Réduire les animations complexes sur mobile
6. **Chargement lazy** - Charger les assets progressivement
