import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type AppTheme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_STORAGE_KEY = 'zen_theme_preference';
  private _isDarkMode = new BehaviorSubject<boolean>(false);
  public isDarkMode$: Observable<boolean> = this._isDarkMode.asObservable();

  constructor() {
    this.initTheme();
  }

  get isDarkMode(): boolean {
    return this._isDarkMode.value;
  }

  get currentTheme(): AppTheme {
    return this._isDarkMode.value ? 'dark' : 'light';
  }

  public initTheme(): void {
    const savedTheme = localStorage.getItem(this.THEME_STORAGE_KEY) as AppTheme | null;
    let isDark = false;

    if (savedTheme) {
      isDark = savedTheme === 'dark';
    } else if (typeof window !== 'undefined' && window.matchMedia) {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    this.applyTheme(isDark);
  }

  public toggleTheme(): void {
    this.setTheme(!this._isDarkMode.value);
  }

  public setTheme(isDark: boolean): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
    }
    this.applyTheme(isDark);
  }

  private applyTheme(isDark: boolean): void {
    this._isDarkMode.next(isDark);

    if (typeof document !== 'undefined') {
      if (isDark) {
        document.body.classList.add('dark-mode');
        document.documentElement.setAttribute('data-bs-theme', 'dark');
      } else {
        document.body.classList.remove('dark-mode');
        document.documentElement.setAttribute('data-bs-theme', 'light');
      }
    }
  }
}
