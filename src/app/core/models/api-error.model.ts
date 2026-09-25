// Format de TOUTES les erreurs renvoyées par le backend
export interface ApiError {
  erreur: string; // le type d'erreur, ex : "Données invalides", "Accès refusé"
  message: string; // le message à afficher, ex : "Le titre est obligatoire"
}
