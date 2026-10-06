import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { NotificationService } from '../../core/api/notification.service';
import { UtilisateurService } from '../../core/api/utilisateur.service';
import { ParametreService } from '../../core/api/parametre.service';
import { AuthService } from '../../core/auth/auth.service';
import { Avatar } from '../../shared/ui/avatar/avatar';
import { ESPACES, Espace } from './menu.config';

// Cadre de l'espace de gestion : barre latérale (selon le rôle) + page
@Component({
  selector: 'app-backoffice-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Avatar],
  templateUrl: './backoffice-layout.html',
  styleUrl: './backoffice-layout.css',
})
export class BackofficeLayout {
  private readonly authService = inject(AuthService);
  private readonly utilisateurService = inject(UtilisateurService);

  // Qui est connecté (contenu du token) et sa photo
  protected readonly utilisateur = this.authService.utilisateur;
  protected readonly photo = this.authService.photo;

  // L'espace à afficher : le premier rôle de l'utilisateur qui a un menu
  protected readonly espace = computed<Espace>(() => {
    const roles = this.utilisateur()?.roles ?? [];
    const role = roles.find((r) => ESPACES[r]);
    return (role && ESPACES[role]) || { titre: '', menu: [] };
  });

  // Menu sur téléphone : ouvert ou fermé
  protected readonly menuOuvert = signal(false);

  // Logo pour fond sombre choisi par le webmaster (Paramètres), sinon le logo d'origine
  protected readonly logos = inject(ParametreService).logos;

  // Badge du lien "Notifications" (nombre de non lues, partagé avec les pages)
  private readonly notificationService = inject(NotificationService);
  protected readonly nonLues = this.notificationService.nonLues;

  constructor() {
    // Le badge n'est utile que si le menu contient "Notifications" (journaliste, responsable éditorial)
    if (this.espace().menu.some((lien) => lien.chemin.endsWith('/notifications'))) {
      this.notificationService.rafraichirNonLues();
    }

    // La photo n'est pas dans le token : on la demande au backend (GET /api/utilisateurs/moi)
    this.utilisateurService.monProfil().subscribe({
      next: (u) => this.authService.definirPhoto(u.photo),
      error: () => this.authService.definirPhoto(null),
    });
  }

  protected deconnecter(): void {
    this.authService.deconnecter();
  }
}
