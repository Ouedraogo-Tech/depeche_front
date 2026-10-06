import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

import { ArticleService } from '../../../core/api/article.service';
import { ApiError } from '../../../core/models/api-error.model';
import { Article, StatutArticle } from '../../../core/models/article.model';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { STATUTS_MODIFIABLES } from '../modifier-article/modifier-article';
import { Spinner } from '../../../shared/ui/spinner/spinner';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';

// Les onglets de filtre (Tous + un par statut utile au journaliste)
const ONGLETS: { valeur: StatutArticle | 'TOUS'; libelle: string }[] = [
  { valeur: 'TOUS', libelle: 'Tous' },
  { valeur: 'BROUILLON', libelle: 'Brouillons' },
  { valeur: 'SOUMIS', libelle: 'En attente' },
  { valeur: 'A_REVISER', libelle: 'À réviser' },
  { valeur: 'PLANIFIE', libelle: 'Planifiés' },
  { valeur: 'PUBLIE', libelle: 'Publiés' },
  { valeur: 'REFUSE', libelle: 'Refusés' },
  { valeur: 'ARCHIVE', libelle: 'Archivés' },
];

// Les statuts depuis lesquels on peut publier ou planifier soi-même.
// PAS "SOUMIS" : en relecture, seul le responsable éditorial décide (le serveur le refuse aussi).
const STATUTS_PUBLIABLES: StatutArticle[] = ['BROUILLON', 'A_REVISER', 'REFUSE'];

// Les statuts depuis lesquels on peut (re)soumettre : un article refusé peut être corrigé puis resoumis
const STATUTS_SOUMETTABLES: StatutArticle[] = ['BROUILLON', 'A_REVISER', 'REFUSE'];

// Sans majuscules ni accents : "Économie" → "economie"
const normaliser = (texte: string) => texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Date au format du champ <input type="datetime-local"> : "2026-10-05T08:00" (heure locale)
const versChampDate = (d: Date) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

// "Mes articles" : /journaliste/mes-articles et /editorial/mes-articles (GET /api/articles/moi)
@Component({
  selector: 'app-mes-articles',
  imports: [DatePipe, RouterLink, StatusBadge, ConfirmDialog, Spinner, EmptyState],
  templateUrl: './mes-articles.html',
  styleUrl: './mes-articles.css',
})
export class MesArticles {
  private readonly articleService = inject(ArticleService);

  // false pour le responsable éditorial (route data) : il n'a pas la permission ARTICLE_SOUMETTRE
  boutonSoumettre = input(true, { transform: (v: boolean | undefined) => v ?? true });

  // L'espace dans lequel la page est ouverte : "/journaliste" ou "/editorial" (pour construire les liens)
  protected readonly espace = '/' + inject(Router).url.split('/')[1];

  protected readonly onglets = ONGLETS;
  protected readonly statutsPubliables = STATUTS_PUBLIABLES;
  protected readonly statutsSoumettables = STATUTS_SOUMETTABLES;

  // undefined = chargement
  protected readonly articles = signal<Article[] | undefined>(undefined);
  protected readonly erreur = signal<string | null>(null);

  protected readonly ongletActif = signal<StatutArticle | 'TOUS'>('TOUS');
  protected readonly recherche = signal('');
  // Modifier / supprimer : seulement brouillon, à réviser ou refusé
  protected readonly statutsModifiables = STATUTS_MODIFIABLES;
  protected readonly aSupprimer = signal<Article | null>(null);

  // Archiver (article publié) : après confirmation
  protected readonly aArchiver = signal<Article | null>(null);

  // Planifier OU soumettre : l'article choisi + la date saisie dans la fenêtre
  // ('soumettre' : la date est facultative, c'est la date de publication SOUHAITÉE)
  protected readonly aPlanifier = signal<Article | null>(null);
  protected readonly modeFenetre = signal<'planifier' | 'soumettre'>('planifier');
  protected readonly datePlanifiee = signal('');
  protected readonly dateMinimum = signal(versChampDate(new Date()));

  // Nombre d'articles par onglet (affiché dans chaque onglet)
  protected readonly compteurs = computed(() => {
    const compte = new Map<StatutArticle | 'TOUS', number>([['TOUS', this.articles()?.length ?? 0]]);
    for (const a of this.articles() ?? []) {
      compte.set(a.statut, (compte.get(a.statut) ?? 0) + 1);
    }
    return compte;
  });

  // La liste affichée : filtrée par onglet + recherche, du plus récent au plus ancien
  protected readonly lignes = computed(() => {
    const texte = normaliser(this.recherche().trim());
    return (this.articles() ?? [])
      .filter((a) => this.ongletActif() === 'TOUS' || a.statut === this.ongletActif())
      .filter((a) => !texte || normaliser(`${a.titre} ${a.categorieNom}`).includes(texte))
      .map((a) => ({ ...a, dateReference: a.datePublication ?? a.dateCreation }))
      .sort((x, y) => y.dateReference.localeCompare(x.dateReference));
  });

  constructor() {
    this.articleService.mesArticles().subscribe({
      next: (liste) => this.articles.set(liste),
      error: () => {
        this.articles.set([]);
        this.erreur.set('Impossible de charger vos articles.');
      },
    });
  }

  // Brouillon, À réviser ou Refusé → Soumis : on ouvre la fenêtre (date de publication souhaitée facultative)
  protected ouvrirSoumission(article: Article): void {
    this.dateMinimum.set(versChampDate(new Date()));
    this.datePlanifiee.set('');
    this.modeFenetre.set('soumettre');
    this.aPlanifier.set(article);
  }

  // Bouton de la fenêtre : planifier ou soumettre selon le mode
  protected validerFenetre(): void {
    if (this.modeFenetre() === 'planifier') {
      this.planifier();
      return;
    }
    const article = this.aPlanifier();
    const date = this.datePlanifiee();
    if (!article) {
      return;
    }
    if (date && new Date(date) <= new Date()) {
      this.erreur.set('Choisissez une date et une heure dans le futur.');
      return;
    }
    this.aPlanifier.set(null);
    this.changerStatut(this.articleService.soumettre(article.id, date ? `${date}:00` : null), 'Soumission impossible.');
  }

  // → Publié : visible tout de suite sur le site
  protected publier(article: Article): void {
    this.changerStatut(this.articleService.publier(article.id), 'Publication impossible.');
  }

  // ===== Planifier =====
  protected ouvrirPlanification(article: Article): void {
    // Proposition par défaut : demain à 8 h
    const demain = new Date();
    demain.setDate(demain.getDate() + 1);
    demain.setHours(8, 0, 0, 0);
    this.dateMinimum.set(versChampDate(new Date()));
    this.datePlanifiee.set(versChampDate(demain));
    this.modeFenetre.set('planifier');
    this.aPlanifier.set(article);
  }

  // PATCH /planifier?date=... : l'article passe PLANIFIÉ, le backend le publie tout seul à l'heure dite
  protected planifier(): void {
    const article = this.aPlanifier();
    const date = this.datePlanifiee();
    if (!article || !date) {
      return;
    }
    if (new Date(date) <= new Date()) {
      this.erreur.set('Choisissez une date et une heure dans le futur.');
      return;
    }
    this.aPlanifier.set(null);
    this.changerStatut(this.articleService.planifier(article.id, `${date}:00`), 'Planification impossible.');
  }

  // Annuler une planification : l'article redevient un brouillon
  protected annulerPlanification(article: Article): void {
    this.changerStatut(this.articleService.remettreEnBrouillon(article.id), 'Annulation impossible.');
  }

  // ===== Archiver (après confirmation) : l'article disparaît du site, sans être supprimé =====
  protected archiver(): void {
    const article = this.aArchiver();
    this.aArchiver.set(null);
    if (article) {
      this.changerStatut(this.articleService.archiver(article.id), 'Archivage impossible.');
    }
  }

  // DELETE /api/articles/{id} (après confirmation) : l'article et ses commentaires disparaissent
  protected supprimer(): void {
    const article = this.aSupprimer();
    this.aSupprimer.set(null);
    if (!article) {
      return;
    }
    this.erreur.set(null);
    this.articleService.supprimer(article.id).subscribe({
      next: () => this.articles.update((liste) => liste?.filter((a) => a.id !== article.id)),
      error: (e: HttpErrorResponse) => this.erreur.set((e.error as ApiError | null)?.message ?? 'Suppression impossible.'),
    });
  }

  // On remplace l'article dans la liste par la version renvoyée par le backend
  private changerStatut(requete: Observable<Article>, messageErreur: string): void {
    this.erreur.set(null);
    requete.subscribe({
      next: (maj) => this.articles.update((liste) => liste?.map((a) => (a.id === maj.id ? maj : a))),
      error: (e: HttpErrorResponse) => this.erreur.set((e.error as ApiError | null)?.message ?? messageErreur),
    });
  }
}
