import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { EMPTY, Subject, catchError, merge, switchMap, timer } from 'rxjs';

import { ArticleService } from '../../../core/api/article.service';
import { StatutArticle } from '../../../core/models/article.model';
import { Panel } from '../../../shared/ui/panel/panel';
import { StatCard } from '../../../shared/ui/stat-card/stat-card';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';

// Une ligne du tableau "Publications par auteur"
interface LigneAuteur {
  auteurId: number;
  nom: string;
  publies: number;
  enAttente: number;
  brouillons: number;
  total: number;
}

// Page "Articles" de l'administrateur : chiffres, publications par auteur, liste complète
@Component({
  selector: 'app-admin-articles',
  imports: [DatePipe, RouterLink, Panel, StatCard, StatusBadge],
  templateUrl: './articles.html',
  styleUrl: './articles.css',
})
export class AdminArticles {
  private readonly articleService = inject(ArticleService);

  // Clic sur "Actualiser" → on relance le chargement tout de suite
  private readonly actualiser$ = new Subject<void>();

  // Tous les articles (GET /api/articles), rechargés toutes les 30 s ET à chaque clic sur "Actualiser".
  // undefined = premier chargement en cours. En cas d'erreur, on garde la liste précédente (EMPTY).
  protected readonly articles = toSignal(
    merge(timer(0, 30000), this.actualiser$).pipe(
      switchMap(() => this.articleService.lister().pipe(catchError(() => EMPTY))),
    ),
    { initialValue: undefined },
  );

  private readonly liste = computed(() => this.articles() ?? []);

  // ===== Les 4 cartes =====
  protected readonly nbTotal = computed(() => this.liste().length);
  protected readonly nbPublies = computed(() => this.compter('PUBLIE'));
  protected readonly nbEnAttente = computed(() => this.compter('SOUMIS'));
  protected readonly nbBrouillons = computed(() => this.compter('BROUILLON'));

  // ===== Publications par auteur : on regroupe les articles par auteurId =====
  protected readonly parAuteur = computed<LigneAuteur[]>(() => {
    const lignes = new Map<number, LigneAuteur>();
    for (const a of this.liste()) {
      const ligne = lignes.get(a.auteurId) ?? {
        auteurId: a.auteurId, nom: a.auteurNomComplet, publies: 0, enAttente: 0, brouillons: 0, total: 0,
      };
      ligne.total++;
      if (a.statut === 'PUBLIE') ligne.publies++;
      if (a.statut === 'SOUMIS') ligne.enAttente++;
      if (a.statut === 'BROUILLON') ligne.brouillons++;
      lignes.set(a.auteurId, ligne);
    }
    // Du plus grand nombre de publications au plus petit
    return [...lignes.values()].sort((x, y) => y.publies - x.publies || y.total - x.total);
  });

  // Pour la longueur des barres (le meilleur auteur = barre pleine)
  protected readonly maxPublies = computed(() => Math.max(1, ...this.parAuteur().map((l) => l.publies)));

  // ===== Liste filtrée =====
  protected readonly statutFiltre = signal<StatutArticle | 'TOUS'>('TOUS');
  protected readonly recherche = signal('');
  protected readonly statuts: StatutArticle[] = ['PUBLIE', 'SOUMIS', 'BROUILLON', 'A_REVISER', 'REFUSE', 'PLANIFIE', 'ARCHIVE'];

  protected readonly articlesFiltres = computed(() => {
    const motCle = this.recherche().trim().toLowerCase();
    return this.liste().filter(
      (a) =>
        (this.statutFiltre() === 'TOUS' || a.statut === this.statutFiltre()) &&
        (motCle === '' || a.titre.toLowerCase().includes(motCle) || a.auteurNomComplet.toLowerCase().includes(motCle)),
    );
  });

  protected actualiser(): void {
    this.actualiser$.next();
  }

  private compter(statut: StatutArticle): number {
    return this.liste().filter((a) => a.statut === statut).length;
  }
}
