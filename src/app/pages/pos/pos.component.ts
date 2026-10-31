import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { VentaPosComponent } from '../venta/venta-pos/venta-pos.component';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, VentaPosComponent],
  template: `
    <div class="pos-page-container">
      <app-venta-pos (volver)="onVolver($event)"></app-venta-pos>
    </div>
  `,
  styles: [`
    .pos-page-container {
      padding: 16px;
      min-height: calc(100vh - 65px);
    }
  `]
})
export class PosComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  onVolver(guardado: boolean): void {
    // Si se completó la venta o se presionó volver, dirigir al historial de ventas
    this.router.navigate(['/pages/venta']);
  }
}
