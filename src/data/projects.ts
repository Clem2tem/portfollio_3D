import { Project } from '../types/Project'

export const projects: Project[] = [
  {
    id: 'hospital-project',
    title: 'Medchem Structure Genius',
    description: 'Application complète de e-Learning dans le domaine de la pharmacologie.',
    technologies: ['React', 'Node.js', 'Next.js', 'Supabase', 'Vercel', 'TypeScript'],
    category: 'fullstack',
    position: [-3.5, -0.15, 7.3],
    buildingType: 'hospital',
    details: {
      challenge: "Créer un système sécurisé et efficient pour gérer les données de l'application par la clientele, tout en offrant une expérience utilisateur fluide et interactive pour les utilisateurs.",
      solution: 'Création d\'un backend avec Node.js et Express pour gérer les requêtes et les données de l\'application et un back-office avec Next.js pour l\'interface utilisateur. Correction de l\'UI/UX et ajout de nouvelles fonctionnalités.',
      features: [
        'Gestion de tout les éléments de l\'application via un back-office',
        'Système de quiz interactifs avec sélection de niveau et de domaine pharmaceutique',
        'Système de notation et suivi des progrès des utilisateurs',
        'Tableau de bord analytics pour les administrateurs',
        'Interface mobile responsive'
      ],
      learnings: [
        'Sécurisation des données sensibles',
        'Développeement d\'API RESTful avec Node.js',
        'Déploiement continu avec Vercel, Expo et GitHub',
        'Tests automatisés avec Jest',
      ]
    },
    liveUrl: 'https://www.medchemstructuregenius.eu/',
    githubUrl: 'private',
    radius: 4
  },
  // {
  //   id: 'ecommerce-platform',
  //   title: 'Plateforme E-commerce',
  //   description: 'Boutique en ligne moderne avec panier, paiements et gestion des commandes.',
  //   technologies: ['Next.js', 'TypeScript', 'Stripe', 'Prisma', 'Tailwind CSS'],
  //   category: 'web',
  //   position: [-2, 0.3, 1.5],
  //   buildingType: 'office',
  //   details: {
  //     challenge: 'Développer une plateforme e-commerce performante avec une expérience utilisateur fluide et des paiements sécurisés.',
  //     solution: 'Next.js pour le SSR, intégration Stripe pour les paiements, et Prisma pour la gestion de base de données.',
  //     features: [
  //       'Catalogue produits avec filtres avancés',
  //       'Panier persistant et wishlist',
  //       'Paiements sécurisés avec Stripe',
  //       'Panel admin pour la gestion des produits',
  //       'Suivi des commandes en temps réel'
  //     ],
  //     learnings: [
  //       'Optimisation SEO avec Next.js',
  //       'Intégration de systèmes de paiement',
  //       'Gestion d\'état complexe avec Zustand',
  //       'Performance et optimisation des images'
  //     ]
  //   },
  //   liveUrl: 'https://shop-demo.example.com',
  //   githubUrl: 'https://github.com/user/ecommerce-platform'
  // },
  // {
  //   id: 'learning-app',
  //   title: 'Application d\'Apprentissage',
  //   description: 'Plateforme éducative interactive avec cours, quiz et suivi de progression.',
  //   technologies: ['React Native', 'Firebase', 'Redux', 'Expo'],
  //   category: 'mobile',
  //   position: [0, 0.3, -2.5],
  //   buildingType: 'school',
  //   details: {
  //     challenge: 'Créer une application mobile engageante pour l\'apprentissage avec suivi de progression et contenu interactif.',
  //     solution: 'React Native avec Expo pour le développement cross-platform et Firebase pour le backend temps réel.',
  //     features: [
  //       'Cours interactifs avec vidéos et exercices',
  //       'Système de quiz avec feedback immédiat',
  //       'Suivi de progression personnalisé',
  //       'Mode hors-ligne pour l\'apprentissage',
  //       'Gamification avec badges et niveaux'
  //     ],
  //     learnings: [
  //       'Développement mobile cross-platform',
  //       'Synchronisation de données hors-ligne',
  //       'Animations fluides en React Native',
  //       'Architecture Redux pour applications complexes'
  //     ]
  //   },
  //   liveUrl: 'https://apps.apple.com/app/learning-demo',
  //   githubUrl: 'https://github.com/user/learning-app'
  // },
  {
    id: 'SAAS-ERP-EGS',
    title: 'SAAS ERP EGS',
    description: 'SaaS pour la gestion de chantiers et la création de devis automatiques',
    technologies: ['React', 'TypeScript', 'Next.js', 'Node.js', 'Firebase', 'Git', 'Google Cloud'],
    category: 'fullstack',
    position: [6, 0, -1],
    buildingType: 'factory',
    details: {
      challenge: "Les processus étaient majoritairement manuels : devis longs à produire, forte dépendance aux fichiers Excel, manque de visibilité globale sur l'avancement et les marges, risques d'erreurs lors des calculs et mises à jour.",
      solution: "Développement d'une plateforme SaaS avec Next.js et Firebase, intégrée à Google Workspace, permettant la gestion complète des devis, factures et chantiers. Centralisation des données clients, projets et documents. Interface web claire, orientée efficacité opérationnelle",
      features: [
        "Module devis automatisé avec import de nomenclatures Revit",
        "Authentification sécurisée (Firebase + OAuth Google) avec rôles",
        "Intégrations Google Sheets, Drive et Calendar",
        "Gestion des factures et exports comptables",
        "Interface responsive et adaptée aux différents profils utilisateurs",
        "Tests automatisés et CI/CD avec monitoring des performances",
      ],
      learnings: [
        "Architecture SaaS et conception modulaire",
        "Gestion de la sécurité et des rôles utilisateurs",
        "Intégration d'APIs tierces (Google Workspace)",
        "Pratiques de qualité logicielle (tests, CI/CD, monitoring)",
        "Optimisation des performances frontend (virtualisation, lazy loading)"
      ],
    },
    liveUrl: 'private',
    githubUrl: 'private',
    radius: 4
  }
]
