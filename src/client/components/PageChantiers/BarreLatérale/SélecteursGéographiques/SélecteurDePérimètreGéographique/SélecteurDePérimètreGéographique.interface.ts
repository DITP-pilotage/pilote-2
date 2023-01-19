export type PérimètreGéographiqueIdentifiant = {
  codeInsee: string,
  maille: 'nationale' | 'départementale' | 'régionale',
};

export type PérimètreGéographique = PérimètreGéographiqueIdentifiant & {
  nom: string,
};
