import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ParametreService } from '../../../core/api/parametre.service';
import { APropos, Engagement } from '../../../core/models/a-propos.model';
import { ApiError } from '../../../core/models/api-error.model';
import { Panel } from '../../../shared/ui/panel/panel';
import { Spinner } from '../../../shared/ui/spinner/spinner';
import { ToastService } from '../../../shared/ui/toast/toast.service';

// Nombre maximum d'engagements (même règle que AProposDTO.java)
const MAX_ENGAGEMENTS = 8;

// Page « À propos » du site : texte de présentation, année de création, engagements
// (/webmaster/a-propos)
@Component({
  selector: 'app-webmaster-a-propos',
  imports: [DatePipe, ReactiveFormsModule, RouterLink, Panel, Spinner],
  templateUrl: './a-propos.html',
})
export class WebmasterAPropos {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly parametreService = inject(ParametreService);
  private readonly toast = inject(ToastService);

  protected readonly maxEngagements = MAX_ENGAGEMENTS;

  // undefined = chargement · null = erreur
  protected readonly contenu = signal<APropos | null | undefined>(undefined);
  protected readonly enCours = signal(false);
  protected readonly erreur = signal<string | null>(null);

  // Mêmes règles que AProposDTO.java
  protected readonly formulaire = this.fb.group({
    texte: ['', [Validators.required, Validators.maxLength(10000)]],
    anneeCreation: [null as number | null, [Validators.min(1900), Validators.max(2100)]],
    engagements: this.fb.array<FormGroup<{ titre: FormControl<string>; texte: FormControl<string> }>>([]),
  });

  protected get engagements() {
    return this.formulaire.controls.engagements;
  }

  constructor() {
    this.parametreService.obtenirAPropos().subscribe({
      next: (c) => this.remplir(c),
      error: () => this.contenu.set(null),
    });
  }

  protected ajouterEngagement(): void {
    if (this.engagements.length < MAX_ENGAGEMENTS) {
      this.engagements.push(this.nouvelEngagement());
      this.formulaire.markAsDirty();
    }
  }

  protected supprimerEngagement(i: number): void {
    this.engagements.removeAt(i);
    this.formulaire.markAsDirty();
  }

  // Change l'ordre d'affichage (sens = -1 : monter · +1 : descendre)
  protected deplacerEngagement(i: number, sens: -1 | 1): void {
    const cible = i + sens;
    if (cible < 0 || cible >= this.engagements.length) {
      return;
    }
    const controle = this.engagements.at(i);
    this.engagements.removeAt(i);
    this.engagements.insert(cible, controle);
    this.formulaire.markAsDirty();
  }

  protected enregistrer(): void {
    if (this.formulaire.invalid) {
      this.formulaire.markAllAsTouched();
      return;
    }
    const v = this.formulaire.getRawValue();
    const donnees: APropos = {
      texte: v.texte.trim(),
      anneeCreation: v.anneeCreation || null,
      engagements: v.engagements.map((e) => ({ titre: e.titre.trim(), texte: e.texte.trim() })),
    };

    this.enCours.set(true);
    this.erreur.set(null);
    this.parametreService.modifierAPropos(donnees).subscribe({
      next: (c) => {
        this.remplir(c);
        this.toast.succes('Page « À propos » enregistrée : le site est à jour.');
        this.enCours.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.erreur.set((e.error as ApiError | null)?.message ?? 'Enregistrement impossible.');
        this.enCours.set(false);
      },
    });
  }

  // Remet le formulaire aux valeurs enregistrées
  protected annuler(): void {
    const c = this.contenu();
    if (c) {
      this.remplir(c);
    }
    this.erreur.set(null);
  }

  protected aUneErreur(champ: 'texte' | 'anneeCreation'): boolean {
    const c = this.formulaire.controls[champ];
    return c.touched && c.invalid;
  }

  protected engagementEnErreur(i: number, champ: keyof Engagement): boolean {
    const c = this.engagements.at(i).controls[champ];
    return c.touched && c.invalid;
  }

  private nouvelEngagement(e: Engagement = { titre: '', texte: '' }) {
    return this.fb.group({
      titre: [e.titre, [Validators.required, Validators.maxLength(100)]],
      texte: [e.texte, [Validators.required, Validators.maxLength(500)]],
    });
  }

  private remplir(c: APropos): void {
    this.contenu.set(c);
    this.engagements.clear();
    c.engagements.forEach((e) => this.engagements.push(this.nouvelEngagement(e)));
    this.formulaire.reset({
      texte: c.texte ?? '',
      anneeCreation: c.anneeCreation,
      engagements: c.engagements,
    });
  }
}
