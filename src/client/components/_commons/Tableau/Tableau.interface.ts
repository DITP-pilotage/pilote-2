export default interface TableauProps {
  colonnes: {
    label: string,
    nom: string,
    render?: Function, 
  }[],
  donnees: {
    id: number,
    [key: string]: any
  }[],
  resume?: string
}