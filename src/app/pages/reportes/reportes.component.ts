import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../material/material.module';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Chart, registerables } from 'chart.js';
import {
  ReporteService,
  ReporteDineroData,
  ReporteProductosData
} from '../../services/reporte.service';

// Registrar componentes de Chart.js
Chart.register(...registerables);

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
export class ReportesComponent implements OnInit, OnDestroy {
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

  // Toggle de barras en finanzas: 'mensual' | 'diario'
  modoBarrasDinero: 'mensual' | 'diario' = 'mensual';

  // Toggle de curva de tendencia diaria: 'comparativa' | 'neto'
  modoLineaTendencia: 'comparativa' | 'neto' = 'comparativa';

  // Toggle de métrica en barras de productos: 'monto' | 'unidades'
  modoMetricaProductos: 'monto' | 'unidades' = 'monto';

  // Datos
  dataDinero: ReporteDineroData | null = null;
  dataProductos: ReporteProductosData | null = null;

  // Instancias de Chart.js
  private chartBarrasDinero?: Chart;
  private chartDonaFlujo?: Chart;
  private chartDonaMedios?: Chart;
  private chartLineaTendencia?: Chart;
  private chartBarrasTopProd?: Chart;
  private chartDonaCategorias?: Chart;

  constructor(
    private reporteService: ReporteService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'auto' });
    this.aplicarFiltroEsteMes();
  }

  ngOnDestroy(): void {
    this.destruirGraficosDinero();
    this.destruirGraficosProductos();
  }

  cambiarTab(tab: 'dinero' | 'productos'): void {
    if (this.tabActivo === tab) return;
    this.tabActivo = tab;
    if (tab === 'dinero') {
      this.destruirGraficosProductos();
      if (this.dataDinero) {
        this.renderGraficosDinero();
      } else {
        this.cargarReporteDinero();
      }
    } else {
      this.destruirGraficosDinero();
      if (this.dataProductos) {
        this.renderGraficosProductos();
      } else {
        this.cargarReporteProductos();
      }
    }
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
          this.cdr.detectChanges();
          this.renderGraficosDinero();
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
          this.cdr.detectChanges();
          this.renderGraficosProductos();
        }
      },
      error: (err) => {
        this.cargando = false;
        console.error('Error cargando reporte de productos', err);
        this.snackBar.open('Error al cargar reporte de productos', 'Cerrar', { duration: 3500 });
      }
    });
  }

  cambiarModoBarrasDinero(modo: 'mensual' | 'diario'): void {
    if (this.modoBarrasDinero === modo) return;
    this.modoBarrasDinero = modo;
    this.renderChartBarrasDinero();
  }

  cambiarModoLineaTendencia(modo: 'comparativa' | 'neto'): void {
    if (this.modoLineaTendencia === modo) return;
    this.modoLineaTendencia = modo;
    this.renderChartLineaTendencia();
  }

  cambiarModoMetricaProductos(modo: 'monto' | 'unidades'): void {
    if (this.modoMetricaProductos === modo) return;
    this.modoMetricaProductos = modo;
    this.renderChartBarrasTopProd();
  }

  get promedioIngresoDiario(): number {
    if (!this.dataDinero?.flujoDiario?.length) return 0;
    const total = this.dataDinero.flujoDiario.reduce((acc, d) => acc + Number(d.ventas) + Number(d.otros_ingresos), 0);
    return total / this.dataDinero.flujoDiario.length;
  }

  get promedioEgresoDiario(): number {
    if (!this.dataDinero?.flujoDiario?.length) return 0;
    const total = this.dataDinero.flujoDiario.reduce((acc, d) => acc + Number(d.compras) + Number(d.otros_egresos), 0);
    return total / this.dataDinero.flujoDiario.length;
  }

  // ==========================================
  // RENDERIZADO DE GRÁFICOS: DINERO & FINANZAS
  // ==========================================
  renderGraficosDinero(): void {
    if (!this.dataDinero) return;
    setTimeout(() => {
      this.renderChartBarrasDinero();
      this.renderChartDonaFlujo();
      this.renderChartDonaMedios();
      this.renderChartLineaTendencia();
    }, 40);
  }

  private renderChartBarrasDinero(intento = 0): void {
    const canvas = document.getElementById('canvasBarrasDinero') as HTMLCanvasElement;
    if (!canvas) {
      if (intento < 8) {
        setTimeout(() => this.renderChartBarrasDinero(intento + 1), 70);
      }
      return;
    }
    if (!this.dataDinero) return;

    if (this.chartBarrasDinero) {
      this.chartBarrasDinero.destroy();
      this.chartBarrasDinero = undefined;
    }

    let labels: string[] = [];
    let ingresosData: number[] = [];
    let egresosData: number[] = [];

    if (this.modoBarrasDinero === 'mensual') {
      const items = this.dataDinero.flujoMensual || [];
      labels = items.map(i => this.formatearMes(i.mes_anio));
      ingresosData = items.map(i => Number(i.total_ingresos ?? (Number(i.ventas) + Number(i.otros_ingresos))));
      egresosData = items.map(i => Number(i.total_egresos ?? (Number(i.compras) + Number(i.otros_egresos))));
    } else {
      const items = [...(this.dataDinero.flujoDiario || [])].reverse();
      labels = items.map(i => this.formatearDia(i.fecha_dia));
      ingresosData = items.map(i => Number(i.ventas) + Number(i.otros_ingresos));
      egresosData = items.map(i => Number(i.compras) + Number(i.otros_egresos));
    }

    this.chartBarrasDinero = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Ingresos Operativos',
            data: ingresosData,
            backgroundColor: 'rgba(16, 185, 129, 0.85)',
            hoverBackgroundColor: 'rgba(16, 185, 129, 1)',
            borderColor: '#059669',
            borderWidth: 1.5,
            borderRadius: 8,
            borderSkipped: false,
            maxBarThickness: 42
          },
          {
            label: 'Egresos Operativos',
            data: egresosData,
            backgroundColor: 'rgba(244, 63, 94, 0.85)',
            hoverBackgroundColor: 'rgba(244, 63, 94, 1)',
            borderColor: '#e11d48',
            borderWidth: 1.5,
            borderRadius: 8,
            borderSkipped: false,
            maxBarThickness: 42
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              boxWidth: 8,
              padding: 18,
              font: { size: 12, weight: 'bold', family: 'Inter, system-ui, sans-serif' }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.94)',
            titleFont: { size: 13, weight: 'bold' },
            bodyFont: { size: 12 },
            padding: 12,
            cornerRadius: 10,
            boxPadding: 4,
            callbacks: {
              label: (ctx) => {
                const val = (ctx.raw as number) || 0;
                return ` ${ctx.dataset.label}: S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              },
              footer: (items) => {
                if (items.length >= 2) {
                  const ing = (items[0].raw as number) || 0;
                  const egr = (items[1].raw as number) || 0;
                  const dif = ing - egr;
                  const signo = dif >= 0 ? '+' : '';
                  return `\nBalance Neto: ${signo}S/ ${dif.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                }
                return '';
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { size: 11, weight: 'bold', family: 'Inter, system-ui, sans-serif' },
              color: '#64748b'
            }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(226, 232, 240, 0.7)' },
            ticks: {
              font: { size: 11, family: 'Inter, system-ui, sans-serif' },
              color: '#64748b',
              callback: (value) => 'S/ ' + Number(value).toLocaleString('es-PE')
            }
          }
        }
      }
    });
  }

  private renderChartDonaFlujo(intento = 0): void {
    const canvas = document.getElementById('canvasDonaFlujo') as HTMLCanvasElement;
    if (!canvas) {
      if (intento < 8) {
        setTimeout(() => this.renderChartDonaFlujo(intento + 1), 70);
      }
      return;
    }
    if (!this.dataDinero) return;

    if (this.chartDonaFlujo) {
      this.chartDonaFlujo.destroy();
      this.chartDonaFlujo = undefined;
    }

    const totalIng = Number(this.dataDinero.kpis.totalIngresos || 0);
    const totalEgr = Number(this.dataDinero.kpis.totalEgresos || 0);

    this.chartDonaFlujo = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Ingresos Operativos', 'Egresos Operativos'],
        datasets: [{
          data: [totalIng, totalEgr],
          backgroundColor: [
            '#10b981',
            '#f43f5e'
          ],
          hoverBackgroundColor: [
            '#059669',
            '#e11d48'
          ],
          borderWidth: 3,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '74%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              boxWidth: 8,
              padding: 14,
              font: { size: 12, weight: 'bold', family: 'Inter, system-ui, sans-serif' }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.94)',
            padding: 12,
            cornerRadius: 10,
            callbacks: {
              label: (ctx) => {
                const val = (ctx.raw as number) || 0;
                const total = totalIng + totalEgr;
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
                return ` ${ctx.label}: S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }

  private renderChartDonaMedios(intento = 0): void {
    const canvas = document.getElementById('canvasDonaMedios') as HTMLCanvasElement;
    if (!canvas) {
      if (intento < 8) {
        setTimeout(() => this.renderChartDonaMedios(intento + 1), 70);
      }
      return;
    }
    if (!this.dataDinero) return;

    if (this.chartDonaMedios) {
      this.chartDonaMedios.destroy();
      this.chartDonaMedios = undefined;
    }

    const ef = Number(this.dataDinero.metodosPago.ventas.efectivo || 0);
    const tar = Number(this.dataDinero.metodosPago.ventas.tarjeta || 0);
    const otros = Number(this.dataDinero.metodosPago.ventas.otros || 0);

    const labels: string[] = [];
    const data: number[] = [];
    const colors: string[] = [];
    const hoverColors: string[] = [];

    if (ef > 0 || (ef === 0 && tar === 0 && otros === 0)) {
      labels.push('Efectivo');
      data.push(ef);
      colors.push('#10b981');
      hoverColors.push('#059669');
    }
    if (tar > 0) {
      labels.push('Tarjetas');
      data.push(tar);
      colors.push('#3b82f6');
      hoverColors.push('#2563eb');
    }
    if (otros > 0) {
      labels.push('Otros (Yape/Plin/Transf.)');
      data.push(otros);
      colors.push('#8b5cf6');
      hoverColors.push('#7c3aed');
    }

    this.chartDonaMedios = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          hoverBackgroundColor: hoverColors,
          borderWidth: 3,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '74%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              boxWidth: 8,
              padding: 12,
              font: { size: 11, weight: 'bold', family: 'Inter, system-ui, sans-serif' }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.94)',
            padding: 12,
            cornerRadius: 10,
            callbacks: {
              label: (ctx) => {
                const val = (ctx.raw as number) || 0;
                const total = data.reduce((a, b) => a + b, 0);
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
                return ` ${ctx.label}: S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }

  private renderChartLineaTendencia(intento = 0): void {
    const canvas = document.getElementById('canvasLineaTendencia') as HTMLCanvasElement;
    if (!canvas) {
      if (intento < 8) {
        setTimeout(() => this.renderChartLineaTendencia(intento + 1), 70);
      }
      return;
    }
    if (!this.dataDinero) return;

    if (this.chartLineaTendencia) {
      this.chartLineaTendencia.destroy();
      this.chartLineaTendencia = undefined;
    }

    const items = [...(this.dataDinero.flujoDiario || [])].reverse();
    const labels = items.map(i => this.formatearDia(i.fecha_dia));

    let datasets: any[] = [];

    if (this.modoLineaTendencia === 'comparativa') {
      const ingresosData = items.map(i => Number(i.ventas) + Number(i.otros_ingresos));
      const egresosData = items.map(i => Number(i.compras) + Number(i.otros_egresos));

      datasets = [
        {
          label: 'Ingresos Diarios',
          data: ingresosData,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 7
        },
        {
          label: 'Egresos Diarios',
          data: egresosData,
          borderColor: '#f43f5e',
          backgroundColor: 'rgba(244, 63, 94, 0.10)',
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
          pointBackgroundColor: '#f43f5e',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 7
        }
      ];
    } else {
      const netoData = items.map(i => Number(i.neto_dia));

      datasets = [
        {
          label: 'Balance Neto Diario',
          data: netoData,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.12)',
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 7
        }
      ];
    }

    this.chartLineaTendencia = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              boxWidth: 8,
              padding: 14,
              font: { size: 12, weight: 'bold', family: 'Inter, system-ui, sans-serif' }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.94)',
            titleFont: { size: 13, weight: 'bold' },
            bodyFont: { size: 12 },
            padding: 12,
            cornerRadius: 10,
            callbacks: {
              label: (ctx) => {
                const val = (ctx.raw as number) || 0;
                return ` ${ctx.dataset.label}: S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              },
              footer: (tooltipItems) => {
                if (this.modoLineaTendencia === 'comparativa' && tooltipItems.length >= 2) {
                  const ing = (tooltipItems[0].raw as number) || 0;
                  const egr = (tooltipItems[1].raw as number) || 0;
                  const dif = ing - egr;
                  const signo = dif >= 0 ? '+' : '';
                  return `\nNeto del día: ${signo}S/ ${dif.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                }
                return '';
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { size: 11, weight: 'bold', family: 'Inter, system-ui, sans-serif' },
              color: '#64748b'
            }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(226, 232, 240, 0.7)' },
            ticks: {
              font: { size: 11, family: 'Inter, system-ui, sans-serif' },
              color: '#64748b',
              callback: (value) => 'S/ ' + Number(value).toLocaleString('es-PE')
            }
          }
        }
      }
    });
  }

  // ==========================================
  // RENDERIZADO DE GRÁFICOS: PRODUCTOS
  // ==========================================
  renderGraficosProductos(): void {
    if (!this.dataProductos) return;
    setTimeout(() => {
      this.renderChartBarrasTopProd();
      this.renderChartDonaCategorias();
    }, 40);
  }

  private renderChartBarrasTopProd(intento = 0): void {
    const canvas = document.getElementById('canvasBarrasTopProd') as HTMLCanvasElement;
    if (!canvas) {
      if (intento < 8) {
        setTimeout(() => this.renderChartBarrasTopProd(intento + 1), 70);
      }
      return;
    }
    if (!this.dataProductos) return;

    if (this.chartBarrasTopProd) {
      this.chartBarrasTopProd.destroy();
      this.chartBarrasTopProd = undefined;
    }

    const top10 = (this.dataProductos.ranking || []).slice(0, 10);
    const labels = top10.map(p => p.nombre.length > 25 ? p.nombre.substring(0, 23) + '...' : p.nombre);

    const esMonto = this.modoMetricaProductos === 'monto';
    const dataValues = top10.map(p => esMonto ? Number(p.total_recaudado) : Number(p.total_unidades));

    this.chartBarrasTopProd = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: esMonto ? 'Total Recaudado (S/)' : 'Unidades Vendidas',
          data: dataValues,
          backgroundColor: esMonto ? 'rgba(79, 70, 229, 0.88)' : 'rgba(16, 185, 129, 0.88)',
          hoverBackgroundColor: esMonto ? '#4338ca' : '#059669',
          borderColor: esMonto ? '#4f46e5' : '#10b981',
          borderWidth: 1.5,
          borderRadius: 8,
          borderSkipped: false,
          maxBarThickness: 26
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.94)',
            titleFont: { size: 13, weight: 'bold' },
            padding: 12,
            cornerRadius: 10,
            callbacks: {
              title: (ctx) => {
                const index = ctx[0].dataIndex;
                return top10[index]?.nombre || '';
              },
              label: (ctx) => {
                const item = top10[ctx.dataIndex];
                if (!item) return '';
                return [
                  ` Recaudado: S/ ${Number(item.total_recaudado).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  ` Cantidad vendida: ${item.total_unidades} unidades`,
                  ` Precio unitario: S/ ${Number(item.precio).toFixed(2)}`
                ];
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: { color: 'rgba(226, 232, 240, 0.7)' },
            ticks: {
              font: { size: 11, family: 'Inter, system-ui, sans-serif' },
              color: '#64748b',
              callback: (val) => esMonto ? 'S/ ' + Number(val).toLocaleString('es-PE') : val.toString()
            }
          },
          y: {
            grid: { display: false },
            ticks: {
              font: { size: 11, weight: 'bold', family: 'Inter, system-ui, sans-serif' },
              color: '#334155'
            }
          }
        }
      }
    });
  }

  private renderChartDonaCategorias(intento = 0): void {
    const canvas = document.getElementById('canvasDonaCategorias') as HTMLCanvasElement;
    if (!canvas) {
      if (intento < 8) {
        setTimeout(() => this.renderChartDonaCategorias(intento + 1), 70);
      }
      return;
    }
    if (!this.dataProductos) return;

    if (this.chartDonaCategorias) {
      this.chartDonaCategorias.destroy();
      this.chartDonaCategorias = undefined;
    }

    const categorias = this.dataProductos.ventasPorCategoria || [];
    const labels = categorias.map(c => c.categoria);
    const data = categorias.map(c => Number(c.total_recaudado));

    const palette = [
      '#4f46e5', // Indigo
      '#06b6d4', // Cyan
      '#10b981', // Esmeralda
      '#f59e0b', // Ámbar
      '#ec4899', // Rosa
      '#8b5cf6', // Violeta
      '#14b8a6', // Teal
      '#f97316', // Naranja
      '#64748b'  // Slate
    ];

    const bgColors = labels.map((_, i) => palette[i % palette.length]);

    this.chartDonaCategorias = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: bgColors,
          borderWidth: 3,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              boxWidth: 8,
              padding: 12,
              font: { size: 11, weight: 'bold', family: 'Inter, system-ui, sans-serif' }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.94)',
            padding: 12,
            cornerRadius: 10,
            callbacks: {
              label: (ctx) => {
                const cat = categorias[ctx.dataIndex];
                const val = (ctx.raw as number) || 0;
                return ` ${ctx.label}: S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${cat?.porcentaje || 0}%)`;
              }
            }
          }
        }
      }
    });
  }

  // ==========================================
  // HELPERS DE FORMATEO Y DESTRUCCIÓN
  // ==========================================
  private destruirGraficosDinero(): void {
    if (this.chartBarrasDinero) {
      this.chartBarrasDinero.destroy();
      this.chartBarrasDinero = undefined;
    }
    if (this.chartDonaFlujo) {
      this.chartDonaFlujo.destroy();
      this.chartDonaFlujo = undefined;
    }
    if (this.chartDonaMedios) {
      this.chartDonaMedios.destroy();
      this.chartDonaMedios = undefined;
    }
    if (this.chartLineaTendencia) {
      this.chartLineaTendencia.destroy();
      this.chartLineaTendencia = undefined;
    }
  }

  private destruirGraficosProductos(): void {
    if (this.chartBarrasTopProd) {
      this.chartBarrasTopProd.destroy();
      this.chartBarrasTopProd = undefined;
    }
    if (this.chartDonaCategorias) {
      this.chartDonaCategorias.destroy();
      this.chartDonaCategorias = undefined;
    }
  }

  private formatearMes(mesAnio: string): string {
    if (!mesAnio) return '';
    const partes = mesAnio.split('-');
    if (partes.length < 2) return mesAnio;
    const year = partes[0];
    const monthIndex = parseInt(partes[1], 10) - 1;
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
    const nombreMes = meses[monthIndex] || partes[1];
    return `${nombreMes} ${year}`;
  }

  private formatearDia(fechaStr: string): string {
    if (!fechaStr) return '';
    const partes = fechaStr.split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}`;
    }
    return fechaStr;
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
