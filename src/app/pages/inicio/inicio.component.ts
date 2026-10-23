import { Component, OnInit } from '@angular/core';
import { MaterialModule } from '../../material/material.module';
import { CommonModule, NgFor, NgIf, DecimalPipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { InicioService } from '../../services/inicio.service';
import { DashboardData } from '../../../model/dashboard';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import localeEs from '@angular/common/locales/es';
import { registerLocaleData } from '@angular/common';

registerLocaleData(localeEs);

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [
    MaterialModule,
    CommonModule,
    NgIf,
    NgFor,
    DecimalPipe,
    DatePipe,
    MatProgressBarModule
  ],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css'
})
export class InicioComponent implements OnInit {
  cargando: boolean = true;
  dashboard: DashboardData | null = null;
  fechaActual: Date = new Date();
  saludo: string = 'Bienvenido';

  constructor(
    private inicioService: InicioService,
    private router: Router,
    private _snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.establecerSaludo();
    this.cargarDashboard();
  }

  establecerSaludo(): void {
    const hora = new Date().getHours();
    if (hora >= 6 && hora < 12) {
      this.saludo = 'Buenos días';
    } else if (hora >= 12 && hora < 19) {
      this.saludo = 'Buenas tardes';
    } else {
      this.saludo = 'Buenas noches';
    }
  }

  cargarDashboard(): void {
    this.cargando = true;
    this.inicioService.getResumenDashboard().subscribe({
      next: (res) => {
        this.cargando = false;
        if (res && res.code === 200) {
          this.dashboard = res.data;
        }
      },
      error: (err) => {
        this.cargando = false;
        console.error('Error cargando dashboard', err);
        this._snackBar.open('No se pudo cargar el resumen del dashboard', 'Cerrar', { duration: 3500 });
      }
    });
  }

  get totalVentasMetodos(): number {
    if (!this.dashboard?.metodosPago) return 0;
    return this.dashboard.metodosPago.reduce((acc, m) => acc + Number(m.total || 0), 0);
  }

  calcularPorcentajeMetodo(totalMetodo: number | string): number {
    const totalG = this.totalVentasMetodos;
    if (totalG <= 0) return 0;
    return Math.round((Number(totalMetodo) / totalG) * 100);
  }

  get maxVendidoProducto(): number {
    if (!this.dashboard?.topProductos || this.dashboard.topProductos.length === 0) return 1;
    return Math.max(...this.dashboard.topProductos.map(p => Number(p.total_vendido || 0)), 1);
  }

  calcularBarraTop(vendido: number | string): number {
    const max = this.maxVendidoProducto;
    return Math.round((Number(vendido) / max) * 100);
  }

  irRestaurante(): void {
    this.router.navigate(['/pages/restaurante']);
  }

  irAperturaCaja(): void {
    this.router.navigate(['/pages/apertura']);
  }

  irCajas(): void {
    this.router.navigate(['/pages/caja']);
  }

  irProductos(): void {
    this.router.navigate(['/pages/producto']);
  }

  irCategorias(): void {
    this.router.navigate(['/pages/categoria']);
  }

  irMesas(): void {
    this.router.navigate(['/pages/mesa']);
  }
}
