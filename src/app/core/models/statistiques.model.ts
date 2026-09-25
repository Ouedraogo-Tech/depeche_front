import { StatutArticle } from './article.model';

// Les chiffres des dashboards (GET /api/statistiques)
export interface Statistiques {
  articlesParStatut: Record<StatutArticle, number>; // ex : { PUBLIE: 132, BROUILLON: 9, SOUMIS: 7, ... }
  totalArticles: number;
  totalCategories: number;
  totalUtilisateurs: number;
  utilisateursActifs: number;
  utilisateursDesactives: number;
  totalRoles: number;
  totalCommentaires: number;
  commentairesMasques: number;
  abonnesActifs: number;
}
