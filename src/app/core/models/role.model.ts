import { RoleName } from './utilisateur.model';

// Un rôle et ses permissions (GET /api/roles, réservé à l'admin)
export interface Role {
  id: number;
  nom: RoleName;
  permissions: string[]; // ex : ["ARTICLE_ECRIRE", "ARTICLE_SOUMETTRE", ...]
}
