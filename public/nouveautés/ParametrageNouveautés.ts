interface Nouveautés {
  version: string;
  date: string;
  lienCentreAide?: string;
  contenu: string[];
  correctifs: string[];
}

export const ParametrageNouveautés: Nouveautés[] = [
  {
    version: 'Version 2.6.1',
    date: '12 décembre 2024',
    contenu: [
      'PILOTE se dote d\'une nouvelle fonctionnalité permettant aux territoires de proposer des valeurs pour les indicateurs des PPG. Cette fonctionnalité permet de proposer une valeur pour un indicateur, affichée en parallèle des données importées par le Directeur de projet. Elle est réservée aux utilisateurs habilités à rédiger des commentaires pour une PPG sur un territoire. Pensée comme un outil de dialogue supplémentaire, cette fonctionnalité doit vous permettre d’indiquer si vous constatez une différence entre les résultats apportés par la direction de projet et la réalité du terrain. Plus d\'informations dans le centre d\'aide [ici]() ',

    ],
    correctifs: [
    ],
  },
  
  {
    version: 'Version 2.5.10',
    date: '21 novembre 2024',
    contenu: [
      'La navigation dans PILOTE est modifiée ! Si vous êtes en administration centrale ou en région, vous pourrez dorénavant choisir d\'afficher la maille régionale ou départementale directement depuis les cartes et les jauges affichant la répartition géographique. Le panneau latéral est également modifié. Le filtre "Territoire" vous permet dorénavant de sélectionner une région ou un département dans un menu unique. Il n\'est plus nécessaire de choisir la maille avant de sélectionner un territoire. Dans ce panneau latéral, le bouton permettant de sélectionner la maille est dorénavant supprimé. Cette modification sera bientôt suivie d\'autres nouveautés permettant de faciliter la navigation dans PILOTE.',
      'Page d\'accueil et Page PPG : modification de l\'affichage des jauges de répartition territoriale des taux d\'avancement. Afin de faciliter la compréhension de l\'affichage du minimum, du maximum et de la médiane des taux d\'avancement dans les territoires, ces jauges ont été déplacées dans une tuile séparée. Une infobulle permet d\'expliquer le détail des informations.',
      'Export du rapport détaillé : l\'export en format PDF a été amélioré. Afin de faciliter la lecture des commentaires, un commentaire rédigé pour un territoire n\'est plus divisé sur plusieurs pages. L\'affichage d\'un seul commentaire est limitée sur une seule page.',
      'Gestion des comptes (profil DITP et coordinateurs PILOTE uniquement) : Lors de la création d\'un compte, le menu déroulant permettant de sélectionner les PPG à attribuer pour un compte s\'adapte désormais au territoire sélectionné. Les PPG non applicables sur un territoire n\'apparaissent plus dans ce menu.',
      'Déclaration d\'accessibilité : la déclaration d\'accessibilité de PILOTE a été mise à jour.',

    ],
    correctifs: [
      'Page d\'accueil : dans la liste des PPG, pour certaines PPG, lorsque l\'écart par rapport à la médiane était égal à 0, il pouvait ne pas s\'afficher. Désormais, l\'écart à la médiane s\'affiche pour l\'ensemble des PPG, même si celui-ci est nul.',
      'Gestion des comptes (profil DITP uniquement) : la procédure de désactivation des comptes a été modifiée afin de corriger un comportement qui pouvait empêcher la suppression de certains comptes utilisateurs.',
    ],
  },
  {
    version: 'Version 2.5.9',
    date: '7 novembre 2024',
    contenu: [
      'Page d\'accueil et page PPG : les cartes des taux d\'avancement affichent désormais le taux d\'avancement de l\'année en cours. De plus, pour chaque indicateur, en plus des valeurs actuelles, elles affichent également les valeurs cibles',
      'Exports csv : il est désormais possible de réaliser un export csv en prenant en compte le filtre "Chantiers signalés" depuis la page d\'accueil',
    ],
    correctifs: [
      'Page d\'accueil : correction d\'une erreur dans la fonctionnalité de tri des PPG. Celle-ci empechait l\'affichage correct des PPG lorsque le type de tri était modifié',   
      'Gestion des comptes (profils DITP et coordinateurs PILOTE uniquement) : amélioration de la stabilité du formulaire de création de compte',
    ],
  },
  {
    version: 'Version 2.5.8',
    date: '14 octobre 2024',
    contenu: [],
    correctifs: [
      'Page PPG : correction d\'une erreur qui empechait l\'affichage de la pondération d\'un indicateur à la maille correspondante au niveau régional ou départemental.',
      'Page PPG : correction d\'une erreur sur les graphiques d\'évolution pour chaque indicateur. Les valeurs des indicateurs pouvaient ne pas apparaître dans l\'ordre chronologique.',
      'Page PPG : correction d\'une erreur d\'affichage dans les historiques de commentaires. L\'ensemble des commentaires est à nouveau disponible.',
    ],
  },
  {
    version: 'Version 2.5.7',
    date: '8 octobre 2024',
    contenu: [
      'Page d’accueil : dans la liste des chantiers, ajout d\'un tri en fonction de la tendance et de l\'écart à la médiane de la maille concernée',
      'Export des données en format csv : ajout du taux d\'avancement annuel dans l\'export des chantiers',
      'Page d’accueil : ajout d\'un bouton permettant de contacter l\'équipe PILOTE à partir de la nouvelle adresse pilote.ditp@modernisation.gouv.fr. L\'adresse support.ditp@modernisation.gouv.fr sera progressivement remplacée par cette adresse et les messages seront automatiquement transmis sur la nouvelle adresse.',
      'Interface de gestion des indicateurs (réservée aux profils DITP) : amélioration de l\'interface (ajout de filtres, modification des champs, etc.)',
    ],
    correctifs: [
      'Page d’accueil : sur le menu \"filtres actifs sur cette page\", correction d\'une erreur qui empechait la suppression des filtres',
      'Gestion des comptes : amélioration de la configuration de la page afin d\'en diminuer le temps de chargement et améliorer la stabilité',
      'Import de données : lors d\'un import de valeur initiale, PILOTE prenait en compte la valeur initiale importée à la date la plus ancienne. Dorénavant, la valeur initiale affichée pour chaque indicateur correspond à la dernière valeur importée dans l\'outil (même si des VI avec des dates de valeur plus anciennes ont déjà été importées)',
      'Import de données : limitation du nombre de décimales affichées pour chaque valeur d\'indicateur',
    ],
  },
  {
    version: 'Version 2.5.6',
    date: '12 septembre 2024',
    contenu : [
      'Page Indicateurs : Précision du calcul de la date de mise à jour de l\'indicateur.',
      'Page Indicateurs : Bloc détail des indicateurs : ajout des informations concernant la fréquence de mise à jour des indicateurs + délai de disponibilité.',
      'Page Indicateurs : Fiabilisation du calcul de la date de dernière mise à jour des données.',
      'Page Indicateurs : Dans le bloc indicateurs, ajout d\'une infobulle précisant la méthode de calcul de la date prévisionnelle de mise à jour des données.',
      'Page Gestion des comptes : Amélioration de l\'affichage de la page de création de comptes.',
      "Page Gestion des comptes : Modification de la désignation d'un directeur de projet et d'un responsable local.",
      'Page Gestion des comptes : Ajout d\'une colonne "territoire" dans la liste des utilisateurs de PILOTE.',
      'Page PPG : Les PPG validées se trouvent désormais par défaut dans la liste des PPG de la page d\'accueil, avec un bouton filtre sur les PPG en cours de cadrage (pour les personnes ayant accès à cette fonctionnalité).',
    ],
    correctifs : [
      'Page PPG : Amélioration du temps de chargement de la page chantier pour se conformer aux standards d\'eco-conception de produits numériques.',
      'Version mobile : Amélioration de l\'accès aux filtres.',
    ],
  },
  {
    version: 'Version 2.5.5',
    date: '23 juillet 2024',
    contenu : [
      'Page PPG : Amélioration de la prise de contact dans PILOTE. Après plusieurs retours de la part des utilisateurs, nous avons décidé d\'améliorer la fonctionnalité permettant d\'entrer en contact avec les responsables de chaque PPG. Un nouveau bouton "Contacter" vous permet de générer un courrier électronique directement à destination du directeur de projet, du responsable local ou du coordinateur PILOTE du territoire.',
      'Page PPG : Pour les indicateurs de chaque PPG, dans le cas où l\'objectif d\'un indicateur doit tendre vers une baisse, cela est désormais précisé sous le titre de chaque indicateur avec une icône flèche spécifique.',
      'Rapport détaillé : Le rapport détaillé poursuit sa mue ! Les PPG sont dorénavant triées par ordre décroissant, à l\'instar de la page d\'accueil de PILOTE. Les filtres apparaissent également désormais sur la page de couverture de la version PDF du rapport. De plus, les icônes des ministères ont également été ajoutées. De futures améliorations sont également à venir concernant la disposition des pages.', 
      'Centre d\'aide : Dans le but de favoriser une meilleure prise en main de l\'outil, la structure des articles et leur organisation ont été revues.',
    ],
    correctifs : [
    ],
  },
  {
    version: 'Version 2.5.4',
    date: '11 juillet 2024',
    contenu : [
      'Export des données : Pour faciliter les exports des données au format .csv, les filtres "Chantiers du baromètre" et "Chantiers territorialisés" sont désormais pris en compte séparément lors de la création d\'un export avec filtre. Il est désormais possible de télécharger un export appliquant les filtres séparément et permettant l\'export de l\'ensemble des chantiers du baromètre ou l\'ensemble des chantiers territorialisés (et non les chantiers correspondant à ces deux conditions, comme appliqué auparavant).',
      'Page PPG : Pour les indicateurs de chaque PPG, l\'identifiant de l\'indicateur et la date de mise à jour prévisionnelle sont désormais affichés.',
    ],
    correctifs : [
      'Rapport détaillé : au format PDF, la page de garde prend désormais en compte l\'ensemble des filtres appliqués lors de la création ou de l\'impression du rapport. Une erreur empêchant l\'affichage de l\'ensemble des chantiers dans le rapport sous certaines versions du navigateur Mozilla Firefox a également été corrigée. De prochaines améliorations sont à venir.',
    ],
  },
  {
    version: 'Version 2.5.3',
    date: '2 juillet 2024',
    contenu : [
      'Alertes et PPG signalées : modification du mode de calcul pour l\'alerte concernant les écarts à la moyenne nationale. Le calcul de cette alerte a été modifié, et prend en compte désormais les PPG ayant un écart égal ou supérieur à 10 points avec le taux d\'avancement territorial médian.',
      'Page d’accueil : ajout de la date de mise à jour des météo et synthèse des résultats dans la liste des chantiers',
      'Page d’accueil : ajout de nouvelles possibilités de tri des PPG. Il est désormais possible de les trier en fonction de la date de mise à jour des taux d\'avancement et de la date de mise à jour des météos et synthèse des résultats.',
      'Page PPG : les ministères porteurs sont dorénavant affichés sous le titre de chaque PPG, en haut de page pour simplifier la lecture',
    ],
    correctifs : [
    ],
  },
  {
    version: 'Version 2.5.2',
    date: '11 juin 2024',
    contenu : [
      'Bienvenue sur cette nouvelle page Nouveautés ! Dorénavant, vous retrouverez ici l\'ensemble des informations sur les évolutions de PILOTE et les dernières fonctionnalités disponibles ! Une pastille rouge visible depuis la page d\'accueil vous indique lorsque des mises à jour de cette page ont été réalisées',
      'Gestion des comptes : Les coordinateurs PILOTE dans les départements et régions ont maintenant pleinement la main pour gérer les comptes d\'utilisateur sur leur territoire. Afin de garantir le maintien des règles d\'utilisation de PILOTE, le nombre de comptes par territoires a été limité à 150 pour les départements et à 200 pour les régions.',
      'Page PPG : Afin de faciliter la lecture et la compréhension des indicateurs, les champs "Définition de l\'indicateur" et "Répartititon géographique du taux d\'avancement" ont été séparés dans deux accordéons distincts.',
    ],
    correctifs : [
      'Correction du calcul des jauges de répartition géographique des taux d\'avancement : une erreur empêchait l\'affichage du minimum pour certaines PPG.',
      'Rapport détaillé : correction de l\'affichage des objectifs des PPG.',
    ],
  }, {
    version: 'Version 2.5.1',
    date: '29 mai 2024',
    contenu : [
      'La fonctionnalité Chantiers signalés est désormais disponible. Elle vous permet d\'identifier rapidement les Politiques prioritaires du Gouvernement nécessitant une attention particulière et, le cas échéant, la mise en place de mesures adéquates afin de garantir la réussite de leur déploiement sur votre territoire. Plus d\'informations à venir dans le centre d\'aide prochainement.',
    ],
    correctifs : [],
  }, {
    version: 'Version 2.4.5',
    date: '27 mai 2024',
    contenu : ['Exports des données : les mailles applicables à chaque chantier sont prises en compte dans les exports .csv. générés à partir du bouton "Exporter les données" sur la page d\'accueil'],
    correctifs : [ 
      'Navigation entre les pages de PILOTE : les filtres sélectionnés sur la page d\'accueil sont conservés même lorsque l\'on navigue entre plusieurs pages.',
      'Rapport détaillé : il peut désormais être téléchargé à tous les niveaux du territoire, y compris avec le détail des chantiers.',
    ],
  }, {
    version: 'Version 2.4.4',
    date: '22 mai 2024',
    contenu : [
      'Exports des données : pour chaque PPG, les axes sont disponibles dans l\'export.',
      'Affichage des données : les "référents PILOTE" sont dorénavant renommés en tant que coordinateur PILOTE départemental ou régional.',
    ],
    correctifs: [],
  }, {
    version: 'Version 2.4.3',
    date: '14 mai 2024',
    contenu : ['Gestion des indicateurs : une interface de gestion des indicateurs des PPG est désormais disponible (pour les profils DITP uniquement)'],
    correctifs : [
      'Calcul des taux d\'avancement : Si des données sont manquantes pour des indicateurs pris en compte dans le calcul du taux d\'avancement de la PPG, alors le taux d\'avancement de la PPG n\'est plus calculé et apparaît comme non renseigné.',
      'Groupement des taux d\'avancement par ministère sur la page d\'accueil : les PPG ne sont plus groupés par ministères par défaut sur la page d\'accueil.',
      'Navigation sur PILOTE : des améliorations techniques ont été apportées afin de diminuer considérablement le temps de chargement des pages.',
    ],
  }, {
    version: 'Version 2.4.2',
    date: '9 avril 2024',
    contenu : [
      'Gestion des comptes : la fonctionnalité de gestion des comptes utilisateurs par les coordinateurs PILOTE est disponible. Elle sera déployée progressivement à tous les coordinateurs PILOTE de chaque territoire.',
      'Exports des données : les exports .csv réalisés à partir du bouton "exporter les données" peuvent prendre en compte les filtres sélectionnés sur la page d\'accueil.',
    ],
    correctifs: [],
  },
];

export const derniereVersionNouveaute = ParametrageNouveautés[0].version;
