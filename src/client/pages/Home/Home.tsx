import HomeProps from './Home.interface';
import styles from './Home.module.scss';

export default function Home({ user }: HomeProps) {
  return (
    <div className={styles.container}>
      <main className='fr-container'>
        <h1>
          Squelette NextJS
        </h1>
        <p className={styles.description}>
          {JSON.stringify(user)}
        </p>
      </main>
      <footer className={styles.footer}>
        Ceci est le footer
      </footer>
    </div>
  );
}