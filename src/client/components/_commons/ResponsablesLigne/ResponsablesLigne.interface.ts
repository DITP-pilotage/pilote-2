export default interface ResponsablesLigneProps {
  estEnTeteDePageChantier: boolean,
  libellé: string,
  estNomResponsable: (string | undefined | null)[],
  estEmailResponsable?: (string | null)[]
}
