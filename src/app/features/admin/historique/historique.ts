import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, linkedSignal, signal } from '@angular/core';

import { ArticleService } from '../../../core/api/article.service';
import { ApiError } from '../../../core/models/api-error.model';
import { Article, StatutArticle } from '../../../core/models/article.model';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';
import { Spinner } from '../../../shared/ui/spinner/spinner';
import { ToastService } from '../../../shared/ui/toast/toast.service';

// Pour chercher sans tenir compte des majuscules ni des accents : "Économie" → "economie"
const normaliser = (texte: string) => texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Libellés des statuts dans le filtre
const LIBELLES_STATUT: Record<StatutArticle, string> = {
  PUBLIE: 'Publiés',
  SOUMIS: 'Soumis',
  BROUILLON: 'Brouillons',
  A_REVISER: 'À réviser',
  REFUSE: 'Refusés',
  PLANIFIE: 'Planifiés',
  ARCHIVE: 'Archivés',
};

// Historique : tous les articles, du plus récent au plus ancien, avec recherche, filtres, pagination et archivage.
// Admin (/admin/historique) et responsable éditorial (/editorial/historique).
@Component({
  selector: 'app-admin-historique',
  imports: [DatePipe, StatusBadge, Spinner, ConfirmDialog],
  templateUrl: './historique.html',
  styleUrl: './historique.css',
})
export class AdminHistorique {
  private readonly articleService = inject(ArticleService);
  private readonly toast = inject(ToastService);

  // undefined = chargement
  private readonly articles = signal<Article[] | undefined>(undefined);

  protected readonly statuts: StatutArticle[] = ['PUBLIE', 'SOUMIS', 'BROUILLON', 'A_REVISER', 'REFUSE', 'PLANIFIE', 'ARCHIVE'];
  protected readonly libellesStatut = LIBELLES_STATUT;

  // ===== Les filtres (un signal par champ de la barre de recherche) =====
  protected readonly recherche = signal('');
  protected readonly categorieFiltre = signal(''); // '' = toutes
  // 'TOUS' = tous les articles SAUF les archivés (archiver sert justement à alléger la liste)
  protected readonly statutFiltre = signal<StatutArticle | 'TOUS'>('TOUS');
  protected readonly dateDebut = signal(''); // format "2026-09-01" (champ date)
  protected readonly dateFin = signal('');

  // ===== Archivage (après confirmation) =====
  protected readonly aArchiver = signal<Article | null>(null);
  protected readonly erreur = signal<string | null>(null);

  constructor() {
    this.articleService.lister().subscribe({
      next: (liste) => this.articles.set(liste),
      error: () => this.articles.set([]),
    });
  }

  // Les catégories proposées = celles des articles existants, par ordre alphabétique
  protected readonly categories = computed(() =>
    [...new Set((this.articles() ?? []).map((a) => a.categorieNom))].sort((x, y) => x.localeCompare(y)),
  );

  protected readonly filtresActifs = computed(
    () => !!(this.recherche() || this.categorieFiltre() || this.statutFiltre() !== 'TOUS' || this.dateDebut() || this.dateFin()),
  );

  // Date de référence = date de publication, sinon date de création ; tri du plus récent au plus ancien
  protected readonly lignes = computed(() => {
    const liste = this.articles();
    if (!liste) {
      return undefined;
    }
    const texte = normaliser(this.recherche().trim());
    const debut = this.dateDebut();
    const fin = this.dateFin();
    const statut = this.statutFiltre();

    return liste
      .map((a) => ({ ...a, dateReference: a.datePublication ?? a.dateCreation }))
      .filter((a) => !texte || normaliser(`${a.titre} ${a.auteurNomComplet}`).includes(texte))
      .filter((a) => !this.categorieFiltre() || a.categorieNom === this.categorieFiltre())
      .filter((a) => (statut === 'TOUS' ? a.statut !== 'ARCHIVE' : a.statut === statut))
      // "2026-09-15T10:30:00".slice(0, 10) = "2026-09-15" : se compare directement au champ date
      .filter((a) => !debut || a.dateReference.slice(0, 10) >= debut)
      .filter((a) => !fin || a.dateReference.slice(0, 10) <= fin)
      .sort((x, y) => y.dateReference.localeCompare(x.dateReference));
  });

  // Nombre d'articles archivés (rappelé sous la liste)
  protected readonly nbArchives = computed(() => (this.articles() ?? []).filter((a) => a.statut === 'ARCHIVE').length);

  // ===== Pagination (10 articles par page par défaut) =====
  protected readonly taillesPage = [10, 20, 50];
  protected readonly taillePage = signal(10);
  // Page courante (1 = première) : revient à 1 dès qu'un filtre ou la taille de page change
  protected readonly page = linkedSignal({
    source: () => ({
      r: this.recherche(),
      c: this.categorieFiltre(),
      s: this.statutFiltre(),
      d: this.dateDebut(),
      f: this.dateFin(),
      t: this.taillePage(),
    }),
    computation: () => 1,
  });
  protected readonly nbPages = computed(() => Math.max(1, Math.ceil((this.lignes()?.length ?? 0) / this.taillePage())));
  // Les articles de la page affichée seulement
  protected readonly lignesPage = computed(() => {
    const page = Math.min(this.page(), this.nbPages());
    const debut = (page - 1) * this.taillePage();
    return (this.lignes() ?? []).slice(debut, debut + this.taillePage());
  });
  // "11–20 sur 134"
  protected readonly intervalle = computed(() => {
    const total = this.lignes()?.length ?? 0;
    const debut = (Math.min(this.page(), this.nbPages()) - 1) * this.taillePage() + 1;
    return `${debut}–${Math.min(debut + this.taillePage() - 1, total)} sur ${total}`;
  });

  protected allerPage(numero: number): void {
    this.page.set(Math.min(Math.max(1, numero), this.nbPages()));
  }

  // Archivable : ni en relecture (décision éditoriale en attente), ni déjà archivé
  protected archivable(a: Article): boolean {
    return a.statut !== 'SOUMIS' && a.statut !== 'ARCHIVE';
  }

  // PATCH /api/articles/{id}/archiver : l'article quitte le site et la liste par défaut
  protected archiver(): void {
    const article = this.aArchiver();
    this.aArchiver.set(null);
    if (!article) {
      return;
    }
    this.erreur.set(null);
    this.articleService.archiver(article.id).subscribe({
      next: (maj) => {
        this.articles.update((liste) => liste?.map((a) => (a.id === maj.id ? maj : a)));
        this.toast.succes('Article archivé.');
      },
      error: (e: HttpErrorResponse) => this.erreur.set((e.error as ApiError | null)?.message ?? 'Archivage impossible.'),
    });
  }

  protected effacerFiltres(): void {
    this.recherche.set('');
    this.categorieFiltre.set('');
    this.statutFiltre.set('TOUS');
    this.dateDebut.set('');
    this.dateFin.set('');
  }
}
