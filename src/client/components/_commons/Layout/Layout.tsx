import LayoutProps from './Layout.interface';
import Header from './Header/Header';

export default function Layout({ children }: LayoutProps) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}