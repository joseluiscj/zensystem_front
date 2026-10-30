import { Component, ElementRef, HostListener, OnDestroy, OnInit } from '@angular/core';
import { MaterialModule } from '../../material/material.module';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { MenuService } from '../../services/menu.service';
import { LoginService } from '../../services/login.service';
import { LocalstorageService } from '../../services/localstorage.service';
import { ThemeService } from '../../services/theme.service';
import { MatDialog } from '@angular/material/dialog';
import { JwtHelperService } from '@auth0/angular-jwt';
import { environment } from '../../../environments/environment.development';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [MaterialModule, RouterOutlet, NgIf, RouterLink, RouterLinkActive, MatTooltipModule, NgFor],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent implements OnInit, OnDestroy {
  username: string;
  private timeoutId: any;
  isMenuOpen = true;
  menuItems = [];

  constructor(
    private menuService: MenuService,
    private loginService: LoginService,
    private localStorage: LocalstorageService,
    public themeService: ThemeService,
    private router: Router,
    private _dialog: MatDialog,
  ) {}

  get isDarkMode(): boolean {
    return this.themeService.isDarkMode;
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  ngOnInit(): void {
    const helper = new JwtHelperService();
    const token = sessionStorage.getItem(environment.TOKEN_NAME);
    const decodeToken = helper.decodeToken(token);

    this.username = decodeToken.subn;
    this.localStorage.setItem("user_storage", this.username);

    this.menuService.getMenusByUser(this.username).subscribe(data => {
      this.menuItems = data;
    });

    this.startInactivityTimer();
  }

  ngOnDestroy(): void {
    this.clearInactivityTimer();
  }

  logout(): void {
    this.loginService.logout();
  }

  dataUser(): void {
    // this._dialog.open(LayoutUserComponent, {
    //   disableClose: true,
    //   panelClass: 'modal-dialog-right', 
    // })
  }

  clickMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  startInactivityTimer(): void {
    // const timeoutDuration = 15 * 60 * 1000;
  }

  clearInactivityTimer(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  } 
}
