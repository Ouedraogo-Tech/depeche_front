import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, output, signal } from '@angular/core';

import { MediaService } from '../../../core/api/media.service';
import { ApiError } from '../../../core/models/api-error.model';

// Formats et taille acceptés (mêmes règles que le backend)
const TYPES_ACCEPTES = ['image/jpeg', 'image/png', 'image/webp'];
const TAILLE_MAX = 5 * 1024 * 1024; // 5 Mo

// Zone "Glissez la photo ici" : choisit, vérifie, envoie la photo et renvoie son adresse
@Component({
  selector: 'app-image-upload',
  imports: [],
  templateUrl: './image-upload.html',
  styleUrl: './image-upload.css',
})
export class ImageUpload {
  private readonly mediaService = inject(MediaService);

  url = input<string | null>(null); // l'image actuelle (pour l'aperçu)
  urlChange = output<string | null>(); // nouvelle adresse après l'envoi (null = image retirée)

  protected readonly enCours = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected readonly survol = signal(false); // une photo est glissée au-dessus de la zone

  // Photo choisie avec le bouton (ordinateur) ou la galerie / l'appareil photo (téléphone)
  protected choisir(evenement: Event): void {
    const champ = evenement.target as HTMLInputElement;
    const fichier = champ.files?.[0];
    if (fichier) {
      this.televerser(fichier);
    }
    champ.value = ''; // permet de rechoisir le même fichier plus tard
  }

  // Photo glissée-déposée dans la zone
  protected deposer(evenement: DragEvent): void {
    evenement.preventDefault(); // sinon le navigateur ouvre l'image dans l'onglet
    this.survol.set(false);
    const fichier = evenement.dataTransfer?.files[0];
    if (fichier) {
      this.televerser(fichier);
    }
  }

  protected retirer(): void {
    this.urlChange.emit(null);
  }

  private televerser(fichier: File): void {
    // Vérifications AVANT l'envoi : réponse immédiate, pas d'aller-retour inutile
    if (!TYPES_ACCEPTES.includes(fichier.type)) {
      this.erreur.set('Format non supporté : choisissez une image JPG, PNG ou WEBP.');
      return;
    }
    if (fichier.size > TAILLE_MAX) {
      this.erreur.set('Image trop lourde : 5 Mo maximum.');
      return;
    }

    this.enCours.set(true);
    this.erreur.set(null);
    this.mediaService.televerser(fichier).subscribe({
      next: (reponse) => {
        this.urlChange.emit(reponse.url);
        this.enCours.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.erreur.set((e.error as ApiError | null)?.message ?? "Envoi de l'image impossible.");
        this.enCours.set(false);
      },
    });
  }
}
