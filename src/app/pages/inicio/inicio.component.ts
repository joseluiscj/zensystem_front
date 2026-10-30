import { Component, OnInit } from '@angular/core';
import { MaterialModule } from '../../material/material.module';
import { CommonModule, NgFor, NgIf, DecimalPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
    FormsModule,
    NgIf,
    NgFor,
    DecimalPipe,
    DatePipe,
    TitleCasePipe,
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

  // Filtros de fecha
  fechaInicio: string = '';
  fechaFin: string = '';
  filtroActivo: 'hoy' | 'rango' | 'todo' = 'todo';

  constructor(
    private inicioService: InicioService,
    private router: Router,
    private _snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'auto' });
    this.filtrarHoy();
    // this.establecerSaludo();
    // this.cargarDashboard();
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

  obtenerFechaHoy(): string {
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  cargarDashboard(): void {
    this.cargando = true;
    this.inicioService.getResumenDashboard(this.fechaInicio, this.fechaFin).subscribe({
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

  filtrarHoy(): void {
    const hoy = this.obtenerFechaHoy();
    this.fechaInicio = hoy;
    this.fechaFin = hoy;
    this.filtroActivo = 'hoy';
    this.cargarDashboard();
  }

  aplicarFiltro(): void {
    if (this.fechaInicio && this.fechaFin && this.fechaInicio > this.fechaFin) {
      this._snackBar.open('La fecha de inicio no puede ser posterior a la fecha fin', 'Cerrar', { duration: 3000 });
      return;
    }
    const hoy = this.obtenerFechaHoy();
    if (this.fechaInicio === hoy && this.fechaFin === hoy) {
      this.filtroActivo = 'hoy';
    } else if (this.fechaInicio || this.fechaFin) {
      this.filtroActivo = 'rango';
    } else {
      this.filtroActivo = 'todo';
    }
    this.cargarDashboard();
  }

  limpiarFiltro(): void {
    this.fechaInicio = '';
    this.fechaFin = '';
    this.filtroActivo = 'todo';
    this.cargarDashboard();
  }

  get descripcionFiltro(): string {
    if (this.filtroActivo === 'hoy') {
      return 'Mostrando métricas de Hoy';
    } else if (this.fechaInicio && this.fechaFin) {
      return `Período: ${this.fechaInicio} al ${this.fechaFin}`;
    } else if (this.fechaInicio) {
      return `Desde: ${this.fechaInicio}`;
    } else if (this.fechaFin) {
      return `Hasta: ${this.fechaFin}`;
    }
    return 'Histórico General Completo';
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
