import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ParametreService } from '../../../core/api/parametre.service';
import { ApiError } from '../../../core/models/api-error.model';
import { ParametreSite, RESEAUX_SOCIAUX } from '../../../core/models/parametre-site.model';
import { ImageUpload } from '../../../shared/article/image-upload/image-upload';
import { IconeReseau } from '../../../shared/ui/icone-reseau/icone-reseau';
import { Panel } from '../../../shared/ui/panel/panel';
import { Spinner } from '../../../shared/ui/spinner/spinner';
import { ToastService } from '../../../shared/ui/toast/toast.service';

type ChampLogo = 'logo' | 'logoBlanc' | 'logoComplet';

// Les logos d'origine (dossier public/images/logo), affichés tant qu'aucun logo n'a été envoyé
const LOGOS_ORIGINE: Record<ChampLogo, string> = {
  logo: 'images/logo/logo.png',
  logoBlanc: 'images/logo/logo-blanc.png',
  logoComplet: 'images/logo/logo-complet.png',
};

// Paramètres du site (pied de page)
//  - Admin : LECTURE SEULE (/admin/parametres)
//  - Webmaster : modification + aperçu du footer (/webmaster/parametres, data: { modifiable: true })
@Component({
  selector: 'app-admin-parametres',
  imports: [DatePipe, ReactiveFormsModule, Panel, Spinner, IconeReseau, ImageUpload],
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

  // Les réseaux sociaux (Facebook, YouTube, WhatsApp, Instagram, LinkedIn) : un champ chacun
  protected readonly reseaux = RESEAUX_SOCIAUX;

  // Mêmes règles que ParametreSiteDTO.java
  protected readonly formulaire = this.fb.group({
    nomSite: ['', [Validators.required, Validators.maxLength(100)]],
    slogan: ['', Validators.maxLength(500)],
    emailContact: ['', Validators.email],
    telephone: [''],
    adresse: [''],
    ville: [''],
    mentionEdition: [''],
    // Liens des réseaux sociaux : vides, ou commençant par https://
    lienFacebook: ['', [Validators.maxLength(255), Validators.pattern(/^$|^https:\/\/.+/)]],
    lienYoutube: ['', [Validators.maxLength(255), Validators.pattern(/^$|^https:\/\/.+/)]],
    lienWhatsapp: ['', [Validators.maxLength(255), Validators.pattern(/^$|^https:\/\/.+/)]],
    lienInstagram: ['', [Validators.maxLength(255), Validators.pattern(/^$|^https:\/\/.+/)]],
    lienLinkedin: ['', [Validators.maxLength(255), Validators.pattern(/^$|^https:\/\/.+/)]],
    // Pages légales
    mentionsLegales: ['', Validators.maxLength(30000)],
    politiqueConfidentialite: ['', Validators.maxLength(30000)],
    // Logos : adresse de l'image envoyée ("/uploads/…"), vide = logo d'origine
    logo: [''],
    logoBlanc: [''],
    logoComplet: [''],
  });

  // Les 3 versions du logo (fond = couleur derrière le logo sur le site)
  protected readonly versionsLogo: { champ: ChampLogo; libelle: string; fond: string }[] = [
    { champ: 'logo', libelle: 'Logo principal (en-tête du site)', fond: 'bg-creme' },
    { champ: 'logoBlanc', libelle: 'Logo pour fond sombre (espaces de travail)', fond: 'bg-marine' },
    { champ: 'logoComplet', libelle: 'Logo avec slogan (pages de connexion)', fond: 'bg-creme' },
  ];

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
      lienFacebook: vide(v.lienFacebook),
      lienYoutube: vide(v.lienYoutube),
      lienWhatsapp: vide(v.lienWhatsapp),
      lienInstagram: vide(v.lienInstagram),
      lienLinkedin: vide(v.lienLinkedin),
      mentionsLegales: vide(v.mentionsLegales),
      politiqueConfidentialite: vide(v.politiqueConfidentialite),
      logo: vide(v.logo),
      logoBlanc: vide(v.logoBlanc),
      logoComplet: vide(v.logoComplet),
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
      lienFacebook: p.lienFacebook ?? '',
      lienYoutube: p.lienYoutube ?? '',
      lienWhatsapp: p.lienWhatsapp ?? '',
      lienInstagram: p.lienInstagram ?? '',
      lienLinkedin: p.lienLinkedin ?? '',
      mentionsLegales: p.mentionsLegales ?? '',
      politiqueConfidentialite: p.politiqueConfidentialite ?? '',
      logo: p.logo ?? '',
      logoBlanc: p.logoBlanc ?? '',
      logoComplet: p.logoComplet ?? '',
    });
  }

  // Nouvelle image envoyée (ou null = retour au logo d'origine)
  protected changerLogo(champ: ChampLogo, url: string | null): void {
    const controle = this.formulaire.controls[champ];
    controle.setValue(url ?? '');
    controle.markAsDirty();
  }

  // Le logo réellement affiché sur le site pour cette version (mêmes règles que ParametreService.logos) :
  // l'image envoyée, sinon le logo principal envoyé, sinon le logo d'origine
  protected logoAffiche(valeurs: Partial<ParametreSite>, champ: ChampLogo): string {
    const principal = valeurs.logo || null;
    if (champ === 'logo') return principal || LOGOS_ORIGINE.logo;
    return valeurs[champ] || principal || LOGOS_ORIGINE[champ];
  }

  // Fond sombre sans version dédiée : le logo principal est posé sur une pastille blanche
  protected surPastille(valeurs: Partial<ParametreSite>, champ: ChampLogo): boolean {
    return champ === 'logoBlanc' && !valeurs.logoBlanc && !!valeurs.logo;
  }

  // Valeur d'un réseau dans l'aperçu (le formulaire tapé en direct)
  protected lienApercu(champ: keyof ParametreSite): string {
    return ((this.apercu() as Record<string, unknown>)[champ] as string | undefined) ?? '';
  }

  // Valeur enregistrée d'un réseau (affichage lecture seule de l'admin)
  protected lienEnregistre(p: ParametreSite, champ: keyof ParametreSite): string | null {
    return (p[champ] as string | null | undefined) ?? null;
  }
}