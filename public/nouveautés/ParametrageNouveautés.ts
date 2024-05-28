interface Nouveautés {
  version: string;
  date: string;
  lienCentreAide?: string;
  contenu: string[];
  correctifs: string[];
}

export const ParametrageNouveautés: Nouveautés[] = [
  {
    version: 'Version 2.4.4',
    date: '27 mai 2024',
    contenu : ['Exports des données : les mailles applicables à chaque chantier sont prises en compte dans les exports .csv. générés à partir du bouton "Exporter les données" sur la page d\'accueil'],
    correctifs : [ 
      'Navigation entre les pages de PILOTE : les filtres sélectionnés sur la page d\'accueil sont conservés même lorsque l\'on navigue entre plusieurs pages.',
      'Rapport détaillé : il peut désormais être téléchargé à tous les niveaux du territoire, y compris avec le détail des chantiers.',
    ],
  }, {
    version: 'Version 2.4.3',
    date: '22 mai 2024',
    contenu : [
      'Exports des données : pour chaque PPG, les axes sont disponibles dans l\'export.',
      'Affichage des données : les "référents PILOTE" sont dorénavant renommés en tant que coordinateur PILOTE départemental ou régional.',
    ],
    correctifs: [],
  }, {
    version: 'Version 2.4.2',
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
      'Gestion des comptes : la fonctionnalité de gestion des comptes utilisateurs par les coordinateurs PILOTE est disponible. Elle sera déployée progressivement à tous les coordinateurs de chaque territoire.',
      'Exports des données : les exports .csv réalisés à partir du bouton "exporter les données" peuvent prendre en compte les filtres sélectionnés sur la page d\'accueil.',
    ],
    correctifs: [],
  },
];
