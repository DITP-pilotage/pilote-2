import { NextApiRequest, NextApiResponse } from 'next';

export default function handleImportIndicateur(request: NextApiRequest, response: NextApiResponse) {
  // eslint-disable-next-line no-console 
  console.info(request); // le temps de développer la feature

  response.status(200);
}
