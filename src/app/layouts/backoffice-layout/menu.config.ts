import { RoleName } from '../../core/models/utilisateur.model';

// Un lien du menu de la barre latérale
export interface LienMenu {
  libelle: string;
  chemin: string;
}

// Un espace : son titre + son menu
export interface Espace {
  titre: string;
  menu: LienMenu[];
}

// Le menu de chaque rôle (repris des maquettes)
export const ESPACES: Partial<Record<RoleName, Espace>> = {
  ADMIN: {
    titre: 'Espace administrateur',
    menu: [
      { libelle: 'Dashboard admin', chemin: '/admin/tableau-de-bord' },
      { libelle: 'Personnel', chemin: '/admin/personnel' },
      { libelle: 'Articles', chemin: '/admin/articles' },
      { libelle: 'Catégories', chemin: '/admin/categories' },
      { libelle: 'Rôles & permissions', chemin: '/admin/roles' },
      { libelle: 'Historique', chemin: '/admin/historique' },
      { libelle: 'Profil', chemin: '/admin/profil' },
      { libelle: 'Paramètres', chemin: '/admin/parametres' },
    ],
  },
  JOURNALISTE: {
    titre: 'Espace journaliste',
    menu: [
      { libelle: 'Dashboard', chemin: '/journaliste/tableau-de-bord' },
      { libelle: 'Mes articles', chemin: '/journaliste/mes-articles' },
      { libelle: 'Nouvel article', chemin: '/journaliste/nouvel-article' },
      { libelle: 'Commentaires', chemin: '/journaliste/commentaires' },
      { libelle: 'Notifications', chemin: '/journaliste/notifications' },
      { libelle: 'Profil', chemin: '/journaliste/profil' },
    ],
  },
  RESPONSABLE_EDITORIAL: {
    titre: 'Responsable éditorial',
    menu: [
      { libelle: 'Dashboard éditorial', chemin: '/editorial/tableau-de-bord' },
      { libelle: 'Validation articles', chemin: '/editorial/validation' },
      { libelle: 'Rédiger un article', chemin: '/editorial/rediger' },
      { libelle: 'Mes articles', chemin: '/editorial/mes-articles' },
      { libelle: 'Catégories', chemin: '/editorial/categories' },
      { libelle: 'Historique', chemin: '/editorial/historique' },
      { libelle: 'Notifications', chemin: '/editorial/notifications' },
      { libelle: 'Profil', chemin: '/editorial/profil' },
    ],
  },

    WEBMASTER: {
    titre: 'Espace webmaster',
    menu: [
      { libelle: 'Dashboard', chemin: '/webmaster/tableau-de-bord' },
      { libelle: 'Commentaires', chemin: '/webmaster/moderation' },
      { libelle: 'Paramètres du site', chemin: '/webmaster/parametres' },
      { libelle: 'Newsletter', chemin: '/webmaster/newsletter' },
      { libelle: 'Profil', chemin: '/webmaster/profil' },
    ],
  },
};
