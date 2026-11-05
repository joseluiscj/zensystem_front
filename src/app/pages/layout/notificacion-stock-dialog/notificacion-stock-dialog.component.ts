import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MaterialModule } from '../../../material/material.module';
import { ProductoStockBajo } from '../../../../model/notificacion';

@Component({
  selector: 'app-notificacion-stock-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    DecimalPipe
  ],
  templateUrl: './notificacion-stock-dialog.component.html',
  styleUrl: './notificacion-stock-dialog.component.css'
})
export class NotificacionStockDialogComponent implements OnInit {
  productos: ProductoStockBajo[] = [];
  productosFiltrados: ProductoStockBajo[] = [];
  filtroTexto: string = '';

  totalAgotados: number = 0;
  totalCriticos: number = 0;
  totalDeficit: number = 0;

  constructor(
    private dialogRef: MatDialogRef<NotificacionStockDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { productos: ProductoStockBajo[] },
    private router: Router
  ) {
    this.productos = data?.productos || [];
    this.productosFiltrados = [...this.productos];
  }

  ngOnInit(): void {
    this.calcularMetricas();
  }

  calcularMetricas(): void {
    this.totalAgotados = this.productos.filter(p => Number(p.stock) <= 0).length;
    this.totalCriticos = this.productos.filter(p => Number(p.stock) > 0 && Number(p.stock) <= Number(p.stockMinimo)).length;
    this.totalDeficit = this.productos.reduce((acc, p) => acc + Number(p.deficit || 0), 0);
  }

  filtrar(): void {
    const busqueda = (this.filtroTexto || '').trim().toLowerCase();
    if (!busqueda) {
      this.productosFiltrados = [...this.productos];
      return;
    }

    this.productosFiltrados = this.productos.filter(p =>
      (p.nombre || '').toLowerCase().includes(busqueda) ||
      (p.codigo || '').toLowerCase().includes(busqueda) ||
      (p.categoria || '').toLowerCase().includes(busqueda)
    );
  }

  limpiarFiltro(): void {
    this.filtroTexto = '';
    this.filtrar();
  }

  navegarA(ruta: string): void {
    this.dialogRef.close();
    this.router.navigate([ruta]);
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
