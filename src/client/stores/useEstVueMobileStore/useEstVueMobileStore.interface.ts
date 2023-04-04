export default interface EstVueMobileStore {
  estVueMobile: boolean | null,
  actions: {
    modifierEstVueMobile: (estVueMobile: boolean | null) => void,
  },
}
