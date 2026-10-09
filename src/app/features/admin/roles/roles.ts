import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';

import { RoleService } from '../../../core/api/role.service';
import { UtilisateurService } from '../../../core/api/utilisateur.service';
import { LIBELLES_ROLES, RoleName } from '../../../core/models/utilisateur.model';
import { Spinner } from '../../../shared/ui/spinner/spinner';

// Libellé lisible de chaque permission : le VERBE d'abord ("Consulter les articles" et non "Article consulter")
const LIBELLES_PERMISSIONS: Record<string, string> = {
  ARTICLE_CONSULTER: 'Consulter les articles',
  ARTICLE_LIRE: 'Lire un article',
  ARTICLE_METTRE_FAVORIS: 'Mettre un article en favori',
  ARTICLE_ECRIRE: 'Rédiger un article',
  ARTICLE_MODIFIER: 'Modifier un article',
  ARTICLE_BROUILLON_ENREGISTRER: 'Enregistrer un brouillon',
  ARTICLE_SOUMETTRE: 'Soumettre un article',
  ARTICLE_PUBLIER: 'Publier un article',
  ARTICLE_PLANIFIER: 'Planifier une publication',
  ARTICLE_VALIDER: 'Valider un article',
  ARTICLE_ARCHIVER: 'Archiver un article',
  ARTICLE_SUPPRIMER: 'Supprimer un article',
  CATEGORIE_CONSULTER: 'Consulter les catégories',
  CATEGORIE_LIRE: 'Lire les catégories',
  CATEGORIE_CREER: 'Créer une catégorie',
  CATEGORIE_MODIFIER: 'Modifier une catégorie',
  CATEGORIE_SUPPRIMER: 'Supprimer une catégorie',
  COMMENTAIRE_ECRIRE: 'Écrire un commentaire',
  COMMENTAIRE_MASQUER: 'Masquer un commentaire',
  COMMENTAIRE_PUBLIER: 'Republier un commentaire',
  COMMENTAIRE_SUPPRIMER: 'Supprimer un commentaire',
  NEWSLETTER_ABONNER: "S'abonner à la newsletter",
  NEWSLETTER_GERER: 'Gérer la newsletter',
  UTILISATEUR_CREER: 'Créer et modifier des comptes',
  UTILISATEUR_DESACTIVER_SUSPENDRE: 'Désactiver ou réactiver un compte',
  ROLE_ATTRIBUER: 'Attribuer un rôle',
  STATISTIQUES_SUIVRE: 'Suivre les statistiques',
  PARAMETRES_GERER: 'Gérer les paramètres du site',
  NOTIFICATION_GERER: 'Gérer les notifications',
};

// Les familles de permissions (le début du code), dans l'ordre d'affichage
const GROUPES: { prefixes: string[]; titre: string; icone: string }[] = [
  { prefixes: ['ARTICLE'], titre: 'Articles', icone: '📰' },
  { prefixes: ['CATEGORIE'], titre: 'Catégories', icone: '🗂️' },
  { prefixes: ['COMMENTAIRE'], titre: 'Commentaires', icone: '💬' },
  { prefixes: ['NEWSLETTER'], titre: 'Newsletter', icone: '✉️' },
  { prefixes: ['UTILISATEUR', 'ROLE'], titre: 'Comptes', icone: '👤' },
  { prefixes: ['STATISTIQUES', 'PARAMETRES', 'NOTIFICATION'], titre: 'Site', icone: '⚙️' },
];

// Présentation de chaque rôle : couleur de la pastille + une phrase
const PRESENTATION: Record<RoleName, { couleur: string; description: string }> = {
  ADMIN: { couleur: 'bg-marine', description: "Gère les comptes et les rôles de l'équipe." },
  RESPONSABLE_EDITORIAL: { couleur: 'bg-amber-600', description: 'Relit, valide et organise les rubriques.' },
  JOURNALISTE: { couleur: 'bg-brique', description: 'Rédige, publie et planifie ses articles.' },
  WEBMASTER: { couleur: 'bg-emerald-700', description: 'Modère les commentaires et gère le site.' },
  LECTEUR: { couleur: 'bg-sky-700', description: 'Lit les articles et les commente.' },
};

// Rôles et leurs permissions (GET /api/roles), avec le nombre de comptes par rôle
@Component({
  selector: 'app-admin-roles',
  imports: [Spinner],
  templateUrl: './roles.html',
  styleUrl: './roles.css',
})
export class AdminRoles {
  private readonly roleService = inject(RoleService);
  private readonly utilisateurService = inject(UtilisateurService);

  protected readonly libellesRoles = LIBELLES_ROLES;
  protected readonly presentation = PRESENTATION;

  protected readonly roles = toSignal(this.roleService.lister().pipe(catchError(() => of([]))), {
    initialValue: undefined,
  });
  private readonly utilisateurs = toSignal(this.utilisateurService.lister().pipe(catchError(() => of([]))), {
    initialValue: [],
  });

  // Les cartes ouvertes (id des rôles dont on voit les permissions)
  protected readonly ouverts = signal<ReadonlySet<number>>(new Set());
  protected readonly toutOuvert = computed(() => {
    const liste = this.roles() ?? [];
    return liste.length > 0 && liste.every((r) => this.ouverts().has(r.id));
  });

  protected basculer(id: number): void {
    this.ouverts.update((ensemble) => {
      const copie = new Set(ensemble);
      if (copie.has(id)) {
        copie.delete(id);
      } else {
        copie.add(id);
      }
      return copie;
    });
  }

  protected toutBasculer(): void {
    this.ouverts.set(this.toutOuvert() ? new Set() : new Set((this.roles() ?? []).map((r) => r.id)));
  }

  protected nombreDeComptes(role: RoleName): number {
    return this.utilisateurs().filter((u) => u.roles.includes(role)).length;
  }

  // Les permissions d'un rôle rangées par famille (seules les familles non vides sont gardées)
  protected parGroupe(permissions: string[]): { titre: string; icone: string; libelles: string[] }[] {
    return GROUPES.map((g) => ({
      titre: g.titre,
      icone: g.icone,
      libelles: permissions
        .filter((p) => g.prefixes.some((prefixe) => p.startsWith(prefixe + '_')))
        .map((p) => this.libellePermission(p))
        .sort((x, y) => x.localeCompare(y)),
    })).filter((g) => g.libelles.length > 0);
  }

  // Permission inconnue de la liste : "NOUVELLE_PERMISSION" → "Nouvelle permission"
  private libellePermission(permission: string): string {
    const connu = LIBELLES_PERMISSIONS[permission];
    if (connu) {
      return connu;
    }
    const texte = permission.toLowerCase().replace(/_/g, ' ');
    return texte.charAt(0).toUpperCase() + texte.slice(1);
  }
}
