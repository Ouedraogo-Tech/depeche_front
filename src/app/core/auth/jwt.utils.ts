import { JwtPayload } from '../models/auth.model';

// Lit le contenu d'un token JWT.
// Renvoie null si le token est abîmé ou illisible.
export function lireToken(token: string): JwtPayload | null {
  try {
    // Un token a 3 parties séparées par des points : entête.CONTENU.signature
    const contenu = token.split('.')[1];

    // Le contenu est encodé en "base64url" : on le remet en base64 classique
    const base64 = contenu.replace(/-/g, '+').replace(/_/g, '/');

    // On décode (TextDecoder garde les accents : "Ouédraogo")
    const octets = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(octets);

    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

// true si la date d'expiration du token est dépassée
export function tokenExpire(payload: JwtPayload): boolean {
  // "exp" est en SECONDES, Date.now() en MILLISECONDES : on multiplie par 1000
  return payload.exp * 1000 < Date.now();
}
