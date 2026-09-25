// Les paramètres du footer (GET /api/parametres pour lire, PUT /api/parametres pour modifier)
export interface ParametreSite {
  nomSite: string;
  slogan: string | null;
  emailContact: string | null;
  telephone: string | null;
  adresse: string | null;
  ville: string | null;
  mentionEdition: string | null;
  dateMiseAJour?: string | null; // rempli par le serveur, inutile à l'envoi
}
