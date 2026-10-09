// Les statuts possibles d'un article (enum StatutArticle.java)
export type StatutArticle =
  | 'BROUILLON'
  | 'SOUMIS'
  | 'A_REVISER'
  | 'REFUSE'
  | 'PUBLIE'
  | 'PLANIFIE'
  | 'ARCHIVE';

// Un article reçu du backend (GET /api/articles/...)
export interface Article {
  id: number;
  titre: string;
  slug?: string | null; // adresse publique lisible : /articles/{slug}
  resume: string | null;
  contenu: string;
  image: string | null;
  lienVideo: string | null; // lien YouTube (facultatif)
  // Infos internes à la rédaction : ABSENTES des réponses du site public (/api/articles/publies)
  statut: StatutArticle;
  commentaireEditorial: string | null;
  datePublicationSouhaitee?: string | null; // date demandée en soumettant (article SOUMIS)
  dateCreation: string;
  datePublication: string | null;
  auteurId: number;
  auteurNomComplet: string;
  categorieId: number;
  categorieNom: string;
}

// Ce qu'on envoie pour créer ou modifier un article (POST / PUT /api/articles)
export interface ArticleRequest {
  titre: string;
  resume?: string;
  contenu: string;
  image?: string;
  lienVideo?: string; // "" = retirer la vidéo
  categorieId: number;
}

// Le commentaire du responsable éditorial (valider / demander une modification / refuser)
export interface DecisionEditoriale {
  commentaire?: string;
}
