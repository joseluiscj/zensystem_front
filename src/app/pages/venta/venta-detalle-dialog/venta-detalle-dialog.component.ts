import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { MaterialModule } from '../../../material/material.module';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PedidoService } from '../../../services/pedido.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-venta-detalle-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    MatProgressBarModule,
    DecimalPipe,
    DatePipe
  ],
  templateUrl: './venta-detalle-dialog.component.html',
  styleUrl: './venta-detalle-dialog.component.css'
})
export class VentaDetalleDialogComponent implements OnInit {
  idPedido: number;
  cargando: boolean = true;
  pedido: any = null;
  detalle: any[] = [];

  constructor(
    private dialogRef: MatDialogRef<VentaDetalleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { idPedido: number },
    private pedidoService: PedidoService,
    private snackBar: MatSnackBar
  ) {
    this.idPedido = data?.idPedido;
  }

  ngOnInit(): void {
    if (this.idPedido) {
      this.cargarDetalle();
    } else {
      this.snackBar.open('ID de pedido inválido', 'Cerrar', { duration: 3000 });
      this.dialogRef.close();
    }
  }

  cargarDetalle(): void {
    this.cargando = true;
    this.pedidoService.obtenerPedidoCompleto(this.idPedido).subscribe({
      next: (res) => {
        this.cargando = false;
        if (res && res.code === 200) {
          this.pedido = res.data;
          this.detalle = res.detalle || [];
        } else {
          this.snackBar.open('No se pudo obtener el detalle de la venta', 'Cerrar', { duration: 3000 });
        }
      },
      error: (err) => {
        this.cargando = false;
        console.error(err);
        this.snackBar.open('Error al cargar detalle del pedido', 'Cerrar', { duration: 3500 });
      }
    });
  }

  imprimir(): void {
    window.print();
  }

  editar(): void {
    this.dialogRef.close({ accion: 'editar', idPedido: this.idPedido });
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
