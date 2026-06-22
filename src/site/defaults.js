export const DEFAULT_ADMIN_PASSWORD = "admin1234";
export const defaults = {
  sectionMedia: {
    machines: { type: "image", title: "Machines et prix", subtitle: "Consultez les solutions disponibles et envoyez une demande d'achat.", image: "/realisations/cnc-3w-iso.jpeg", backImage: "/realisations/cnc-3w-noir.jpeg" },
    realisations: { type: "image", title: "Nos Realisations", subtitle: "Decouvrez nos projets realises etape par etape", image: "/realisations/chantier-beton.jpeg" },
    services: { type: "image", title: "Maintenance", subtitle: "Services de maintenance et depannage industriel", image: "/realisations/maintenance-groupe-2.jpeg", backImage: "/realisations/maintenance-groupe-1.jpeg" },
    formation: { type: "image", title: "Nos Formations", subtitle: "Decouvrez nos programmes de formation disponibles", image: "/realisations/ligne-remplissage.jpeg", backImage: "/realisations/machine-labo.jpeg" },
    about: { type: "image", title: "DITONA Engineering", subtitle: "DITONA Engineering developpe des solutions techniques pour produire, maintenir et ameliorer les equipements industriels.", image: "/realisations/maintenance-groupe-1.jpeg" },
    appointment: { type: "image", title: "Rencontrer DITONA Engineering", subtitle: "Planifiez un echange pour un achat, un projet, une maintenance ou une formation.", image: "/realisations/cnc-3w-iso.jpeg" },
    contact: { type: "image", title: "Contacts", subtitle: "Nos coordonnees et moyens de contact", image: "/realisations/maintenance-groupe-2.jpeg" },
  },
  homeMedia: [
    {
      id: 1,
      type: "image",
      title: "Fabrication de machines industrielles",
      subtitle: "Conception, montage et mise au point d'equipements sur mesure",
      image: "/realisations/ligne-remplissage.jpeg",
      backImage: "/realisations/cnc-3w-iso.jpeg",
    },
    {
      id: 2,
      type: "image",
      title: "Maintenance et remise en service",
      subtitle: "Diagnostic terrain, depannage et suivi technique.",
      image: "/realisations/maintenance-groupe-1.jpeg",
      backImage: "/realisations/maintenance-groupe-2.jpeg",
    },
    {
      id: 3,
      type: "image",
      title: "Formation en fabrication de machines",
      subtitle: "Accompagnement des techniciens et operateurs.",
      image: "/realisations/machine-labo.jpeg",
      backImage: "/realisations/ligne-remplissage.jpeg",
    },
    {
      id: 4,
      type: "image",
      title: "Prototypes et automatisation",
      subtitle: "Solutions speciales pour laboratoire, atelier et production.",
      image: "/realisations/machine-labo.jpeg",
      backImage: "/realisations/cnc-3w-noir.jpeg",
    },
    {
      id: 5,
      type: "image",
      title: "Interventions electriques",
      subtitle: "Controle, cablage et securisation des installations.",
      image: "/realisations/maintenance-groupe-2.jpeg",
      backImage: "/realisations/maintenance-groupe-1.jpeg",
    },
    {
      id: 6,
      type: "image",
      title: "Chantiers techniques",
      subtitle: "Accompagnement industriel et suivi de realisation.",
      image: "/realisations/chantier-beton.jpeg",
      backImage: "/realisations/ligne-remplissage.jpeg",
    },
  ],
  homeProof: [
    {
      id: 1,
      type: "image",
      title: "Decoupeuse CNC DITONA 3W",
      subtitle: "Adaptee aux ateliers techniques, ecoles et productions legeres.",
      image: "/realisations/cnc-3w-iso.jpeg",
      backImage: "/realisations/cnc-3w-noir.jpeg",
    },
    {
      id: 2,
      type: "image",
      title: "Ligne industrielle de remplissage",
      subtitle: "Conception 3D, fabrication et installation d'une ligne automatisee.",
      image: "/realisations/ligne-remplissage.jpeg",
      backImage: "/realisations/machine-labo.jpeg",
    },
    {
      id: 3,
      type: "image",
      title: "Cellule robotisee industrielle",
      subtitle: "Automatisation, convoyage et controle pour production continue.",
      image: "/realisations/machine-labo.jpeg",
      backImage: "/realisations/ligne-remplissage.jpeg",
    },
  ],
  machines: [
    {
      id: 1,
      name: "Decoupeuse CNC DITONA 3W",
      category: "Usinage CNC",
      price: 2800000,
      discountPercent: 0,
      image: "/realisations/cnc-3w-iso.jpeg",
      description: "Machine CNC compacte pour gravure, decoupe et prototypage industriel.",
      comment: "Adaptee aux ateliers techniques, ecoles et productions legeres.",
      status: "Disponible",
    },
    {
      id: 2,
      name: "Ligne de remplissage automatique",
      category: "Automatisation",
      price: 12500000,
      discountPercent: 0,
      image: "/realisations/ligne-remplissage.jpeg",
      description: "Ligne de convoyage, dosage et remplissage pour production agro-industrielle.",
      comment: "Conception 3D, fabrication, installation et mise en service.",
      status: "Sur commande",
    },
    {
      id: 3,
      name: "Groupe hydraulique chantier",
      category: "Maintenance",
      price: 1950000,
      discountPercent: 0,
      image: "/realisations/maintenance-groupe-1.jpeg",
      backImage: "/realisations/maintenance-groupe-2.jpeg",
      description: "Diagnostic, entretien et remise en service d'equipements hydrauliques.",
      comment: "Intervention terrain avec controle securite.",
      status: "Service",
    },
    {
      id: 4,
      name: "Prototype laboratoire automatise",
      category: "Conception speciale",
      price: 6500000,
      discountPercent: 0,
      image: "/realisations/machine-labo.jpeg",
      backImage: "/realisations/ligne-remplissage.jpeg",
      description: "Machine speciale avec capteurs, controle et instrumentation.",
      comment: "Projet realise selon cahier des charges.",
      status: "Sur devis",
    },
  ],
  realisations: [
    { 
      id: 101, 
      title: "Maintenance groupe hydraulique", 
      image: "/realisations/maintenance-groupe-1.jpeg", 
      backImage: "/realisations/maintenance-groupe-2.jpeg",
      steps: [
        { title: "Diagnostic initial", description: "Analyse complete du systeme hydraulique et identification des pannes" },
        { title: "Démontage", description: "Démontage sécurisé des composants défectueux" },
        { title: "Réparation", description: "Remplacement des pieces usées et remise en état" },
        { title: "Tests", description: "Tests de fonctionnement et controles de sécurité" },
        { title: "Livraison", description: "Remise en service et formation de l'équipe" }
      ]
    },
    { 
      id: 102, 
      title: "Chantier beton armé", 
      image: "/realisations/chantier-beton.jpeg", 
      backImage: "/realisations/maintenance-groupe-1.jpeg",
      steps: [
        { title: "Étude technique", description: "Analyse des plans et calculs de structure" },
        { title: "Préparation", description: "Mise en place du chantier et approvisionnement" },
        { title: "Ferraillage", description: "Réalisation des armatures selon les plans" },
        { title: "Coulage", description: "Coulage du beton et vibration" },
        { title: "Finitions", description: "Décoffrage et finitions de surface" }
      ]
    },
    { 
      id: 103, 
      title: "Ligne industrielle de remplissage", 
      image: "/realisations/ligne-remplissage.jpeg", 
      backImage: "/realisations/machine-labo.jpeg",
      steps: [
        { title: "Conception 3D", description: "Modélisation complète de la ligne en CAO" },
        { title: "Fabrication", description: "Usinage et assemblage des composants" },
        { title: "Installation", description: "Montage sur site et raccordements" },
        { title: "Mise en service", description: "Tests et réglages des paramètres" },
        { title: "Formation", description: "Formation des opérateurs à l'utilisation" }
      ]
    },
    { 
      id: 104, 
      title: "CNC DITONA 3W ISO", 
      image: "/realisations/cnc-3w-iso.jpeg", 
      backImage: "/realisations/cnc-3w-noir.jpeg",
      steps: [
        { title: "Design", description: "Conception de la machine selon les besoins client" },
        { title: "Usinage", description: "Fabrication des pieces mécaniques" },
        { title: "Assemblage", description: "Montage complet de la machine" },
        { title: "Programmation", description: "Configuration du controleur CNC" },
        { title: "Tests", description: "Validation des performances et précision" }
      ]
    },
  ],
  maintenanceServices: [
    { 
      id: 1, 
      title: "Maintenance preventive", 
      image: "/realisations/maintenance-groupe-2.jpeg",
      problem: "Usure normale des équipements avec risque de panne",
      solution: "Inspection régulière, remplacement des pièces d'usure, lubrification",
      history: [
        { date: "2024-01-15", problem: "Vibrations anormales sur ligne de production", solution: "Remplacement des roulements et réalignement" },
        { date: "2024-02-20", problem: "Fuite hydraulique sur presse", solution: "Remplacement des joints et vérification du circuit" }
      ]
    },
    { 
      id: 2, 
      title: "Dépannage urgent", 
      image: "/realisations/maintenance-groupe-1.jpeg",
      problem: "Arrêt imprévu de machine en production",
      solution: "Diagnostic rapide, réparation sur site, remise en service",
      history: [
        { date: "2024-03-10", problem: "Panne électrique sur automate", solution: "Remplacement du module défectueux en 2h" },
        { date: "2024-04-05", problem: "Blocage mécanique sur convoyeur", solution: "Réparation de la transmission et nettoyage" }
      ]
    },
    { 
      id: 3, 
      title: "Rénovation équipements", 
      image: "/realisations/chantier-beton.jpeg",
      problem: "Équipements anciens avec baisse de performance",
      solution: "Modernisation, mise à jour des composants, optimisation",
      history: [
        { date: "2024-01-30", problem: "Machine CNC obsolète", solution: "Mise à jour du contrôleur et des moteurs" }
      ]
    },
  ],
  formations: [
    { 
      id: 1, 
      title: "Formation CNC", 
      description: "Apprentissage de la programmation et utilisation de machines CNC",
      duration: "2 semaines",
      available: true,
      image: "/realisations/cnc-3w-iso.jpeg"
    },
    { 
      id: 2, 
      title: "Maintenance industrielle", 
      description: "Techniques de maintenance préventive et corrective",
      duration: "1 semaine",
      available: true,
      image: "/realisations/maintenance-groupe-1.jpeg"
    },
    { 
      id: 3, 
      title: "Automatisation", 
      description: "Programmation d'automates et systèmes automatisés",
      duration: "3 semaines",
      available: false,
      image: "/realisations/ligne-remplissage.jpeg"
    },
    { 
      id: 4, 
      title: "Soudure industrielle", 
      description: "Techniques de soudure TIG, MIG et électrode",
      duration: "1 semaine",
      available: true,
      image: "/realisations/chantier-beton.jpeg"
    },
  ],
  services: [
    { id: 1, title: "Service apres-vente", image: "/realisations/maintenance-groupe-2.jpeg", backImage: "/realisations/maintenance-groupe-1.jpeg", text: "Maintenance preventive, depannage, pieces, controle et suivi apres installation.", target: "/services" },
    { id: 2, title: "Accompagnement industriel", image: "/realisations/chantier-beton.jpeg", backImage: "/realisations/ligne-remplissage.jpeg", text: "Conseil technique, dimensionnement, choix des machines et suivi de chantier.", target: "/services" },
    { id: 3, title: "Vente de machines", image: "/realisations/cnc-3w-iso.jpeg", backImage: "/realisations/cnc-3w-noir.jpeg", text: "Machines standards ou sur commande avec installation et mise en service.", target: "/machines" },
    { id: 4, title: "Formation technique", image: "/realisations/ligne-remplissage.jpeg", backImage: "/realisations/machine-labo.jpeg", text: "Formation des operateurs, techniciens, responsables de production et equipes maintenance.", target: "/formation" },
  ],
  ads: [
    {
      id: 1,
      type: "image",
      title: "Offres DITONA",
      text: "Machines, maintenances et formations disponibles.",
      description: "Decouvrez les offres DITONA disponibles et contactez directement l'equipe pour commander ou demander plus d'informations.",
      location: "Vakpossito Lome Togo",
      whatsapp: "+228 70 02 12 25",
      image: "/realisations/cnc-3w-iso.jpeg",
      cta: "Commander maintenant",
      displayMs: 7000,
      active: true,
    },
  ],
  adsSettings: {
    visibleMs: 22000,
    hiddenMs: 18000,
  },
  messages: [],
  orders: [],
  appointments: [],
  trainingRequests: [],
  maintenanceRequests: [],
};
