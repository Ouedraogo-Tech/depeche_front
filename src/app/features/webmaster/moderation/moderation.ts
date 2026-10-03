import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

import { CommentaireService } from '../../../core/api/commentaire.service';
import { ApiError } from '../../../core/models/api-error.model';
import { Commentaire, StatutCommentaire } from '../../../core/models/commentaire.model';
import { Avatar } from '../../../shared/ui/avatar/avatar';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';
import { Spinner } from '../../../shared/ui/spinner/spinner';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';

const ONGLETS: { valeur: StatutCommentaire | 'TOUS'; libelle: string }[] = [
  { valeur: 'TOUS', libelle: 'Tous' },
  { valeur: 'PUBLIE', libelle: 'Publiés' },
  { valeur: 'MASQUE', libelle: 'Masqués' },
];

// Sans majuscules ni accents : "Économie" → "economie"
const normaliser = (texte: string) => texte.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// Modération des commentaires : /webmaster/moderation
@Component({
  selector: 'app-moderation',
  imports: [DatePipe, RouterLink, Avatar, ConfirmDialog, StatusBadge, Spinner, EmptyState],
  templateUrl: './moderation.html',
  styleUrl: './moderation.css',
})
export class Moderation {
  private readonly commentaireService = inject(CommentaireService);

  protected readonly onglets = ONGLETS;

  // undefined = chargement
  protected readonly commentaires = signal<Commentaire[] | undefined>(undefined);
  protected readonly ongletActif = signal<StatutCommentaire | 'TOUS'>('TOUS');
  protected readonly recherche = signal('');

  protected readonly aSupprimer = signal<Commentaire | null>(null);
  protected readonly enCours = signal<number | null>(null); // id du commentaire en cours de traitement
  protected readonly erreur = signal<string | null>(null);
  private readonly toast = inject(ToastService); // messages de succès en bas de l'écran

  // Nombre par onglet
  protected readonly compteurs = computed(() => {
    const compte = new Map<StatutCommentaire | 'TOUS', number>([['TOUS', this.commentaires()?.length ?? 0]]);
    for (const c of this.commentaires() ?? []) {
      compte.set(c.statut, (compte.get(c.statut) ?? 0) + 1);
    }
    return compte;
  });

  // La liste affichée : onglet + recherche, du plus récent au plus ancien
  protected readonly lignes = computed(() => {
    const texte = normaliser(this.recherche().trim());
    return (this.commentaires() ?? [])
      .filter((c) => this.ongletActif() === 'TOUS' || c.statut === this.ongletActif())
      .filter((c) => !texte || normaliser(`${c.contenu} ${c.auteurNomComplet} ${c.articleTitre}`).includes(texte))
      .sort((x, y) => y.dateCreation.localeCompare(x.dateCreation));
  });

  constructor() {
    this.commentaireService.lister().subscribe({
      next: (liste) => this.commentaires.set(liste),
      error: () => {
        this.commentaires.set([]);
        this.erreur.set('Impossible de charger les commentaires.');
      },
    });
  }

  // PATCH /masquer : disparaît du site public (réversible)
  protected masquer(c: Commentaire): void {
    this.remplacer(c, this.commentaireService.masquer(c.id), 'Commentaire masqué : il n’apparaît plus sur le site.');
  }

  // PATCH /publier : réapparaît sur le site public
  protected republier(c: Commentaire): void {
    this.remplacer(c, this.commentaireService.publier(c.id), 'Commentaire republié.');
  }

  // DELETE : définitif (après confirmation)
  protected supprimer(): void {
    const c = this.aSupprimer();
    this.aSupprimer.set(null);
    if (!c) {
      return;
    }
    this.debut(c);
    this.commentaireService.supprimer(c.id).subscribe({
      next: () => {
        this.commentaires.update((liste) => liste?.filter((x) => x.id !== c.id));
        this.toast.succes('Commentaire supprimé définitivement.');
        this.enCours.set(null);
      },
      error: (e: HttpErrorResponse) => this.echec(e, 'Suppression impossible.'),
    });
  }

  // "Aminata Sawadogo" → prénom / nom (pour les initiales de l'avatar)
  protected prenomDe(nomComplet: string): string {
    return nomComplet.split(' ')[0] ?? '';
  }

  protected nomDe(nomComplet: string): string {
    return nomComplet.split(' ').slice(1).join(' ');
  }

  // On remplace le commentaire dans la liste par la version renvoyée par le backend
  private remplacer(c: Commentaire, requete: Observable<Commentaire>, message: string): void {
    this.debut(c);
    requete.subscribe({
      next: (maj) => {
        this.commentaires.update((liste) => liste?.map((x) => (x.id === maj.id ? maj : x)));
        this.toast.succes(message);
        this.enCours.set(null);
      },
      error: (e: HttpErrorResponse) => this.echec(e, 'Action impossible.'),
    });
  }

  private debut(c: Commentaire): void {
    this.enCours.set(c.id);
    this.erreur.set(null);
  }

  private echec(e: HttpErrorResponse, message: string): void {
    this.erreur.set((e.error as ApiError | null)?.message ?? message);
    this.enCours.set(null);
  }
}
