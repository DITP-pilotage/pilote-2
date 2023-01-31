type CartographieÉlémentDeLégende = {
  couleur: string,
  libellé: string,
  picto?: string,
  hachures?: string
};

export default interface CartographieLégendeProps {
  élémentsDeLégende: CartographieÉlémentDeLégende[],
}
