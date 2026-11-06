import { Component, Inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from '../../../../material/material.module';
import { AperturaCajaService } from '../../../../services/apertura-caja.service';

export interface CierreConfirmacionData {
  cajaNombre: string;
  usuarioNombre: string;
  conteoReal: number;
  saldoEsperado: number;
  diferencia: number;
  esCuadreExacto: boolean;
  esSobrante: boolean;
  esFaltante: boolean;

  // Transferencia Efectivo
  transferirEfectivo: boolean;
  montoTransferirEfectivo: number;
  cajaDestinoEfectivoNombre: string;
  saldoRemanenteEfectivo: number;

  // Transferencia Tarjeta
  transferirTarjeta: boolean;
  montoTransferirTarjeta: number;
  cajaDestinoTarjetaNombre: string;

  // Payload final para la API
  payload: any;
}

@Component({
  selector: 'app-cierre-confirmacion-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    DecimalPipe
  ],
  templateUrl: './cierre-confirmacion-dialog.component.html',
  styleUrl: './cierre-confirmacion-dialog.component.css'
})
export class CierreConfirmacionDialogComponent {
  guardando: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<CierreConfirmacionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CierreConfirmacionData,
    private aperturaService: AperturaCajaService,
    private snackBar: MatSnackBar
  ) {}

  cancelar(): void {
    if (!this.guardando) {
      this.dialogRef.close(false);
    }
  }

  confirmar(): void {
    this.guardando = true;
    this.aperturaService.cerrar(this.data.payload).subscribe({
      next: (res) => {
        this.guardando = false;
        if (res.code === 200) {
          this.snackBar.open(res.message || '¡Caja cerrada y transferencias registradas correctamente!', 'Correcto', {
            duration: 4500,
            panelClass: 'custom-snackbar'
          });
          this.dialogRef.close('success');
        } else {
          this.snackBar.open(res.message || 'Error al cerrar caja', 'Error', {
            duration: 5000,
            panelClass: 'custom-snackbar'
          });
        }
      },
      error: (err) => {
        this.guardando = false;
        const msg = err?.error?.message || 'Error al conectar con el servidor';
        this.snackBar.open(msg, 'Error', { duration: 5000, panelClass: 'custom-snackbar' });
      }
    });
  }
}
