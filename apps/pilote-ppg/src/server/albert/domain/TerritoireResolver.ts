export interface TerritoireResolver {
  resoudre(
    territoireCode: string,
    includeSousTerritoires: boolean,
  ): Promise<string[]>;
}
