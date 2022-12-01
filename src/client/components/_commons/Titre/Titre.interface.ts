type TitreClassName = 'fr-h1' | 'fr-h2' | 'fr-h3' | 'fr-h4' | 'fr-h5' | 'fr-h6';
type TitreAlternatifClassName = 'fr-display-xl' | 'fr-display-lg' | 'fr-display-md' | 'fr-display-sm' | 'fr-display-xs';
type CorpsDeTexteClassName = 'fr-text--lead' | 'fr-text--lg' | 'fr-text' | 'fr-text--sm' | 'fr-text--xs';

export default interface TitreProps {
  children: React.ReactNode
  baliseHtml: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  apparence?: TitreClassName | TitreAlternatifClassName | CorpsDeTexteClassName
}