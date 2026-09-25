// Une catégorie reçue du backend (GET /api/categories)
export interface Categorie {
  id: number;
  nom: string;
  description: string | null;
}

// Ce qu'on envoie pour créer ou modifier une catégorie (POST / PUT /api/categories)
export interface CategorieRequest {
  nom: string;
  description?: string;
}

