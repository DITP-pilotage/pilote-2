import LayoutProps from './Layout.interface';
import Header from './Header/Header';
import Footer from './Footer/Footer';

export default function Layout({ children }: LayoutProps) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}