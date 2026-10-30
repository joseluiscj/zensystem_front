import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme.service';
import { LoginService } from './services/login.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'restaurapp_front';

  constructor(
    private themeService: ThemeService,
    private loginService: LoginService
  ) {}

  ngOnInit(): void {
    this.themeService.initTheme();
    this.loginService.initSessionMonitor();
  }
}
