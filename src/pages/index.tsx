import Home from 'client/pages/Home/Home';
import HomeProps from 'client/pages/Home/Home.interface';
import getHomePageProps from 'server/pages/home/home';

export default function HomePage({ user }: HomeProps) {
  return (
    <Home user={user} />
  );
}

export async function getServerSideProps() {
  return getHomePageProps();
}
