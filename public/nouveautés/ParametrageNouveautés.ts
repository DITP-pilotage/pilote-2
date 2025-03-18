interface Nouveautés {
  version: string;
  date: string;
  lienCentreAide?: string;
  contenu: string[];
  correctifs: string[];
  centreAide: string[]
}

export const ParametrageNouveautés: Nouveautés[] = [
  {
    version: 'Version 2.7.3',
    date: '18 mars 2025',
    contenu: [
      "Sur les pages de chaque chantier, vous pouvez désormais mieux suivre et comparer l'évolution des résultats d'un territoire. Dans la nouvelle tuile « Données de comparaison de l'avancement », vous pouvez ainsi retrouver la situation par rapport aux autres départements avec l'écart par rapport à la médiane. De plus, vous pouvez également suivre l'évolution temporelle du taux d'avancement grâce à la tendance.",
      'Gestion des comptes (profils coordinateurs PILOTE uniquement) : vous pouvez désormais exporter les données concernant les utilisateurs de votre territoire en format .csv, exploitables sur des logiciels de tableur (libre office ou excel)',
      "Pour permettre une meilleure compréhension du calcul du taux d'avancement, la notion de « Valeur Actuelle », précédemment affichée dans PILOTE, est dorénavant renommée « Valeur d'avancement » sur l'ensemble des pages. Ce terme reflète plus clairement la définition de cette valeur : l'état d'avancement d'un indicateur à une date donnée.",
    ],
    correctifs: [
      "Gestion des comptes (profils coordinateurs uniquement) : lors de la désactivation ou la réactivation d'un compte précédemment désactivé, une erreur empêchait l'envoi automatique d'un mail de réinitialisation de mot de passe. Cette erreur est désormais corrigée.",
      "Affichage des infobulles : celles-ci ont été modifiées pour optimiser leur affichage sur l'ensemble des écrans et navigateurs.",
    ],
    centreAide: [
      "L'article concernant les propositions de valeur d'avancement territoriale a été mis à jour afin d'expliquer les nouvelles fonctionnalités permettant d'identifier ces propositions sur tous les territoires.",
    ],
  },
  {
    version: 'Version 2.7.2',
    date: '28 février 2025',
    contenu: [
      "Affichage des projets structurants locaux : ces projets ne sont plus suivis dans PILOTE. Dans le cadre de l'amélioration continue de l'outil, ils ne sont plus affichés dans l'outil à partir du 28 février 2025. L'onglet permettant d'y accéder sur la page d'accueil est supprimé à partir de cette date",
    ],
    correctifs: [
    ],
    centreAide: [
    ],
  },
  {
    version: 'Version 2.7.1',
    date: '24 février 2025',
    contenu: [
      "Affichage des indicateurs sur les pages des chantiers : Les indicateurs sont désormais présentés en fonction de leur contribution au taux d'avancement de chaque territoire. Il est ainsi plus simple d'identifier si un indicateur est pris en compte pour le taux d'avancement d'un territoire donné, s'il est uniquement pris en compte pour un autre territoire ou à une autre maille, ou s'il ne contribue pas du tout au taux d'avancement. Le type de chaque indicateur est désormais précisé dans sa description, et le nombre total d'indicateurs est affiché pour chaque catégorie.",
      "Personnalisation des cartes sur les pages chantiers : Il est désormais possible de choisir les cartes affichées sur les pages chantiers grâce à un menu déroulant. Ce nouveau sélecteur permet dorénavant de choisir d'afficher les taux d'avancement à horizon 2024.",
      "Proposition de valeurs actuelles : Sur la page d'accueil, un nouveau filtre dans la catégorie « Chantiers signalés » permet d'identifier les chantiers pour lesquels des propositions ont été réalisées sur chaque territoire. Sur la page chantier, le sélecteur de cartes (voir ci-dessus) permet également d'afficher une carte indiquant les territoires ayant soumis une proposition de valeurs actuelles pour un ou plusieurs indicateurs.",
      "Amélioration des exports CSV : Lors de l'export d'un fichier CSV, les cellules vides sont désormais accompagnées d'une indication précisant la raison de l'absence de données (ex. : donnée non renseignée ou non applicable au territoire concerné).",
    ],
    correctifs: [
      "Proposition de valeurs actuelles : Lorsqu'une direction de projet effectue un nouvel import pour un indicateur donné, la proposition du territoire concerné n'apparaît plus dans PILOTE. Un bug empêchait parfois cette mise à jour automatique, il est désormais corrigé.",
      "Affichage des chantiers à l'échelle régionale : Pour les chantiers applicables uniquement à l'échelle régionale, l'affichage par défaut se fait désormais directement à cette maille, évitant ainsi une étape intermédiaire inutile.",
    ],
    centreAide: [
    ],
  },
  {
    version: 'Version 2.6.4',
    date: '06 février 2025',
    contenu: [
      "Sélecteur d'affichage pour le taux d'avancement annuel : Il vous est dorénavant possible de sélectionner l'année à afficher pour le taux d'avancement annuel. Cette fonctionnalité vous permet notamment d'afficher le taux d'avancement pour l'année 2024 en prévision de l'exercice d'évaluation des feuilles de route interministérielles des préfets. Ce sélecteur modifie l'affichage pour la page d'accueil, les pages des PPG, ainsi que dans les exports de données (rapport détaillé en format PDF et exports .csv)",
      "Filtres à partir des tuiles météos : sur la page d'accueil, il est dorénavant possible de filtrer les PPG à partir de leurs météos. Il suffit de cliquer sur chacune des tuiles. Ces filtres sont également répercutés dans les exports de données.",
      "Page PPG : les couleurs et la disposition des jauges des taux d'avancement ont été modifiées afin d'améliorer leur disposition sur toutes les résolutions d'écran. Elles permettent également d'améliorer la fonctionnalité de comparaison des territoires.",
    ],
    correctifs: [
      'Cartes de répartition géographique : une erreur empêchait de visualiser correctement les infobulles pour certains départements.',
    ],
    centreAide: [
    ],
  },
  {
    version: 'Version 2.6.3',
    date: '16 janvier 2025',
    contenu: [
      "Mise en place de l'API PILOTE : l'import et l'export des données PILOTE de manière automatique via API est désormais disponible. Plus d'informations pour les utilisateurs intéressés directement via la documentation API en pied de page de PILOTE ou en contactant directement pilote.ditp@modernisation.gouv.fr",
      "Gestion des comptes (profils DITP ou coordinateurs PILOTE uniquement) : lors de la suppression d'un compte utilisateur, le compte est dorénavant désactivé. Comme précédemment, il ne peut plus avoir accès à PILOTE. Toutefois, il est toujours possible d'accéder aux informations de ce compte via le nouvel onglet 'Comptes désactivés'. Il est désormais également possible de réactiver des comptes précédemment désactivés.",
    ],
    correctifs: [
      "Rapport détaillé : une erreur empêchait la génération d'un rapport détaillé en format PDF en cas de sélection d'un filtre 'Chantiers signalés' sur la page d'accueil de PILOTE. Celle-ci est désormais corrigé.",
      'Gestion des comptes : Les contacts des coordinateurs PILOTE et des responsables locaux figurent sur la page PPG de chaque territoire. Lors de la suppression de ce compte, il pouvait arriver que leurs contacts restent affichés sur la page PPG. Cette erreur est désormais corrigée.',
    ],
    centreAide: [
    ],
  },
  {
    version: 'Version 2.6.2',
    date: '19 décembre 2024',
    contenu: [
      "Information concernant l'évaluation des résultats pour l'année 2024. PILOTE affiche actuellement deux taux d'avancement pour chaque PPG : 1. le taux pour atteindre la cible fixée en 2026, 2. le taux d'avancement de l'année 2024, soit l'année en cours. A partir du 1er janvier 2025, PILOTE basculera automatiquement les taux d'avancements de l'année en cours vers ceux de l'année 2025. Les taux d'avancement correspondant aux cibles 2024 ne seront plus affichés. Afin de faciliter la préparation de l'évaluation des feuilles de route interministérielles des préfets pour l'année 2024, nous vous informons que ces taux d'avancement seront à nouveau visibles dans PILOTE dans le courant du mois de janvier. Pour plus d'informations, vous pouvez contacter l'équipe PILOTE de la DITP : pilote.ditp@modernisation.gouv.fr",
      "Mise en place d'un bandeau d'alerte en cas de retard de mise à jour des indicateurs : Afin d'accompagner les Directeurs de projet et leurs équipes dans l'actualisation des indicateurs, PILOTE affiche désormais une alerte en cas de retard de mise à jour. Cette alerte est affichée directement sur la page de la PPG concernée et n'est visible que par les Directeurs de projet et leurs équipes, ainsi que par la DITP. L'alerte n'est pas affichée dans les territoires. Cette alerte signifie qu'il convient de procéder à une mise à jour des données pour un ou plusieurs indicateurs des PPG. Elle est affichée en prenant en compte les informations concernant la périodicité et le délai de disponibilité des données de chaque indicateur, déclarées dans le formulaire Démarches Simplifiées lors de la phase de cadrage. Pour retrouver toutes ces informations et comprendre le calendrier de mise à jour de chaque indicateur, vous pouvez consulter la rubrique « Description de l'indicateur et calendrier de mise à jour » directement sur la page de la PPG concernée.",

    ],
    correctifs: [
    ],
    centreAide: [
    ],
  },
  {
    version: 'Version 2.6.1',
    date: '12 décembre 2024',
    contenu: [
      "PILOTE se dote d'une nouvelle fonctionnalité permettant aux territoires de proposer des valeurs pour les indicateurs des PPG. Cette fonctionnalité permet de proposer une valeur pour un indicateur, affichée en parallèle des données importées par le Directeur de projet. Elle est réservée aux utilisateurs habilités à rédiger des commentaires pour une PPG sur un territoire. Pensée comme un outil de dialogue supplémentaire, cette fonctionnalité doit vous permettre d'indiquer si vous constatez une différence entre les résultats apportés par la direction de projet et la réalité du terrain. Plus d'informations dans le centre d'aide.",
    ],
    correctifs: [
    ],
    centreAide: [
    ],
  },
  
  {
    version: 'Version 2.5.10',
    date: '21 novembre 2024',
    contenu: [
      "La navigation dans PILOTE est modifiée ! Si vous êtes en administration centrale ou en région, vous pourrez dorénavant choisir d'afficher la maille régionale ou départementale directement depuis les cartes et les jauges affichant la répartition géographique. Le panneau latéral est également modifié. Le filtre 'Territoire' vous permet dorénavant de sélectionner une région ou un département dans un menu unique. Il n'est plus nécessaire de choisir la maille avant de sélectionner un territoire. Dans ce panneau latéral, le bouton permettant de sélectionner la maille est dorénavant supprimé. Cette modification sera bientôt suivie d'autres nouveautés permettant de faciliter la navigation dans PILOTE.",
      "Page d'accueil et Page PPG : modification de l'affichage des jauges de répartition territoriale des taux d'avancement. Afin de faciliter la compréhension de l'affichage du minimum, du maximum et de la médiane des taux d'avancement dans les territoires, ces jauges ont été déplacées dans une tuile séparée. Une infobulle permet d'expliquer le détail des informations.",
      "Export du rapport détaillé : l'export en format PDF a été amélioré. Afin de faciliter la lecture des commentaires, un commentaire rédigé pour un territoire n'est plus divisé sur plusieurs pages. L'affichage d'un seul commentaire est limitée sur une seule page.",
      "Gestion des comptes (profil DITP et coordinateurs PILOTE uniquement) : Lors de la création d'un compte, le menu déroulant permettant de sélectionner les PPG à attribuer pour un compte s'adapte désormais au territoire sélectionné. Les PPG non applicables sur un territoire n'apparaissent plus dans ce menu.",
      "Déclaration d'accessibilité : la déclaration d'accessibilité de PILOTE a été mise à jour.",
    ],
    correctifs: [
      "Page d'accueil : dans la liste des PPG, pour certaines PPG, lorsque l'écart par rapport à la médiane était égal à 0, il pouvait ne pas s'afficher. Désormais, l'écart à la médiane s'affiche pour l'ensemble des PPG, même si celui-ci est nul.",
      'Gestion des comptes (profil DITP uniquement) : la procédure de désactivation des comptes a été modifiée afin de corriger un comportement qui pouvait empêcher la suppression de certains comptes utilisateurs.',
    ],
    centreAide: [
    ],
  },
  {
    version: 'Version 2.5.9',
    date: '7 novembre 2024',
    contenu: [
      "Page d'accueil et page PPG : les cartes des taux d'avancement affichent désormais le taux d'avancement de l'année en cours. De plus, pour chaque indicateur, en plus des valeurs actuelles, elles affichent également les valeurs cibles",
      "Exports csv : il est désormais possible de réaliser un export csv en prenant en compte le filtre 'Chantiers signalés' depuis la page d'accueil",
    ],
    correctifs: [
      "Page d'accueil : correction d'une erreur dans la fonctionnalité de tri des PPG. Celle-ci empechait l'affichage correct des PPG lorsque le type de tri était modifié",
      'Gestion des comptes (profils DITP et coordinateurs PILOTE uniquement) : amélioration de la stabilité du formulaire de création de compte',
    ],
    centreAide: [
    ],
  },
  {
    version: 'Version 2.5.8',
    date: '14 octobre 2024',
    contenu: [],
    correctifs: [
      "Page PPG : correction d'une erreur qui empechait l'affichage de la pondération d'un indicateur à la maille correspondante au niveau régional ou départemental.",
      "Page PPG : correction d'une erreur sur les graphiques d'évolution pour chaque indicateur. Les valeurs des indicateurs pouvaient ne pas apparaître dans l'ordre chronologique.",
      "Page PPG : correction d'une erreur d'affichage dans les historiques de commentaires. L'ensemble des commentaires est à nouveau disponible.",
    ],
    centreAide: [
    ],
  },
  {
    version: 'Version 2.5.7',
    date: '8 octobre 2024',
    contenu: [
      "Page d'accueil : dans la liste des chantiers, ajout d'un tri en fonction de la tendance et de l'écart à la médiane de la maille concernée",
      "Export des données en format csv : ajout du taux d'avancement annuel dans l'export des chantiers",
      "Page d'accueil : ajout d'un bouton permettant de contacter l'équipe PILOTE à partir de la nouvelle adresse pilote.ditp@modernisation.gouv.fr. L'adresse support.ditp@modernisation.gouv.fr sera progressivement remplacée par cette adresse et les messages seront automatiquement transmis sur la nouvelle adresse.",
      "Interface de gestion des indicateurs (réservée aux profils DITP) : amélioration de l'interface (ajout de filtres, modification des champs, etc.)",
    ],
    centreAide: [
    ],
    correctifs: [
      "Page d'accueil : sur le menu 'filtres actifs sur cette page', correction d'une erreur qui empechait la suppression des filtres",
      "Gestion des comptes : amélioration de la configuration de la page afin d'en diminuer le temps de chargement et améliorer la stabilité",
      "Import de données : lors d'un import de valeur initiale, PILOTE prenait en compte la valeur initiale importée à la date la plus ancienne. Dorénavant, la valeur initiale affichée pour chaque indicateur correspond à la dernière valeur importée dans l'outil (même si des VI avec des dates de valeur plus anciennes ont déjà été importées)",
      "Import de données : limitation du nombre de décimales affichées pour chaque valeur d'indicateur",
    ],
  },
  {
    version: 'Version 2.5.6',
    date: '12 septembre 2024',
    contenu : [
      "Page Indicateurs : Précision du calcul de la date de mise à jour de l'indicateur.",
      'Page Indicateurs : Bloc détail des indicateurs : ajout des informations concernant la fréquence de mise à jour des indicateurs + délai de disponibilité.',
      'Page Indicateurs : Fiabilisation du calcul de la date de dernière mise à jour des données.',
      "Page Indicateurs : Dans le bloc indicateurs, ajout d'une infobulle précisant la méthode de calcul de la date prévisionnelle de mise à jour des données.",
      "Page Gestion des comptes : Amélioration de l'affichage de la page de création de comptes.",
      "Page Gestion des comptes : Modification de la désignation d'un directeur de projet et d'un responsable local.",
      "Page Gestion des comptes : Ajout d'une colonne 'territoire' dans la liste des utilisateurs de PILOTE.",
      "Page PPG : Les PPG validées se trouvent désormais par défaut dans la liste des PPG de la page d'accueil, avec un bouton filtre sur les PPG en cours de cadrage (pour les personnes ayant accès à cette fonctionnalité).",
    ],
    correctifs : [
      "Page PPG : Amélioration du temps de chargement de la page chantier pour se conformer aux standards d'eco-conception de produits numériques.",
      "Version mobile : Amélioration de l'accès aux filtres.",
    ],
    centreAide: [
    ],
  },
  {
    version: 'Version 2.5.5',
    date: '23 juillet 2024',
    contenu : [
      "Page PPG : Amélioration de la prise de contact dans PILOTE. Après plusieurs retours de la part des utilisateurs, nous avons décidé d'améliorer la fonctionnalité permettant d'entrer en contact avec les responsables de chaque PPG. Un nouveau bouton 'Contacter' vous permet de générer un courrier électronique directement à destination du directeur de projet, du responsable local ou du coordinateur PILOTE du territoire.",
      "Page PPG : Pour les indicateurs de chaque PPG, dans le cas où l'objectif d'un indicateur doit tendre vers une baisse, cela est désormais précisé sous le titre de chaque indicateur avec une icône flèche spécifique.",
      "Rapport détaillé : Le rapport détaillé poursuit sa mue ! Les PPG sont dorénavant triées par ordre décroissant, à l'instar de la page d'accueil de PILOTE. Les filtres apparaissent également désormais sur la page de couverture de la version PDF du rapport. De plus, les icônes des ministères ont également été ajoutées. De futures améliorations sont également à venir concernant la disposition des pages.",
      "Centre d'aide : Dans le but de favoriser une meilleure prise en main de l'outil, la structure des articles et leur organisation ont été revues.",
    ],
    correctifs : [
    ],
    centreAide: [
    ],
  },
  {
    version: 'Version 2.5.4',
    date: '11 juillet 2024',
    contenu : [
      "Export des données : Pour faciliter les exports des données au format .csv, les filtres 'Chantiers du baromètre' et 'Chantiers territorialisés' sont désormais pris en compte séparément lors de la création d'un export avec filtre. Il est désormais possible de télécharger un export appliquant les filtres séparément et permettant l'export de l'ensemble des chantiers du baromètre ou l'ensemble des chantiers territorialisés (et non les chantiers correspondant à ces deux conditions, comme appliqué auparavant).",
      "Page PPG : Pour les indicateurs de chaque PPG, l'identifiant de l'indicateur et la date de mise à jour prévisionnelle sont désormais affichés.",
    ],
    correctifs : [
      "Rapport détaillé : au format PDF, la page de garde prend désormais en compte l'ensemble des filtres appliqués lors de la création ou de l'impression du rapport. Une erreur empêchant l'affichage de l'ensemble des chantiers dans le rapport sous certaines versions du navigateur Mozilla Firefox a également été corrigée. De prochaines améliorations sont à venir.",
    ],
    centreAide: [
    ],
  },
  {
    version: 'Version 2.5.3',
    date: '2 juillet 2024',
    contenu : [
      "Alertes et PPG signalées : modification du mode de calcul pour l'alerte concernant les écarts à la moyenne nationale. Le calcul de cette alerte a été modifié, et prend en compte désormais les PPG ayant un écart égal ou supérieur à 10 points avec le taux d'avancement territorial médian.",
      "Page d'accueil : ajout de la date de mise à jour des météo et synthèse des résultats dans la liste des chantiers",
      "Page d'accueil : ajout de nouvelles possibilités de tri des PPG. Il est désormais possible de les trier en fonction de la date de mise à jour des taux d'avancement et de la date de mise à jour des météos et synthèse des résultats.",
      'Page PPG : les ministères porteurs sont dorénavant affichés sous le titre de chaque PPG, en haut de page pour simplifier la lecture',
    ],
    correctifs : [
    ],
    centreAide: [
    ],
  },
  {
    version: 'Version 2.5.2',
    date: '11 juin 2024',
    contenu : [
      "Bienvenue sur cette nouvelle page Nouveautés ! Dorénavant, vous retrouverez ici l'ensemble des informations sur les évolutions de PILOTE et les dernières fonctionnalités disponibles ! Une pastille rouge visible depuis la page d'accueil vous indique lorsque des mises à jour de cette page ont été réalisées",
      "Gestion des comptes : Les coordinateurs PILOTE dans les départements et régions ont maintenant pleinement la main pour gérer les comptes d'utilisateur sur leur territoire. Afin de garantir le maintien des règles d'utilisation de PILOTE, le nombre de comptes par territoires a été limité à 150 pour les départements et à 200 pour les régions.",
      "Page PPG : Afin de faciliter la lecture et la compréhension des indicateurs, les champs \"Définition de l'indicateur\" et \"Répartititon géographique du taux d'avancement\" ont été séparés dans deux accordéons distincts.",
    ],
    centreAide: [
    ],
    correctifs : [
      "Correction du calcul des jauges de répartition géographique des taux d'avancement : une erreur empêchait l'affichage du minimum pour certaines PPG.",
      "Rapport détaillé : correction de l'affichage des objectifs des PPG.",
    ],
  }, {
    version: 'Version 2.5.1',
    date: '29 mai 2024',
    contenu : [
      "La fonctionnalité Chantiers signalés est désormais disponible. Elle vous permet d'identifier rapidement les Politiques prioritaires du Gouvernement nécessitant une attention particulière et, le cas échéant, la mise en place de mesures adéquates afin de garantir la réussite de leur déploiement sur votre territoire. Plus d'informations à venir dans le centre d'aide prochainement.",
    ],
    correctifs : [],
    centreAide: [
    ],
  }, {
    version: 'Version 2.4.5',
    date: '27 mai 2024',
    contenu : ["Exports des données : les mailles applicables à chaque chantier sont prises en compte dans les exports .csv. générés à partir du bouton 'Exporter les données' sur la page d'accueil"],
    correctifs : [ 
      "Navigation entre les pages de PILOTE : les filtres sélectionnés sur la page d'accueil sont conservés même lorsque l'on navigue entre plusieurs pages.",
      'Rapport détaillé : il peut désormais être téléchargé à tous les niveaux du territoire, y compris avec le détail des chantiers.',
    ],
    centreAide: [
    ],
  }, {
    version: 'Version 2.4.4',
    date: '22 mai 2024',
    contenu : [
      "Exports des données : pour chaque PPG, les axes sont disponibles dans l'export.",
      "Affichage des données : les 'référents PILOTE' sont dorénavant renommés en tant que coordinateur PILOTE départemental ou régional.",
    ],
    correctifs: [],
    centreAide: [
    ],
  }, {
    version: 'Version 2.4.3',
    date: '14 mai 2024',
    contenu : ['Gestion des indicateurs : une interface de gestion des indicateurs des PPG est désormais disponible (pour les profils DITP uniquement)'],
    correctifs : [
      "Calcul des taux d'avancement : Si des données sont manquantes pour des indicateurs pris en compte dans le calcul du taux d'avancement de la PPG, alors le taux d'avancement de la PPG n'est plus calculé et apparaît comme non renseigné.",
      "Groupement des taux d'avancement par ministère sur la page d'accueil : les PPG ne sont plus groupés par ministères par défaut sur la page d'accueil.",
      'Navigation sur PILOTE : des améliorations techniques ont été apportées afin de diminuer considérablement le temps de chargement des pages.',
    ],
    centreAide: [
    ],
  }, {
    version: 'Version 2.4.2',
    date: '9 avril 2024',
    contenu : [
      'Gestion des comptes : la fonctionnalité de gestion des comptes utilisateurs par les coordinateurs PILOTE est disponible. Elle sera déployée progressivement à tous les coordinateurs PILOTE de chaque territoire.',
      "Exports des données : les exports .csv réalisés à partir du bouton 'exporter les données' peuvent prendre en compte les filtres sélectionnés sur la page d'accueil.",
    ],
    correctifs: [],
    centreAide: [
    ],
  },
];

export const derniereVersionNouveaute = ParametrageNouveautés[0].version;
