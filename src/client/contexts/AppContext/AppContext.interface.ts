export type Territoire = {
  codeInsee: string,
  nom: string,
  sousTerritoires: Territoire[],
  codeInseeParent?: string | undefined,
};

export default interface AppContextType {
  départements: Territoire[],
  régions: Territoire[],
}
