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

// Ce que le webmaster envoie pour expédier la newsletter (POST /api/newsletter/envoyer)
export interface EnvoiNewsletter {
  objet: string;
  abonneIds: number[];
  articleIds: number[];
}

// Réponse de l'envoi : combien d'e-mails sont partis, lesquels ont échoué
export interface ResultatEnvoi {
  envoyes: number;
  echecs: number;
  adressesEnEchec: string[];
}
