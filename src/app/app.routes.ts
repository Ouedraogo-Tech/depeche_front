import { Routes } from '@angular/router';

import { roleGuard } from './core/guards/role.guard';
import { PublicLayout } from './layouts/public-layout/public-layout';

// Chaque page est chargée À LA DEMANDE (loadComponent) : son code n'est téléchargé
// qu'à sa première ouverture. Un lecteur ne télécharge jamais le code de l'espace admin.
// "title" = titre de l'onglet (TitreDepeche ajoute " – Dépêche 226" à la fin).

export const routes: Routes = [
  // ===== Connexion : page SEULE (sans header, flash-bar, carte newsletter ni footer) =====
  // Placée AVANT le site public : Angular prend la première route qui correspond.
  {
    path: 'connexion',
    title: 'Connexion',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  // Mot de passe oublié (lecteurs et administrateurs) : pages seules, comme la connexion
  {
    path: 'mot-de-passe-oublie',
    title: 'Mot de passe oublié',
    loadComponent: () => import('./features/auth/mot-de-passe-oublie/mot-de-passe-oublie').then((m) => m.MotDePasseOublie),
  },
  {
    path: 'reinitialiser-mot-de-passe', // lien reçu par e-mail : ?jeton=…
    title: 'Nouveau mot de passe',
    loadComponent: () =>
      import('./features/auth/reinitialiser-mot-de-passe/reinitialiser-mot-de-passe').then((m) => m.ReinitialiserMotDePasse),
  },

  // ===== Site public : http://localhost:4200/ (ouvert à tous) =====
  {
    path: '',
    component: PublicLayout, // le cadre du site public est chargé tout de suite (première page vue)
    children: [
      {
        path: '',
        title: 'Actualités du Burkina Faso',
        loadComponent: () => import('./features/public/home/home').then((m) => m.Home),
      },
      {
        path: 'articles/:id',
        title: 'Article', // remplacé par le titre de l'article dès qu'il est chargé
        loadComponent: () => import('./features/public/article-detail/article-detail').then((m) => m.ArticleDetail),
      },
      {
        path: 'inscription',
        title: 'Créer un compte',
        loadComponent: () => import('./features/auth/inscription/inscription').then((m) => m.Inscription),
      },
      {
        path: 'a-propos',
        title: 'À propos',
        loadComponent: () => import('./features/public/a-propos/a-propos').then((m) => m.APropos),
      },
      {
        // Pages légales : textes rédigés par le webmaster (Paramètres du site)
        path: 'mentions-legales',
        title: 'Mentions légales',
        data: { type: 'mentions' },
        loadComponent: () => import('./features/public/page-legale/page-legale').then((m) => m.PageLegale),
      },
      {
        path: 'confidentialite',
        title: 'Politique de confidentialité',
        data: { type: 'confidentialite' },
        loadComponent: () => import('./features/public/page-legale/page-legale').then((m) => m.PageLegale),
      },
      {
        // Lien "Se désabonner" des e-mails de la newsletter : /newsletter/desabonnement?jeton=…
        path: 'newsletter/desabonnement',
        title: 'Désabonnement',
        loadComponent: () => import('./features/public/desabonnement/desabonnement').then((m) => m.Desabonnement),
      },
    ],
  },

  // ===== Espace administrateur : /admin (ADMIN seulement) =====
  {
    path: 'admin',
    loadComponent: () => import('./layouts/backoffice-layout/backoffice-layout').then((m) => m.BackofficeLayout),
    canActivate: [roleGuard],
    data: { role: 'ADMIN' },
    children: [
      { path: '', redirectTo: 'tableau-de-bord', pathMatch: 'full' }, // /admin → /admin/tableau-de-bord
      {
        path: 'tableau-de-bord',
        title: 'Tableau de bord',
        loadComponent: () => import('./features/admin/dashboard/dashboard').then((m) => m.DashboardAdmin),
      },
      {
        path: 'articles',
        title: 'Articles',
        loadComponent: () => import('./features/admin/articles/articles').then((m) => m.AdminArticles),
      },
      {
        path: 'categories',
        title: 'Catégories',
        loadComponent: () => import('./features/admin/categories/categories').then((m) => m.AdminCategories),
      },
      {
        path: 'roles',
        title: 'Rôles & permissions',
        loadComponent: () => import('./features/admin/roles/roles').then((m) => m.AdminRoles),
      },
      {
        path: 'historique',
        title: 'Historique',
        loadComponent: () => import('./features/admin/historique/historique').then((m) => m.AdminHistorique),
      },
      {
        path: 'parametres',
        title: 'Paramètres du site',
        loadComponent: () => import('./features/admin/parametres/parametres').then((m) => m.AdminParametres),
      },
      {
        path: 'profil',
        title: 'Mon profil',
        loadComponent: () => import('./features/profil/profil').then((m) => m.Profil),
      },
      {
        path: 'personnel',
        title: 'Personnel',
        loadComponent: () => import('./features/admin/personnel/personnel').then((m) => m.AdminPersonnel),
      },
      {
        path: 'personnel/nouveau', // AVANT personnel/:id, sinon "nouveau" serait pris pour un id
        title: 'Créer un compte',
        loadComponent: () => import('./features/admin/creer-compte/creer-compte').then((m) => m.CreerCompte),
      },
      {
        path: 'personnel/:id',
        title: 'Fiche du membre',
        loadComponent: () => import('./features/admin/fiche-utilisateur/fiche-utilisateur').then((m) => m.FicheUtilisateur),
      },
      {
        path: 'personnel/:id/modifier',
        title: 'Modifier un compte',
        loadComponent: () => import('./features/admin/modifier-compte/modifier-compte').then((m) => m.ModifierCompte),
      },
    ],
  },

  // ===== Espace journaliste : /journaliste (JOURNALISTE seulement) =====
  {
    path: 'journaliste',
    loadComponent: () => import('./layouts/backoffice-layout/backoffice-layout').then((m) => m.BackofficeLayout),
    canActivate: [roleGuard],
    data: { role: 'JOURNALISTE' },
    children: [
      { path: '', redirectTo: 'tableau-de-bord', pathMatch: 'full' }, // /journaliste → /journaliste/tableau-de-bord
      {
        path: 'tableau-de-bord',
        title: 'Tableau de bord',
        loadComponent: () => import('./features/journaliste/dashboard/dashboard').then((m) => m.DashboardJournaliste),
      },
      {
        path: 'mes-articles',
        title: 'Mes articles',
        loadComponent: () => import('./features/journaliste/mes-articles/mes-articles').then((m) => m.MesArticles),
      },
      {
        path: 'articles/:id/modifier',
        title: "Modifier l'article",
        loadComponent: () => import('./features/journaliste/modifier-article/modifier-article').then((m) => m.ModifierArticle),
      },
      {
        path: 'nouvel-article',
        title: 'Nouvel article',
        loadComponent: () => import('./features/journaliste/nouvel-article/nouvel-article').then((m) => m.NouvelArticle),
      },
      {
        path: 'commentaires',
        title: 'Commentaires',
        loadComponent: () => import('./features/journaliste/commentaires/commentaires').then((m) => m.CommentairesJournaliste),
      },
      {
        path: 'notifications',
        title: 'Notifications',
        loadComponent: () => import('./features/notifications/notifications').then((m) => m.Notifications),
      },
      {
        path: 'profil',
        title: 'Mon profil',
        loadComponent: () => import('./features/profil/profil').then((m) => m.Profil),
      },
    ],
  },

  // ===== Espace responsable éditorial : /editorial (RESPONSABLE_EDITORIAL seulement) =====
  {
    path: 'editorial',
    loadComponent: () => import('./layouts/backoffice-layout/backoffice-layout').then((m) => m.BackofficeLayout),
    canActivate: [roleGuard],
    data: { role: 'RESPONSABLE_EDITORIAL' },
    children: [
      { path: '', redirectTo: 'tableau-de-bord', pathMatch: 'full' }, // /editorial → /editorial/tableau-de-bord
      {
        path: 'tableau-de-bord',
        title: 'Tableau de bord éditorial',
        loadComponent: () => import('./features/editorial/dashboard/dashboard').then((m) => m.DashboardEditorial),
      },
      {
        path: 'validation',
        title: 'Validation des articles',
        loadComponent: () => import('./features/editorial/validation/validation').then((m) => m.Validation),
      },
      {
        path: 'rediger',
        title: 'Rédiger un article',
        data: { boutonSoumettre: false },
        loadComponent: () => import('./features/journaliste/nouvel-article/nouvel-article').then((m) => m.NouvelArticle),
      },
      {
        // Ses propres articles (brouillons, planifiés…) : même page que le journaliste, sans "Soumettre"
        path: 'mes-articles',
        title: 'Mes articles',
        data: { boutonSoumettre: false },
        loadComponent: () => import('./features/journaliste/mes-articles/mes-articles').then((m) => m.MesArticles),
      },
      {
        path: 'articles/:id/modifier',
        title: "Modifier l'article",
        data: { boutonSoumettre: false },
        loadComponent: () => import('./features/journaliste/modifier-article/modifier-article').then((m) => m.ModifierArticle),
      },
      {
        path: 'notifications',
        title: 'Notifications',
        loadComponent: () => import('./features/notifications/notifications').then((m) => m.Notifications),
      },
      {
        path: 'categories',
        title: 'Catégories',
        data: { modifiable: true },
        loadComponent: () => import('./features/admin/categories/categories').then((m) => m.AdminCategories),
      },
      {
        path: 'historique',
        title: 'Historique',
        loadComponent: () => import('./features/admin/historique/historique').then((m) => m.AdminHistorique),
      },
      {
        path: 'profil',
        title: 'Mon profil',
        loadComponent: () => import('./features/profil/profil').then((m) => m.Profil),
      },
    ],
  },

  // ===== Espace webmaster : /webmaster (WEBMASTER seulement) =====
  {
    path: 'webmaster',
    loadComponent: () => import('./layouts/backoffice-layout/backoffice-layout').then((m) => m.BackofficeLayout),
    canActivate: [roleGuard],
    data: { role: 'WEBMASTER' },
    children: [
      { path: '', redirectTo: 'tableau-de-bord', pathMatch: 'full' }, // /webmaster → /webmaster/tableau-de-bord
      {
        path: 'tableau-de-bord',
        title: 'Tableau de bord',
        loadComponent: () => import('./features/webmaster/dashboard/dashboard').then((m) => m.DashboardWebmaster),
      },
      {
        path: 'moderation',
        title: 'Modération',
        loadComponent: () => import('./features/webmaster/moderation/moderation').then((m) => m.Moderation),
      },
      {
        path: 'parametres',
        title: 'Paramètres du site',
        data: { modifiable: true },
        loadComponent: () => import('./features/admin/parametres/parametres').then((m) => m.AdminParametres),
      },
      {
        path: 'newsletter',
        title: 'Newsletter',
        loadComponent: () => import('./features/webmaster/newsletter/newsletter').then((m) => m.Newsletter),
      },
      {
        path: 'profil',
        title: 'Mon profil',
        loadComponent: () => import('./features/profil/profil').then((m) => m.Profil),
      },
    ],
  },

  // ===== Toute autre adresse → page 404, dans le cadre du site public =====
  // TOUJOURS EN DERNIER : Angular teste les routes dans l'ordre, "**" attrape tout ce qui reste.
  {
    path: '**',
    component: PublicLayout,
    children: [
      {
        path: '',
        title: 'Page introuvable',
        loadComponent: () => import('./features/public/page-introuvable/page-introuvable').then((m) => m.PageIntrouvable),
      },
    ],
  },
];
