import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, switchMap } from 'rxjs';

import { MediaService } from '../../core/api/media.service';
import { UtilisateurService } from '../../core/api/utilisateur.service';
import { AuthService } from '../../core/auth/auth.service';
import { ApiError } from '../../core/models/api-error.model';
import { Utilisateur, UtilisateurModification } from '../../core/models/utilisateur.model';
import { Avatar } from '../../shared/ui/avatar/avatar';
import { Panel } from '../../shared/ui/panel/panel';
import { Spinner } from '../../shared/ui/spinner/spinner';
import { ToastService } from '../../shared/ui/toast/toast.service';

const TYPES_ACCEPTES = ['image/jpeg', 'image/png', 'image/webp'];
const TAILLE_MAX = 5 * 1024 * 1024; // 5 Mo

// "Mon profil" : photo + informations (tous les espaces)
@Component({
  selector: 'app-profil',
  imports: [ReactiveFormsModule, Panel, Avatar, Spinner],
  templateUrl: './profil.html',
  styleUrl: './profil.css',
})
export class Profil {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly utilisateurService = inject(UtilisateurService);
  private readonly mediaService = inject(MediaService);
  private readonly authService = inject(AuthService);

  protected readonly utilisateur = signal<Utilisateur | null | undefined>(undefined);
  protected readonly enCours = signal(false);
  protected readonly photoEnCours = signal(false);
  protected readonly erreur = signal<string | null>(null);
  private readonly toast = inject(ToastService); // messages de succès en bas de l'écran

  protected readonly formulaire = this.fb.group({
    prenom: ['', Validators.required],
    nom: ['', Validators.required],
    telephone: [''],
    motDePasse: ['', Validators.minLength(6)],
  });

  constructor() {
    this.utilisateurService.monProfil().subscribe({
      next: (u) => {
        this.utilisateur.set(u);
        this.formulaire.patchValue({ prenom: u.prenom, nom: u.nom, telephone: u.telephone ?? '' });
      },
      error: () => this.utilisateur.set(null),
    });
  }

  // ===== Photo : choisie → envoyée (POST /api/medias) → enregistrée dans le profil =====
  protected changerPhoto(evenement: Event): void {
    const champ = evenement.target as HTMLInputElement;
    const fichier = champ.files?.[0];
    champ.value = '';
    if (!fichier) {
      return;
    }
    if (!TYPES_ACCEPTES.includes(fichier.type)) {
      this.erreur.set('Format non supporté : choisissez une image JPG, PNG ou WEBP.');
      return;
    }
    if (fichier.size > TAILLE_MAX) {
      this.erreur.set('Image trop lourde : 5 Mo maximum.');
      return;
    }
    // 1) on envoie l'image, 2) on enregistre son adresse dans le profil
    const requete = this.mediaService
      .televerser(fichier)
      .pipe(switchMap((reponse) => this.utilisateurService.modifierMonProfil(this.profilActuel({ photo: reponse.url }))));
    this.enregistrerPhoto(requete, 'Photo de profil mise à jour.');
  }

  protected retirerPhoto(): void {
    // photo "" = retirer la photo (les initiales réapparaissent)
    this.enregistrerPhoto(this.utilisateurService.modifierMonProfil(this.profilActuel({ photo: '' })), 'Photo retirée.');
  }

  private enregistrerPhoto(requete: Observable<Utilisateur>, message: string): void {
    this.photoEnCours.set(true);
    this.erreur.set(null);
    requete.subscribe({
      next: (u) => {
        this.utilisateur.set(u);
        this.authService.definirPhoto(u.photo); // la barre latérale se met à jour tout de suite
        this.toast.succes(message);
        this.photoEnCours.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.erreur.set((e.error as ApiError | null)?.message ?? 'Envoi de la photo impossible.');
        this.photoEnCours.set(false);
      },
    });
  }

  // Les informations actuelles (le backend exige nom et prénom à chaque modification)
  private profilActuel(ajout: Partial<UtilisateurModification>): UtilisateurModification {
    const u = this.utilisateur()!;
    return { prenom: u.prenom, nom: u.nom, telephone: u.telephone ?? undefined, ...ajout };
  }

  // ===== Informations =====
  protected enregistrer(): void {
    if (this.formulaire.invalid) {
      this.formulaire.markAllAsTouched();
      return;
    }
    this.enCours.set(true);
    this.erreur.set(null);
    const v = this.formulaire.getRawValue();
    this.utilisateurService
      .modifierMonProfil({
        prenom: v.prenom,
        nom: v.nom,
        telephone: v.telephone || undefined,
        motDePasse: v.motDePasse || undefined, // vide = mot de passe inchangé ; photo absente = inchangée
      })
      .subscribe({
        next: (u) => {
          this.utilisateur.set(u);
          this.formulaire.controls.motDePasse.reset();
          this.toast.succes('Profil mis à jour.');
          this.enCours.set(false);
        },
        error: (e: HttpErrorResponse) => {
          this.erreur.set((e.error as ApiError | null)?.message ?? 'Enregistrement impossible.');
          this.enCours.set(false);
        },
      });
  }

  protected aUneErreur(champ: keyof typeof this.formulaire.controls): boolean {
    const c = this.formulaire.controls[champ];
    return c.touched && c.invalid;
  }
}
