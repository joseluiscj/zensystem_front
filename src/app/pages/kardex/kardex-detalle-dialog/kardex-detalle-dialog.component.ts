import { Component, Inject } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from '../../../material/material.module';
import { MovimientoAlmacen } from '../../../services/almacen.service';

@Component({
  selector: 'app-kardex-detalle-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    DatePipe,
    DecimalPipe
  ],
  templateUrl: './kardex-detalle-dialog.component.html',
  styleUrl: './kardex-detalle-dialog.component.css'
})
export class KardexDetalleDialogComponent {
  mov: MovimientoAlmacen;

  constructor(
    public dialogRef: MatDialogRef<KardexDetalleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MovimientoAlmacen
  ) {
    this.mov = data;
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
