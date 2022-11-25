import Home from 'client/pages/Home/Home';
import HomeProps from 'client/pages/Home/Home.interface';

export default function HomePage({ user }: HomeProps) {
  return (
    <Home user={user} />
  );
}

export async function getServerSideProps() {
  return {
    props: {
      user: {
        firstname: 'Jean',
        lastname: 'Dupont',
      },
    },
  };
}
