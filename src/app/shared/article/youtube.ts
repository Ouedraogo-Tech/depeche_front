// Outils pour les liens YouTube des articles (la vidéo reste sur YouTube : on n'héberge rien)

// Même règle que ArticleRequestDTO.java : youtube.com/watch?v=…, youtu.be/…, youtube.com/shorts/…
export const MOTIF_LIEN_YOUTUBE =
  /^$|^https:\/\/(www\.|m\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)[A-Za-z0-9_-]{11}([?&#].*)?$/;

// "https://youtu.be/dQw4w9WgXcQ" → "dQw4w9WgXcQ" (l'identifiant de 11 caractères), ou null
export function identifiantYoutube(lien: string | null | undefined): string | null {
  const resultat = lien?.match(/(?:watch\?v=|shorts\/|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return resultat ? resultat[1] : null;
}

// Miniature fournie gratuitement par YouTube pour chaque vidéo
export function miniatureYoutube(lien: string | null | undefined): string | null {
  const id = identifiantYoutube(lien);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}
