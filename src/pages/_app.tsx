/* eslint-disable react/jsx-props-no-spreading */
import type { AppProps } from 'next/app';

// Design system external dependencies
import 'remixicon/fonts/remixicon.css';
import '/public/fonts/marianne.css';
import '/public/fonts/spectral.css';

export default function App({ Component, pageProps }: AppProps) {
  return (<Component {...pageProps} />);
}
