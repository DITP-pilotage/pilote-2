interface Nouveautés {
  version: string;
  date: string;
  lienCentreAide?: string;
  contenu: string;
  correctifs: string[];
}

export const ParametrageNouveautés: Nouveautés[] = [
  {
    version: 'Version 2.4.0',
    date: '15 novembre 2022',
    lienCentreAide: 'https://dev-pilote-ditp.osc-secnum-fr1.scalingo.io/centreaide/demarrer-avec-pilote/presentation_de_la_page_daccueil',
    contenu: 'Colorisation des cartes : toutes les cartes qui sont liées à un taux d’avancement sont dorénavant coloriées différemment afin d’avoir un meilleur aperçu du taux suivant les territoires. La couleur attribuée à un territoire correspond au taux d’avancement du territoire par tranche de 10% comme dans le bloc Distribution des taux d’avancement de la page d’accueil où les mêmes couleurs ont aussi été utilisées. La légende sous les cartes a été adaptée en conséquence.',
    correctifs: [
      'Certains projets structurants n’apparaissaient pas pour certains utilisateurs.',
      'Correction d’un problème d’affichage de la légende des cartes des météos sur mobile.',
      'Correctif de la dernière version',
    ],
  },
  {
    version: 'Version 2.3.0',
    date: '15 octobre 2022',
    contenu: 'Colorisation des cartes : toutes les cartes qui sont liées à un taux d’avancement sont dorénavant coloriées différemment afin d’avoir un meilleur aperçu du taux suivant les territoires. La couleur attribuée à un territoire correspond au taux d’avancement du territoire par tranche de 10% comme dans le bloc Distribution des taux d’avancement de la page d’accueil où les mêmes couleurs ont aussi été utilisées. La légende sous les cartes a été adaptée en conséquence.',
    correctifs: [
      'Certains projets structurants n’apparaissaient pas pour certains utilisateurs.',
      'Correction d’un problème d’affichage de la légende des cartes des météos sur mobile.',
    ],
  },
  {
    version: 'Version 2.2.0',
    date: '15 mai 2022',
    lienCentreAide: 'https://dev-pilote-ditp.osc-secnum-fr1.scalingo.io/centreaide/demarrer-avec-pilote/presentation_de_la_page_daccueil',
    contenu: 'Colorisation des cartes : toutes les cartes qui sont liées à un taux d’avancement sont dorénavant coloriées différemment afin d’avoir un meilleur aperçu du taux suivant les territoires. La couleur attribuée à un territoire correspond au taux d’avancement du territoire par tranche de 10% comme dans le bloc Distribution des taux d’avancement de la page d’accueil où les mêmes couleurs ont aussi été utilisées. La légende sous les cartes a été adaptée en conséquence.',
    correctifs: [
      'Certains projets structurants n’apparaissaient pas pour certains utilisateurs.',
      'Correction d’un problème d’affichage de la légende des cartes des météos sur mobile.',
      'Un autre correctif',
    ],
  },
];
