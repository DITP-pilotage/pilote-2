export default function usePageCréerUtilisateurAide() {
  const paragraphes = [
    {
      titre: 'Responsabilités du Référent',
      text: "En tant que référent, vous gérez activement les comptes au sein de votre domaine. Cela comprend leur création, modification et suppression. Attribuez les comptes avec discernement, seulement aux personnes impliquées directement avec l'outil et ses données. L'intégrité d'utilisation est primordiale.",
    },
    {
      titre: 'Confidentialité des Données',
      text: "Les informations traitées par PILOTE sont strictement confidentielles. Veillez à ne pas les divulguer et à maintenir une sécurité rigoureuse. La DITP se réserve le droit d'intervenir sur les comptes non conformes.",
    },
    {
      titre: 'Exigences de Connexion',
      text: 'Les comptes doivent être associés à une adresse mail professionnelle valide (.gouv.fr). En cas de questions ou de demandes particulières, le support de la DITP est à votre disposition pour vous aider.',
    },
  ];
  
  const etapes = [
    {
      titre: 'Remplissage du Formulaire',
      texte: 'Remplissez le formulaire de demande de compte sur le site.',
    },
    {
      titre: 'Confirmation par Email',
      texte: "Consultez votre messagerie pour l'email de confirmation.",
    },
    {
      titre: 'Gestion du Compte',
      texte: 'Gérez la sécurité et les paramètres de votre compte.',
    },
  ];

  return {
    paragraphes,
    etapes,
  };
}
