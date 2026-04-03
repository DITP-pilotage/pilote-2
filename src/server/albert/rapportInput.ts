export type ParagraphePartie = {
  type: "paragraphe";
  contenu: string;
};

export type TableauPartie = {
  type: "tableau";
  en_tetes: string[];
  lignes: string[][];
};

export type SectionPartie = ParagraphePartie | TableauPartie;

export type RapportInput = {
  titre: string;
  date: string;
  resume: string;
  sections: Array<{
    titre: string;
    parties: SectionPartie[];
  }>;
};
