import { Component, computed, input, linkedSignal } from '@angular/core';

// Cercle de profil : la photo, ou à défaut les initiales NOM + PRÉNOM (Ouedraogo Paul → "OP")
@Component({
  selector: 'app-avatar',
  imports: [],
  templateUrl: './avatar.html',
  styleUrl: './avatar.css',
  host: { class: 'inline-block shrink-0' },
})
export class Avatar {
  prenom = input.required<string>();
  nom = input.required<string>();
  photo = input<string | null>(null);
  taille = input<'sm' | 'md' | 'lg'>('md');

  // Initiales : 1re lettre du NOM puis 1re lettre du PRÉNOM
  protected readonly initiales = computed(() => (this.nom().charAt(0) + this.prenom().charAt(0)).toUpperCase());

  // Taille du cercle et du texte
  protected readonly classesTaille = computed(
    () => ({ sm: 'h-9 w-9 text-sm', md: 'h-16 w-16 text-xl', lg: 'h-28 w-28 text-3xl' })[this.taille()],
  );

  // true si la photo ne se charge pas. linkedSignal : se remet à false dès que la photo change
  protected readonly imageCassee = linkedSignal({ source: this.photo, computation: () => false });
}
