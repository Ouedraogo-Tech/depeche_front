import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './components/header/header';
import { FlashBar } from './components/flash-bar/flash-bar';
// Cadre des pages publiques : header + page + footer
@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, Header,FlashBar],
  templateUrl: './public-layout.html',
  styleUrl: './public-layout.css',
})
export class PublicLayout {}
