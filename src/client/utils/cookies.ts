export function récupérerUnCookie(nom: string): string | undefined {
  const cookies = document.cookie.split('; ');

  for (const cookie of cookies) {
    const [nomDuCookie, contenu] = cookie.split('=');
    if (nomDuCookie === nom) 
      return decodeURIComponent(contenu);
  }

  return undefined;
}
