import { RoleName } from './utilisateur.model';

// Ce qu'on envoie pour se connecter (POST /api/auth/login)
export interface LoginRequest {
  email: string;
  motDePasse: string;
}

// Ce que le backend répond après une connexion réussie
export interface LoginResponse {
  token: string;
  type: string;
}

// Ce qu'un visiteur envoie pour créer un compte lecteur (POST /api/auth/inscription)
export interface InscriptionRequest {
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  motDePasse: string;
}

// Ce que contient le token JWT une fois décodé
export interface JwtPayload {
  sub: string; // l'email de l'utilisateur
  id: number;
  nom: string;
  prenom: string;
  roles: RoleName[];
  permissions: string[];
  iat: number; // date de création du token (en secondes)
  exp: number; // date d'expiration du token (en secondes)
}
