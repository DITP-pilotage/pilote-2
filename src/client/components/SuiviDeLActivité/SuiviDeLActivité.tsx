import PageVide from '@/components/_commons/PageVide/PageVide';
// import api from '@/server/infrastructure/api/trpc/api';

export default function SuiviDeLActivité() {
  //Chantier territorialisé
  // api.chantier.récupérerStatistiquesAvancements.useQuery({
  //   chantiers: ['CH-0001', 'CH-0008'],
  //   maille: 'nationale',
  // });

  // api.chantier.récupérerStatistiquesAvancements.useQuery({
  //   chantiers: ['CH-0001', 'CH-0008'],
  //   maille: 'régionale',
  // });

  // api.chantier.récupérerStatistiquesAvancements.useQuery({
  //   chantiers: ['CH-0001', 'CH-0008'],
  //   maille: 'départementale',
  // });

  //Chantier non territorialisé
  // api.chantier.récupérer.useQuery({
  //   chantierId: 'CH-0008',
  // });

  // const t = api.synthèseDesRésultats.créer.useMutation({});
  
  // useEffect(() => {
  //   t.mutate({
  //     contenu: 'nhh',
  //     météo: 'SOLEIL',
  //     csrf: récupérerUnCookie('csrf') ?? '',
  //     chantierId: 'CH-0008',
  //     territoireCode: 'DEPT-22',
  //   });

  //   t.mutate({
  //     contenu: 'nhh',
  //     météo: 'SOLEIL',
  //     csrf: récupérerUnCookie('csrf') ?? '',
  //     chantierId: 'CH-0008',
  //     territoireCode: 'REG-53',
  //   });

  //   t.mutate({
  //     contenu: 'nhh',
  //     météo: 'SOLEIL',
  //     csrf: récupérerUnCookie('csrf') ?? '',
  //     chantierId: 'CH-0008',
  //     territoireCode: 'NAT-FR',
  //   });
  // }, []);
  

  // api.synthèseDesRésultats.récupérerLaPlusRécente.useQuery({
  //   chantierId: 'CH-0001',
  //   territoireCode: 'DEPT-22',
  // });

  // api.synthèseDesRésultats.récupérerLaPlusRécente.useQuery({
  //   chantierId: 'CH-0001',
  //   territoireCode: 'REG-53',
  // });

  // api.synthèseDesRésultats.récupérerLaPlusRécente.useQuery({
  //   chantierId: 'CH-0001',
  //   territoireCode: 'NAT-FR',
  // });

  // api.synthèseDesRésultats.récupérerLaPlusRécente.useQuery({
  //   chantierId: 'CH-0008',
  //   territoireCode: 'DEPT-22',
  // });

  // api.synthèseDesRésultats.récupérerLaPlusRécente.useQuery({
  //   chantierId: 'CH-0008',
  //   territoireCode: 'REG-53',
  // });

  // api.synthèseDesRésultats.récupérerLaPlusRécente.useQuery({
  //   chantierId: 'CH-0008',
  //   territoireCode: 'NAT-FR',
  // });
  return (
    <PageVide titre="Suivi de l'activité" />
  );
}
  
