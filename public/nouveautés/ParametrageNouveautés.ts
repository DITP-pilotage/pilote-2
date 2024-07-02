interface Nouveautés {
  version: string;
  date: string;
  lienCentreAide?: string;
  contenu: string[];
  correctifs: string[];
}

export const ParametrageNouveautés: Nouveautés[] = [
  {
    version: 'Version 2.4.8',
    date: '2 juillet 2024',
    contenu : [
      'Alertes et PPG signalées : modification du mode de calcul pour l\'alerte concernant les écarts à la moyenne nationale. Le calcul de cette alerte a été modifié, et prend en compte désormais les PPG ayant un écart égal ou supérieur à 10 points avec le taux d\'avancement territorial médian.',
      'Page d’accueil : ajout de la date de mise à jour des météo et synthèse des résultats dans la liste des chantiers',
      'Page PPG : les ministères porteurs sont dorénavant affichés sous le titre de chaque PPG, en haut de page pour simplifier la lecture',
    ],
    correctifs : [
    ],
  },
  {
    version: 'Version 2.4.7',
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
    version: 'Version 2.4.6',
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
