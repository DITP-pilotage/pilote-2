export const calculerNouvelleMaille = (nouveauFiltre: string[]) => {
  let nouvelleMaille = 'departementale';
  if (nouveauFiltre.includes('regionale') && !nouveauFiltre.includes('departementale')) {
    nouvelleMaille = 'regionale';
  }
  return nouvelleMaille;
};
