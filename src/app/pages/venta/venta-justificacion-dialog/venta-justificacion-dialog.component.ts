import { Component, Inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MaterialModule } from '../../../material/material.module';

export interface VentaJustificacionData {
  idPedido: number;
  montoTotal: number;
  nombreCliente?: string;
  itemsCount?: number;
}

@Component({
  selector: 'app-venta-justificacion-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, DecimalPipe],
  templateUrl: './venta-justificacion-dialog.component.html',
  styleUrl: './venta-justificacion-dialog.component.css'
})
export class VentaJustificacionDialogComponent {
  motivo: string = '';
  error: string = '';

  constructor(
    public dialogRef: MatDialogRef<VentaJustificacionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: VentaJustificacionData
  ) {}

  cancelar(): void {
    this.dialogRef.close(null);
  }

  confirmar(): void {
    const texto = (this.motivo || '').trim();
    if (!texto) {
      this.error = 'Debe ingresar obligatoriamente una justificación para continuar.';
      return;
    }
    if (texto.length < 5) {
      this.error = 'La justificación debe tener al menos 5 caracteres descriptivos.';
      return;
    }
    this.dialogRef.close({ confirmado: true, motivo: texto });
  }
}
