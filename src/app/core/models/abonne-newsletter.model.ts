// Un abonné reçu du backend (GET /api/newsletter, réservé au webmaster)
export interface AbonneNewsletter {
  id: number;
  email: string;
  dateAbonnement: string;
  actif: boolean;
}

// Ce qu'un visiteur envoie pour s'abonner (POST /api/newsletter/abonner)
export interface AbonnementRequest {
  email: string;
}
