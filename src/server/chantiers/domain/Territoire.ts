export const maillesInternes = ['regionale', 'departementale'] as const;
export const mailles = ['nationale', ...maillesInternes] as const;

export type Maille = typeof mailles[number];

export type Territoire = {
  code: string,
  nom: string,
  nomAffiché: string,
  codeInsee: string,
  codeParent: string | null,
  maille: Maille,
};
