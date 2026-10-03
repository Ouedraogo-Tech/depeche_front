// Les noms des rôles, tels qu'ils sont en base et dans le token JWT
export type RoleName = 'ADMIN' | 'JOURNALISTE' | 'RESPONSABLE_EDITORIAL' | 'WEBMASTER' | 'LECTEUR';

// Le type de compte à choisir lors de la création (enum RoleType.java)
export type RoleType =
  | 'ROLE_ADMIN'
  | 'ROLE_JOURNALISTE'
  | 'ROLE_RESPONSABLE_EDITORIAL'
  | 'ROLE_WEBMASTER'
  | 'ROLE_LECTEUR';

// Un utilisateur reçu du backend (GET /api/utilisateurs, GET /api/utilisateurs/moi)
export interface Utilisateur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
    photo: string | null; // photo de profil (null = pas de photo → initiales)
  roles: RoleName[];
  actif: boolean;
  dateInscription: string | null;
}

// Ce que l'admin envoie pour créer un compte (POST /api/utilisateurs)
export interface UtilisateurRequest {
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  motDePasse: string;
  typeUtilisateur: RoleType;
}

// Ce qu'on envoie pour modifier un compte (PUT /api/utilisateurs/{id} ou /moi)
export interface UtilisateurModification {
  nom: string;
  prenom: string;
  telephone?: string;
  motDePasse?: string;
    photo?: string; // absente = inchangée, "" = retirée, "/uploads/..." = nouvelle photo
}
// Texte affiché pour chaque rôle (tableaux, fiches, listes déroulantes)
export const LIBELLES_ROLES: Record<RoleName, string> = {
  ADMIN: 'Administrateur',
  JOURNALISTE: 'Journaliste',
  RESPONSABLE_EDITORIAL: 'Resp. éditorial',
  WEBMASTER: 'Webmaster',
  LECTEUR: 'Lecteur',
};
