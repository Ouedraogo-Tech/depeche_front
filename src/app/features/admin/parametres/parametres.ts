import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ParametreService } from '../../../core/api/parametre.service';
import { ApiError } from '../../../core/models/api-error.model';
import { ParametreSite } from '../../../core/models/parametre-site.model';
import { Panel } from '../../../shared/ui/panel/panel';
import { Spinner } from '../../../shared/ui/spinner/spinner';
import { ToastService } from '../../../shared/ui/toast/toast.service';

// Paramètres du site (pied de page)
//  - Admin : LECTURE SEULE (/admin/parametres)
//  - Webmaster : modification + aperçu du footer (/webmaster/parametres, data: { modifiable: true })
@Component({
  selector: 'app-admin-parametres',
  imports: [DatePipe, ReactiveFormsModule, Panel, Spinner],
  templateUrl: './parametres.html',
  styleUrl: './parametres.css',
})
export class AdminParametres {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly parametreService = inject(ParametreService);

  // Rempli par la route (data: { modifiable: true }) : false par défaut = lecture seule
  modifiable = input(false);

  // undefined = chargement · null = erreur
  protected readonly parametres = signal<ParametreSite | null | undefined>(undefined);
  protected readonly enCours = signal(false);
  protected readonly erreur = signal<string | null>(null);
  private readonly toast = inject(ToastService); // messages de succès en bas de l'écran

  // Mêmes règles que ParametreSiteDTO.java
  protected readonly formulaire = this.fb.group({
    nomSite: ['', [Validators.required, Validators.maxLength(100)]],
    slogan: ['', Validators.maxLength(500)],
    emailContact: ['', Validators.email],
    telephone: [''],
    adresse: [''],
    ville: [''],
    mentionEdition: [''],
  });

  // Les valeurs du formulaire en direct, pour l'aperçu du footer
  protected readonly apercu = toSignal(this.formulaire.valueChanges, { initialValue: this.formulaire.getRawValue() });

  constructor() {
    this.parametreService.obtenir().subscribe({
      next: (p) => this.remplir(p),
      error: () => this.parametres.set(null),
    });
  }

  protected enregistrer(): void {
    if (this.formulaire.invalid) {
      this.formulaire.markAllAsTouched();
      return;
    }
    // Champ vide → null (le backend enregistre "aucune valeur")
    const v = this.formulaire.getRawValue();
    const vide = (texte: string) => texte.trim() || null;
    const donnees: ParametreSite = {
      nomSite: v.nomSite.trim(),
      slogan: vide(v.slogan),
      emailContact: vide(v.emailContact),
      telephone: vide(v.telephone),
      adresse: vide(v.adresse),
      ville: vide(v.ville),
      mentionEdition: vide(v.mentionEdition),
    };

    this.enCours.set(true);
    this.erreur.set(null);
    this.parametreService.modifier(donnees).subscribe({
      next: (p) => {
        this.remplir(p);
        this.toast.succes('Paramètres enregistrés : le footer du site est à jour.');
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
    const p = this.parametres();
    if (p) {
      this.remplir(p);
    }
    this.erreur.set(null);
  }

  protected aUneErreur(champ: keyof typeof this.formulaire.controls): boolean {
    const c = this.formulaire.controls[champ];
    return c.touched && c.invalid;
  }

  private remplir(p: ParametreSite): void {
    this.parametres.set(p);
    this.formulaire.reset({
      nomSite: p.nomSite,
      slogan: p.slogan ?? '',
      emailContact: p.emailContact ?? '',
      telephone: p.telephone ?? '',
      adresse: p.adresse ?? '',
      ville: p.ville ?? '',
      mentionEdition: p.mentionEdition ?? '',
    });
  }
}