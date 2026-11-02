// Un engagement de la rédaction (page « À propos »)
export interface Engagement {
  titre: string;
  texte: string;
}

// La page « À propos » (GET /api/parametres/a-propos pour lire, PUT pour modifier : webmaster)
export interface APropos {
  texte: string; // présentation : une ligne vide sépare deux paragraphes
  anneeCreation: number | null; // null = case « Année de création » cachée
  engagements: Engagement[];
  dateMiseAJour?: string | null; // rempli par le serveur, inutile à l'envoi
}
