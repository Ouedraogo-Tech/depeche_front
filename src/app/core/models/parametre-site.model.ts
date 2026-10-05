// Les paramètres du footer (GET /api/parametres pour lire, PUT /api/parametres pour modifier)
export interface ParametreSite {
  nomSite: string;
  slogan: string | null;
  emailContact: string | null;
  telephone: string | null;
  adresse: string | null;
  ville: string | null;
  mentionEdition: string | null;
  // Réseaux sociaux : logos cliquables du footer (null = logo caché)
  lienFacebook?: string | null;
  lienYoutube?: string | null;
  lienWhatsapp?: string | null;
  lienInstagram?: string | null;
  lienLinkedin?: string | null;
  // Pages légales : /mentions-legales et /confidentialite
  mentionsLegales?: string | null;
  politiqueConfidentialite?: string | null;
  dateMiseAJour?: string | null; // rempli par le serveur, inutile à l'envoi
}

// Les réseaux sociaux gérés, dans l'ordre d'affichage des logos
export type NomReseau = 'facebook' | 'youtube' | 'whatsapp' | 'instagram' | 'linkedin';

export const RESEAUX_SOCIAUX: { nom: NomReseau; libelle: string; champ: keyof ParametreSite; exemple: string }[] = [
  { nom: 'facebook', libelle: 'Facebook', champ: 'lienFacebook', exemple: 'https://www.facebook.com/depeche226' },
  { nom: 'youtube', libelle: 'YouTube', champ: 'lienYoutube', exemple: 'https://www.youtube.com/@depeche226' },
  { nom: 'whatsapp', libelle: 'WhatsApp', champ: 'lienWhatsapp', exemple: 'https://wa.me/22670000000' },
  { nom: 'instagram', libelle: 'Instagram', champ: 'lienInstagram', exemple: 'https://www.instagram.com/depeche226' },
  { nom: 'linkedin', libelle: 'LinkedIn', champ: 'lienLinkedin', exemple: 'https://www.linkedin.com/company/depeche226' },
];
