import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, of } from 'rxjs';

import { ArticleService } from '../../../core/api/article.service';
import { CategorieService } from '../../../core/api/categorie.service';
import { ApiError } from '../../../core/models/api-error.model';
import { Categorie } from '../../../core/models/categorie.model';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { Panel } from '../../../shared/ui/panel/panel';
import { Spinner } from '../../../shared/ui/spinner/spinner';
import { ToastService } from '../../../shared/ui/toast/toast.service';

// Catégories du site
//  - Admin : LECTURE SEULE (/admin/categories)
//  - Responsable éditorial : créer, renommer, supprimer (/editorial/categories, data: { modifiable: true })
@Component({
  selector: 'app-admin-categories',
  imports: [ReactiveFormsModule, Panel, ConfirmDialog, Spinner],
  templateUrl: './categories.html',
  styleUrl: './categories.css',
})
export class AdminCategories {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly categorieService = inject(CategorieService);
  private readonly articleService = inject(ArticleService);

  // Rempli par la route (data: { modifiable: true }) : false par défaut = lecture seule
  modifiable = input(false);

  // undefined = chargement
  protected readonly categories = signal<Categorie[] | undefined>(undefined);
  private readonly articles = toSignal(this.articleService.lister().pipe(catchError(() => of([]))), {
    initialValue: [],
  });

  // Formulaire : sert à CRÉER, ou à MODIFIER si enModification() contient une catégorie
  protected readonly formulaire = this.fb.group({
    nom: ['', [Validators.required, Validators.maxLength(100)]],
    description: [''],
  });
  protected readonly enModification = signal<Categorie | null>(null);
  protected readonly aSupprimer = signal<Categorie | null>(null);

  protected readonly enCours = signal(false);
  protected readonly erreur = signal<string | null>(null);
  private readonly toast = inject(ToastService); // messages de succès en bas de l'écran

  // Nombre d'articles par catégorie : { categorieId → { publies, total } }
  protected readonly compteurs = computed(() => {
    const resultat = new Map<number, { publies: number; total: number }>();
    for (const a of this.articles()) {
      const c = resultat.get(a.categorieId) ?? { publies: 0, total: 0 };
      c.total++;
      if (a.statut === 'PUBLIE') c.publies++;
      resultat.set(a.categorieId, c);
    }
    return resultat;
  });

  constructor() {
    this.charger();
  }

  private charger(): void {
    this.categorieService.lister().subscribe({
      next: (liste) => this.categories.set([...liste].sort((x, y) => x.nom.localeCompare(y.nom))),
      error: () => this.categories.set([]),
    });
  }

  // ===== Créer / modifier =====
  protected commencerModification(categorie: Categorie): void {
    this.enModification.set(categorie);
    this.formulaire.setValue({ nom: categorie.nom, description: categorie.description ?? '' });
    this.erreur.set(null);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // le formulaire est en haut de la page
  }

  protected annulerModification(): void {
    this.enModification.set(null);
    this.formulaire.reset();
    this.erreur.set(null);
  }

  protected enregistrer(): void {
    if (this.formulaire.invalid) {
      this.formulaire.markAllAsTouched();
      return;
    }
    const v = this.formulaire.getRawValue();
    const donnees = { nom: v.nom.trim(), description: v.description.trim() || undefined };
    const enCoursDeModif = this.enModification();

    const requete = enCoursDeModif
      ? this.categorieService.modifier(enCoursDeModif.id, donnees) // PUT /api/categories/{id}
      : this.categorieService.creer(donnees); // POST /api/categories

    this.enCours.set(true);
    this.erreur.set(null);
    requete.subscribe({
      next: (c) => {
        this.toast.succes(enCoursDeModif ? `Catégorie « ${c.nom} » modifiée.` : `Catégorie « ${c.nom} » créée.`);
        this.annulerModification();
        this.charger();
        this.enCours.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.erreur.set((e.error as ApiError | null)?.message ?? 'Enregistrement impossible.');
        this.enCours.set(false);
      },
    });
  }

  // ===== Supprimer (après confirmation) =====
  protected supprimer(): void {
    const categorie = this.aSupprimer();
    this.aSupprimer.set(null);
    if (!categorie) {
      return;
    }
    this.erreur.set(null);
    this.categorieService.supprimer(categorie.id).subscribe({
      next: () => {
        this.toast.succes(`Catégorie « ${categorie.nom} » supprimée.`);
        this.categories.update((liste) => liste?.filter((c) => c.id !== categorie.id));
      },
      // Ex. : "Impossible de supprimer cette catégorie : des articles l'utilisent encore."
      error: (e: HttpErrorResponse) => this.erreur.set((e.error as ApiError | null)?.message ?? 'Suppression impossible.'),
    });
  }

  protected aUneErreur(): boolean {
    const c = this.formulaire.controls.nom;
    return c.touched && c.invalid;
  }
}
