// Les types de notification (enum TypeNotification.java)
export type TypeNotification =
  | 'ARTICLE_SOUMIS'
  | 'ARTICLE_VALIDE'
  | 'ARTICLE_A_REVISER'
  | 'ARTICLE_REFUSE'
  | 'ARTICLE_PUBLIE'
  | 'NOUVEAU_COMMENTAIRE';

// Une notification reçue du backend (GET /api/notifications)
export interface NotificationUtilisateur {
  id: number;
  message: string;
  type: TypeNotification;
  lue: boolean;
  dateCreation: string;
  articleId: number | null;
}
