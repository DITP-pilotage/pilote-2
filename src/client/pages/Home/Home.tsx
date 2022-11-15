import HomeProps from './Home.interface';
import styles from './Home.module.scss';
import { Alert } from '@dataesr/react-dsfr';

export default function Home({ user }: HomeProps) {
  return (
    <div className={styles.container}>
      <main>
        <h1>
          Squelette NextJS
        </h1>
        <p className={styles.description}>
          {JSON.stringify(user)}
        </p>
        <Alert
          closable
          description="Ceci est une super alerte"
          title="Information"
        />
      </main>
      <footer className={styles.footer}>
        Ceci est le footer
      </footer>
    </div>
  );
}