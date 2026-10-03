import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';

import { ArticleService } from '../../../core/api/article.service';
import { NewsletterService } from '../../../core/api/newsletter.service';
import { AbonneNewsletter } from '../../../core/models/abonne-newsletter.model';
import { Article } from '../../../core/models/article.model';
import { ApiError } from '../../../core/models/api-error.model';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';
import { Spinner } from '../../../shared/ui/spinner/spinner';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { Panel } from '../../../shared/ui/panel/panel';

type Onglet = 'ACTIFS' | 'DESABONNES' | 'TOUS';

const MAX_ARTICLES = 10; // même limite que EnvoiNewsletterDTO.java
const ARTICLES_PRECOCHES = 5; // les 5 plus récents sont cochés d'office

// Abonnés à la newsletter : /webmaster/newsletter
@Component({
  selector: 'app-newsletter',
  imports: [DatePipe, ConfirmDialog, StatusBadge, Spinner, EmptyState, Panel],
  templateUrl: './newsletter.html',
  styleUrl: './newsletter.css',
})
export class Newsletter {
  private readonly newsletterService = inject(NewsletterService);

  protected readonly onglets: { valeur: Onglet; libelle: string }[] = [
    { valeur: 'ACTIFS', libelle: 'Actifs' },
    { valeur: 'DESABONNES', libelle: 'Désabonnés' },
    { valeur: 'TOUS', libelle: 'Tous' },
  ];

  // undefined = chargement
  protected readonly abonnes = signal<AbonneNewsletter[] | undefined>(undefined);
  protected readonly onglet = signal<Onglet>('ACTIFS');
  protected readonly recherche = signal('');

  protected readonly aDesabonner = signal<AbonneNewsletter | null>(null);
  protected readonly enCours = signal<number | null>(null); // id de l'abonné en cours de traitement
  protected readonly erreur = signal<string | null>(null);
  private readonly toast = inject(ToastService); // messages de succès en bas de l'écran

  protected readonly actifs = computed(() => (this.abonnes() ?? []).filter((a) => a.actif));

  protected readonly compteurs = computed<Record<Onglet, number>>(() => ({
    ACTIFS: this.actifs().length,
    DESABONNES: (this.abonnes() ?? []).length - this.actifs().length,
    TOUS: (this.abonnes() ?? []).length,
  }));

  // La liste affichée : onglet + recherche, les plus récents en premier
  protected readonly lignes = computed(() => {
    const texte = this.recherche().trim().toLowerCase();
    return (this.abonnes() ?? [])
      .filter((a) => this.onglet() === 'TOUS' || a.actif === (this.onglet() === 'ACTIFS'))
      .filter((a) => !texte || a.email.includes(texte))
      .sort((x, y) => y.dateAbonnement.localeCompare(x.dateAbonnement));
  });

  // ===== Composer et envoyer la newsletter =====
  protected readonly maxArticles = MAX_ARTICLES;
  // Objet proposé : "La dépêche du 3 octobre 2026"
  protected readonly objet = signal(
    `La dépêche du ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`,
  );
  // Les derniers articles publiés (12 au maximum proposés) · undefined = chargement
  protected readonly articlesPublies = signal<Article[] | undefined>(undefined);
  // Les cases cochées (des id)
  protected readonly articlesChoisis = signal<ReadonlySet<number>>(new Set());
  protected readonly abonnesChoisis = signal<ReadonlySet<number>>(new Set());

  protected readonly confirmerEnvoi = signal(false);
  protected readonly envoiEnCours = signal(false);

  // On ne compte que les abonnés ACTIFS cochés (un désabonné ne peut pas recevoir la newsletter)
  protected readonly nbAbonnesChoisis = computed(() => this.actifs().filter((a) => this.abonnesChoisis().has(a.id)).length);
  protected readonly tousCoches = computed(() => this.actifs().length > 0 && this.nbAbonnesChoisis() === this.actifs().length);
  protected readonly peutEnvoyer = computed(
    () => this.objet().trim().length > 0 && this.nbAbonnesChoisis() > 0 && this.articlesChoisis().size > 0 && !this.envoiEnCours(),
  );
  // Aperçu : les titres des articles cochés, dans l'ordre de la liste
  protected readonly titresChoisis = computed(() =>
    (this.articlesPublies() ?? []).filter((a) => this.articlesChoisis().has(a.id)).map((a) => a.titre),
  );

  constructor() {
    this.newsletterService.lister().subscribe({
      next: (liste) => {
        this.abonnes.set(liste);
        // Par défaut, tous les abonnés actifs sont cochés
        this.abonnesChoisis.set(new Set(liste.filter((a) => a.actif).map((a) => a.id)));
      },
      error: () => {
        this.abonnes.set([]);
        this.erreur.set('Impossible de charger les abonnés.');
      },
    });

    inject(ArticleService)
      .listerPublies()
      .subscribe({
        next: (liste) => {
          const recents = liste.slice(0, 12);
          this.articlesPublies.set(recents);
          this.articlesChoisis.set(new Set(recents.slice(0, ARTICLES_PRECOCHES).map((a) => a.id)));
        },
        error: () => this.articlesPublies.set([]),
      });
  }

  protected basculerArticle(id: number): void {
    const choisis = new Set(this.articlesChoisis());
    if (choisis.has(id)) {
      choisis.delete(id);
    } else if (choisis.size >= MAX_ARTICLES) {
      this.toast.erreur(`${MAX_ARTICLES} articles maximum par newsletter.`);
      return;
    } else {
      choisis.add(id);
    }
    this.articlesChoisis.set(choisis);
  }

  protected basculerAbonne(id: number): void {
    const choisis = new Set(this.abonnesChoisis());
    if (choisis.has(id)) {
      choisis.delete(id);
    } else {
      choisis.add(id);
    }
    this.abonnesChoisis.set(choisis);
  }

  // Case "Tout cocher" : coche tous les actifs, ou décoche tout s'ils l'étaient déjà
  protected basculerTous(): void {
    this.abonnesChoisis.set(this.tousCoches() ? new Set() : new Set(this.actifs().map((a) => a.id)));
  }

  // POST /api/newsletter/envoyer (après confirmation)
  protected envoyer(): void {
    this.confirmerEnvoi.set(false);
    if (!this.peutEnvoyer()) {
      return;
    }
    this.envoiEnCours.set(true);
    this.erreur.set(null);
    this.newsletterService
      .envoyer({
        objet: this.objet().trim(),
        abonneIds: this.actifs().filter((a) => this.abonnesChoisis().has(a.id)).map((a) => a.id),
        articleIds: [...this.articlesChoisis()],
      })
      .subscribe({
        next: (r) => {
          this.toast.succes(`Newsletter envoyée : ${r.envoyes} e-mail(s).`);
          if (r.echecs > 0) {
            this.erreur.set(`${r.echecs} e-mail(s) non envoyé(s) : ${r.adressesEnEchec.join(', ')}`);
          }
          this.envoiEnCours.set(false);
        },
        error: (e: HttpErrorResponse) => {
          this.erreur.set((e.error as ApiError | null)?.message ?? "Envoi impossible. Le serveur d'e-mails est-il lancé ?");
          this.envoiEnCours.set(false);
        },
      });
  }

  // Désabonner (après confirmation) : actif → false
  protected desabonner(): void {
    const abonne = this.aDesabonner();
    this.aDesabonner.set(null);
    if (!abonne) {
      return;
    }
    this.debut(abonne);
    this.newsletterService.desabonner(abonne.id).subscribe({
      next: (maj) => this.remplacer(maj, `${abonne.email} a été désabonné.`),
      error: (e: HttpErrorResponse) => this.echec(e, 'Désabonnement impossible.'),
    });
  }

  // Réabonner : le backend réactive l'abonné et renvoie sa nouvelle version
  protected reabonner(abonne: AbonneNewsletter): void {
    this.debut(abonne);
    this.newsletterService.abonner(abonne.email).subscribe({
      next: (maj) => this.remplacer(maj, `${abonne.email} est de nouveau abonné.`),
      error: (e: HttpErrorResponse) => this.echec(e, 'Réabonnement impossible.'),
    });
  }

  // Télécharge un fichier CSV des abonnés ACTIFS (à importer dans un outil d'envoi d'e-mails)
  protected exporterCsv(): void {
    const lignes = ['email;date_abonnement', ...this.actifs().map((a) => `${a.email};${a.dateAbonnement.slice(0, 10)}`)];
    // "\uFEFF" au début : Excel lit correctement les accents
    const fichier = new Blob(['\uFEFF' + lignes.join('\n')], { type: 'text/csv;charset=utf-8' });
    const lien = document.createElement('a');
    lien.href = URL.createObjectURL(fichier);
    lien.download = `abonnes-newsletter-${new Date().toISOString().slice(0, 10)}.csv`;
    lien.click();
    URL.revokeObjectURL(lien.href);
  }

  // Copie les e-mails actifs, séparés par des virgules (à coller dans le champ "Cci" d'un e-mail)
  protected copierEmails(): void {
    navigator.clipboard
      .writeText(this.actifs().map((a) => a.email).join(', '))
      .then(() => this.toast.succes(`${this.actifs().length} adresse(s) copiée(s).`))
      .catch(() => this.erreur.set('Copie impossible : votre navigateur l’a refusée.'));
  }

  private debut(abonne: AbonneNewsletter): void {
    this.enCours.set(abonne.id);
    this.erreur.set(null);
  }

  private remplacer(maj: AbonneNewsletter, message: string): void {
    this.abonnes.update((liste) => liste?.map((a) => (a.id === maj.id ? maj : a)));
    this.toast.succes(message);
    this.enCours.set(null);
  }

  private echec(e: HttpErrorResponse, message: string): void {
    this.erreur.set((e.error as ApiError | null)?.message ?? message);
    this.enCours.set(null);
  }
}