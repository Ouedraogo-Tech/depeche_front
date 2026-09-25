// Les statuts possibles d'un commentaire (enum StatutCommentaire.java)
export type StatutCommentaire = 'PUBLIE' | 'MASQUE' | 'SUPPRIME';

// Un commentaire reçu du backend (GET /api/commentaires/...)
export interface Commentaire {
  id: number;
  contenu: string;
  dateCreation: string;
  statut: StatutCommentaire;
  auteurId: number;
  auteurNomComplet: string;
  articleId: number;
  articleTitre: string;
}

// Ce qu'on envoie pour écrire un commentaire (POST /api/commentaires?articleId=1)
export interface CommentaireRequest {
  contenu: string;
}
