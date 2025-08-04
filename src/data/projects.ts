import { Project } from '../types/Project'

export const projects: Project[] = [
  {
    id: 'hospital-project',
    title: 'Système de Gestion Hospitalière',
    description: 'Application complète pour la gestion des patients, rendez-vous et dossiers médicaux.',
    technologies: ['React', 'Node.js', 'PostgreSQL', 'Express', 'JWT', 'Socket.io'],
    category: 'fullstack',
    position: [0.6, -0.01, 1.2],
    buildingType: 'hospital',
    details: {
      challenge: 'Créer un système sécurisé et efficient pour gérer les données sensibles des patients tout en respectant les normes HIPAA.',
      solution: 'Architecture microservices avec authentification JWT, chiffrement des données et interface utilisateur intuitive pour le personnel médical.',
      features: [
        'Gestion des dossiers patients avec historique médical',
        'Système de rendez-vous en temps réel',
        'Notifications push pour le personnel',
        'Tableau de bord analytics pour les administrateurs',
        'Interface mobile responsive'
      ],
      learnings: [
        'Sécurisation des données médicales sensibles',
        'Implémentation de WebSockets pour les notifications temps réel',
        'Architecture scalable avec microservices',
        'Tests automatisés pour applications critiques'
      ]
    },
    liveUrl: 'https://hospital-demo.example.com',
    githubUrl: 'https://github.com/user/hospital-system'
  },
  {
    id: 'ecommerce-platform',
    title: 'Plateforme E-commerce',
    description: 'Boutique en ligne moderne avec panier, paiements et gestion des commandes.',
    technologies: ['Next.js', 'TypeScript', 'Stripe', 'Prisma', 'Tailwind CSS'],
    category: 'web',
    position: [-2, 0.3, 1.5],
    buildingType: 'office',
    details: {
      challenge: 'Développer une plateforme e-commerce performante avec une expérience utilisateur fluide et des paiements sécurisés.',
      solution: 'Next.js pour le SSR, intégration Stripe pour les paiements, et Prisma pour la gestion de base de données.',
      features: [
        'Catalogue produits avec filtres avancés',
        'Panier persistant et wishlist',
        'Paiements sécurisés avec Stripe',
        'Panel admin pour la gestion des produits',
        'Suivi des commandes en temps réel'
      ],
      learnings: [
        'Optimisation SEO avec Next.js',
        'Intégration de systèmes de paiement',
        'Gestion d\'état complexe avec Zustand',
        'Performance et optimisation des images'
      ]
    },
    liveUrl: 'https://shop-demo.example.com',
    githubUrl: 'https://github.com/user/ecommerce-platform'
  },
  {
    id: 'learning-app',
    title: 'Application d\'Apprentissage',
    description: 'Plateforme éducative interactive avec cours, quiz et suivi de progression.',
    technologies: ['React Native', 'Firebase', 'Redux', 'Expo'],
    category: 'mobile',
    position: [0, 0.3, -2.5],
    buildingType: 'school',
    details: {
      challenge: 'Créer une application mobile engageante pour l\'apprentissage avec suivi de progression et contenu interactif.',
      solution: 'React Native avec Expo pour le développement cross-platform et Firebase pour le backend temps réel.',
      features: [
        'Cours interactifs avec vidéos et exercices',
        'Système de quiz avec feedback immédiat',
        'Suivi de progression personnalisé',
        'Mode hors-ligne pour l\'apprentissage',
        'Gamification avec badges et niveaux'
      ],
      learnings: [
        'Développement mobile cross-platform',
        'Synchronisation de données hors-ligne',
        'Animations fluides en React Native',
        'Architecture Redux pour applications complexes'
      ]
    },
    liveUrl: 'https://apps.apple.com/app/learning-demo',
    githubUrl: 'https://github.com/user/learning-app'
  },
  {
    id: 'SAAS-ERP-EGS',
    title: 'SAAS ERP EGS',
    description: 'SaaS pour la gestion de chantiers et la création de devis automatiques',
    technologies: ['React', 'TypeScript', 'Firebase', 'Git', 'Google Cloud'],
    category: 'web',
    position: [1.8, 0.20, -1.8],
    buildingType: 'factory',
    details: {
      challenge: 'Visualiser en temps réel des milliers de points de données provenant de capteurs industriels.',
      solution: 'Dashboard Vue.js avec graphiques D3.js, protocole MQTT pour la communication temps réel et InfluxDB pour le stockage des séries temporelles.',
      features: [
        'Visualisation temps réel de 1000+ capteurs',
        'Alertes automatiques sur seuils critiques',
        'Graphiques interactifs avec zoom et pan',
        'Export de données en CSV/PDF',
        'Interface responsive pour tablettes industrielles'
      ],
      learnings: [
        'Protocoles IoT (MQTT, CoAP)',
        'Bases de données de séries temporelles',
        'Optimisation pour gros volumes de données',
        'Visualisation de données complexes avec D3.js'
      ]
    },
    liveUrl: 'https://iot-dashboard-demo.example.com',
    githubUrl: 'https://github.com/user/iot-dashboard'
  }
]
