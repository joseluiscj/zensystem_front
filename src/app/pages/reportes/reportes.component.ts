import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../material/material.module';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  ReporteService,
  ReporteDineroData,
  ReporteProductosData
} from '../../services/reporte.service';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule,
    MatProgressBarModule,
    DecimalPipe,
    DatePipe
  ],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.css'
})
export class ReportesComponent implements OnInit {
  tabActivo: 'dinero' | 'productos' = 'dinero';
  cargando: boolean = false;

  // Filtros unificados
  filtros = {
    fechaInicio: '',
    fechaFin: '',
    idCaja: 'todos',
    idCategoria: 'todos'
  };

  esFiltroHoy: boolean = false;
  esFiltroMes: boolean = false;

  // Datos
  dataDinero: ReporteDineroData | null = null;
  dataProductos: ReporteProductosData | null = null;

  constructor(
    private reporteService: ReporteService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'auto' });
    this.aplicarFiltroEsteMes();
  }

  cambiarTab(tab: 'dinero' | 'productos'): void {
    this.tabActivo = tab;
    this.cargarReporte();
  }

  cargarReporte(): void {
    if (this.tabActivo === 'dinero') {
      this.cargarReporteDinero();
    } else {
      this.cargarReporteProductos();
    }
  }

  cargarReporteDinero(): void {
    this.cargando = true;
    this.reporteService.getReporteDinero({
      fechaInicio: this.filtros.fechaInicio,
      fechaFin: this.filtros.fechaFin,
      idCaja: this.filtros.idCaja
    }).subscribe({
      next: (res) => {
        this.cargando = false;
        if (res && res.code === 200) {
          this.dataDinero = res.data;
        }
      },
      error: (err) => {
        this.cargando = false;
        console.error('Error cargando reporte de dinero', err);
        this.snackBar.open('Error al cargar reporte financiero', 'Cerrar', { duration: 3500 });
      }
    });
  }

  cargarReporteProductos(): void {
    this.cargando = true;
    this.reporteService.getReporteProductos({
      fechaInicio: this.filtros.fechaInicio,
      fechaFin: this.filtros.fechaFin,
      idCategoria: this.filtros.idCategoria
    }).subscribe({
      next: (res) => {
        this.cargando = false;
        if (res && res.code === 200) {
          this.dataProductos = res.data;
        }
      },
      error: (err) => {
        this.cargando = false;
        console.error('Error cargando reporte de productos', err);
        this.snackBar.open('Error al cargar reporte de productos', 'Cerrar', { duration: 3500 });
      }
    });
  }

  aplicarFiltroHoy(): void {
    const hoy = this.formatFecha(new Date());
    this.filtros.fechaInicio = hoy;
    this.filtros.fechaFin = hoy;
    this.esFiltroHoy = true;
    this.esFiltroMes = false;
    this.cargarReporte();
  }

  aplicarFiltroEsteMes(): void {
    const ahora = new Date();
    const primerDia = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    this.filtros.fechaInicio = this.formatFecha(primerDia);
    this.filtros.fechaFin = this.formatFecha(ahora);
    this.esFiltroMes = true;
    this.esFiltroHoy = false;
    this.cargarReporte();
  }

  limpiarFiltros(): void {
    this.filtros = {
      fechaInicio: '',
      fechaFin: '',
      idCaja: 'todos',
      idCategoria: 'todos'
    };
    this.esFiltroHoy = false;
    this.esFiltroMes = false;
    this.cargarReporte();
  }

  private formatFecha(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  exportarCSV(): void {
    if (this.tabActivo === 'dinero') {
      this.exportarDineroCSV();
    } else {
      this.exportarProductosCSV();
    }
  }

  private exportarDineroCSV(): void {
    if (!this.dataDinero || !this.dataDinero.transacciones) {
      this.snackBar.open('No hay datos para exportar', 'Cerrar', { duration: 2500 });
      return;
    }

    const rows = [
      ['REPORTE FINANCIERO & FLUJO DE DINERO - ZENSYSTEM ERP'],
      [`Periodo: ${this.filtros.fechaInicio || 'Inicio'} al ${this.filtros.fechaFin || 'Hoy'}`],
      [''],
      ['RESUMEN DE TOTALES'],
      ['Total Ventas', this.dataDinero.kpis.totalVentas],
      ['Total Compras', this.dataDinero.kpis.totalCompras],
      ['Otros Ingresos Caja', this.dataDinero.kpis.otrosIngresos],
      ['Otros Egresos Caja', this.dataDinero.kpis.otrosEgresos],
      ['Total Ingresos', this.dataDinero.kpis.totalIngresos],
      ['Total Egresos', this.dataDinero.kpis.totalEgresos],
      ['BALANCE NETO', this.dataDinero.kpis.balanceNeto],
      [''],
      ['DETALLE DE TRANSACCIONES'],
      ['Fecha', 'Concepto', 'Flujo', 'Documento', 'Entidad', 'Caja', 'Medio Pago', 'Monto']
    ];

    this.dataDinero.transacciones.forEach(t => {
      rows.push([
        t.fecha,
        `"${t.concepto.replace(/"/g, '""')}"`,
        t.flujo,
        `"${t.documento}"`,
        `"${t.entidad.replace(/"/g, '""')}"`,
        `"${t.caja_nombre}"`,
        t.metodo_pago,
        t.monto.toString()
      ]);
    });

    this.descargarArchivoCSV(rows, `reporte_dinero_${this.formatFecha(new Date())}.csv`);
  }

  private exportarProductosCSV(): void {
    if (!this.dataProductos || !this.dataProductos.ranking) {
      this.snackBar.open('No hay datos para exportar', 'Cerrar', { duration: 2500 });
      return;
    }

    const rows = [
      ['REPORTE DE VENTAS POR PRODUCTO - ZENSYSTEM ERP'],
      [`Periodo: ${this.filtros.fechaInicio || 'Inicio'} al ${this.filtros.fechaFin || 'Hoy'}`],
      [''],
      ['RESUMEN DE PRODUCTOS'],
      ['Total Unidades Vendidas', this.dataProductos.kpis.totalUnidadesVendidas],
      ['Total Recaudado (S/)', this.dataProductos.kpis.totalRecaudado],
      ['Producto Mas Vendido', this.dataProductos.kpis.productoMasVendido],
      ['Categoria Lider', this.dataProductos.kpis.categoriaLider],
      ['Valorizacion Costo Stock', this.dataProductos.kpis.valorCostoInventario],
      [''],
      ['RANKING DE PRODUCTOS MAS VENDIDOS'],
      ['Codigo', 'Producto', 'Categoria', 'Precio Venta', 'Costo Unit.', 'Unidades Vendidas', 'Total Recaudado', 'Ganancia Estimada', '% Participacion']
    ];

    this.dataProductos.ranking.forEach(p => {
      rows.push([
        `"${p.codigo}"`,
        `"${p.nombre.replace(/"/g, '""')}"`,
        `"${p.categoria}"`,
        p.precio.toString(),
        p.costo.toString(),
        p.total_unidades.toString(),
        p.total_recaudado.toString(),
        p.ganancia_estimada.toString(),
        `${p.porcentaje_participacion}%`
      ]);
    });

    this.descargarArchivoCSV(rows, `reporte_productos_${this.formatFecha(new Date())}.csv`);
  }

  private descargarArchivoCSV(rows: any[][], nombreArchivo: string): void {
    const csvContent = '\uFEFF' + rows.map(e => e.join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', nombreArchivo);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.snackBar.open(`Reporte exportado como ${nombreArchivo}`, 'OK', { duration: 3000 });
  }

  imprimir(): void {
    window.print();
  }
}
