import { Component, OnInit } from '@angular/core';
import { MaterialModule } from '../../material/material.module';
import { MatExpansionModule } from '@angular/material/expansion';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatPaginatorModule } from '@angular/material/paginator';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MesaService } from '../../services/mesa.service';
import { RestaurantePedidoComponent } from './restaurante-pedido/restaurante-pedido.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router } from '@angular/router';

export interface MesaItem {
  id: number;
  nombre: string;
  disponible: number;
  cliente: string;
  montoTotal: number;
  state: number;
}

@Component({
  selector: 'app-restaurante',
  standalone: true,
  imports: [
    MaterialModule,
    MatExpansionModule, 
    ReactiveFormsModule, 
    FormsModule,
    MatPaginatorModule,
    CommonModule,
    MatTooltipModule,
    RestaurantePedidoComponent,
    MatProgressBarModule
  ],
  templateUrl: './restaurante.component.html',
  styleUrl: './restaurante.component.css'
})
export class RestauranteComponent implements OnInit {
  mesas: MesaItem[] = [];
  mesasFiltradas: MesaItem[] = [];
  mostrarFormulario = false;
  idMesaSeleccionada?: number;
  cardaData: boolean = true;

  mOcupadas: number = 0;
  mDisponible: number = 0;
  mTotal: number = 0;
  mPendientes: number = 0;
  mAtendidas: number = 0;
  tasaOcupacion: number = 0;

  filtroActual: string = 'todas';
  textoBusqueda: string = '';

  constructor(
    private _dialog: MatDialog,
    private mesaService: MesaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'auto' });
    this.listData();
  }

  openDialog(id?: number) { 
    this.idMesaSeleccionada = id; 
    this.mostrarFormulario = true;
  } 

  cerrarFormulario() {
    this.mostrarFormulario = false;
    this.idMesaSeleccionada = undefined;
    this.listData();
  }

  listData() {
    this.cardaData = true;
    this.mOcupadas = 0;
    this.mDisponible = 0;
    this.mPendientes = 0;
    this.mAtendidas = 0;

    this.mesaService.listMesas().subscribe({
      next: (data: MesaItem[]) => {
        this.cardaData = false;
        this.mesas = data || [];
        this.mTotal = this.mesas.length;

        this.mesas.forEach((item) => {
          if (item.disponible === 0) {
            this.mOcupadas++;
            if (item.state === 1) {
              this.mAtendidas++;
            } else {
              this.mPendientes++;
            }
          }
        });

        this.mDisponible = this.mTotal - this.mOcupadas;
        this.tasaOcupacion = this.mTotal > 0 ? Math.round((this.mOcupadas / this.mTotal) * 100) : 0;
        this.aplicarFiltros();
      },
      error: () => {
        this.cardaData = false;
      }
    });
  }

  setFiltro(tipo: string) {
    this.filtroActual = tipo;
    this.aplicarFiltros();
  }

  onBuscarChange() {
    this.aplicarFiltros();
  }

  limpiarBusqueda() {
    this.textoBusqueda = '';
    this.aplicarFiltros();
  }

  aplicarFiltros() {
    let resultado = [...this.mesas];

    // Filtro por pestañas de estado
    if (this.filtroActual === 'disponibles') {
      resultado = resultado.filter(m => m.disponible === 1);
    } else if (this.filtroActual === 'ocupadas') {
      resultado = resultado.filter(m => m.disponible === 0);
    } else if (this.filtroActual === 'pendientes') {
      resultado = resultado.filter(m => m.disponible === 0 && m.state !== 1);
    } else if (this.filtroActual === 'atendidas') {
      resultado = resultado.filter(m => m.disponible === 0 && m.state === 1);
    }

    // Filtro por texto de búsqueda (nombre de mesa o cliente)
    if (this.textoBusqueda.trim() !== '') {
      const q = this.textoBusqueda.toLowerCase().trim();
      resultado = resultado.filter(m => 
        (m.nombre && m.nombre.toLowerCase().includes(q)) ||
        (m.cliente && m.cliente.toLowerCase().includes(q))
      );
    }

    this.mesasFiltradas = resultado;
  }

  irAperturaCaja() {
    this.router.navigate(['/pages/apertura']);
  }
}
