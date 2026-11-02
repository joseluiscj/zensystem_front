import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MaterialModule } from '../../../material/material.module';
import { CompraDetalleItem, CompraItem, CompraService } from '../../../services/compra.service';

@Component({
  selector: 'app-compra-detalle-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    MatProgressBarModule,
    DecimalPipe,
    DatePipe
  ],
  templateUrl: './compra-detalle-dialog.component.html',
  styleUrls: ['./compra-detalle-dialog.component.scss']
})
export class CompraDetalleDialogComponent implements OnInit {
  cargando: boolean = false;
  compra: CompraItem;
  detalles: CompraDetalleItem[] = [];

  constructor(
    public dialogRef: MatDialogRef<CompraDetalleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { idCompra: number; compra?: CompraItem },
    private compraService: CompraService
  ) {
    this.compra = data.compra as CompraItem;
  }

  ngOnInit(): void {
    if (this.data.idCompra) {
      this.cargarDetalle(this.data.idCompra);
    }
  }

  cargarDetalle(id: number): void {
    this.cargando = true;
    this.compraService.getCompra(id).subscribe({
      next: (res) => {
        this.cargando = false;
        if (res.code === 200) {
          this.compra = res.data.compra;
          this.detalles = res.data.detalles;
        }
      },
      error: () => {
        this.cargando = false;
      }
    });
  }

  imprimir(): void {
    window.print();
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
