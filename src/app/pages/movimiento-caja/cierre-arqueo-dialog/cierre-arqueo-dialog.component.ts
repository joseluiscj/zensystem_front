import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { MaterialModule } from '../../../material/material.module';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AperturaCajaService } from '../../../services/apertura-caja.service';
import { CajaMovimientoItem } from '../../../services/caja-movimiento.service';

@Component({
  selector: 'app-cierre-arqueo-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    MatProgressBarModule,
    DecimalPipe,
    DatePipe
  ],
  templateUrl: './cierre-arqueo-dialog.component.html',
  styleUrl: './cierre-arqueo-dialog.component.css'
})
export class CierreArqueoDialogComponent implements OnInit {
  idCajaDetalle: number;
  movimientoOriginal?: CajaMovimientoItem;
  cargando: boolean = true;
  resumen: any = null;
  detalle: any = null;
  transferencias: any[] = [];

  constructor(
    private dialogRef: MatDialogRef<CierreArqueoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { idCajaDetalle: number; movimiento?: CajaMovimientoItem },
    private aperturaCajaService: AperturaCajaService,
    private snackBar: MatSnackBar
  ) {
    this.idCajaDetalle = data?.idCajaDetalle;
    this.movimientoOriginal = data?.movimiento;
  }

  ngOnInit(): void {
    if (this.idCajaDetalle) {
      this.cargarResumen();
    } else {
      this.snackBar.open('No se encontró el ID de turno de caja correspondiente', 'Cerrar', { duration: 3000 });
      this.dialogRef.close();
    }
  }

  cargarResumen(): void {
    this.cargando = true;
    this.aperturaCajaService.getResumen(this.idCajaDetalle).subscribe({
      next: (res) => {
        this.cargando = false;
        if (res && (res.code === 200 || res.data)) {
          this.resumen = res.data;
          this.detalle = res.data.detalle;
          this.transferencias = res.data.transferencias || [];
        } else {
          this.snackBar.open('No se pudo obtener el arqueo de esta sesión', 'Cerrar', { duration: 3000 });
        }
      },
      error: (err) => {
        this.cargando = false;
        console.error('Error al cargar arqueo:', err);
        this.snackBar.open('Error al consultar los datos del arqueo de caja', 'Cerrar', { duration: 3500 });
      }
    });
  }

  get diferenciaMonto(): number {
    return Number(this.resumen?.diferencia || 0);
  }

  get estadoDiferencia(): 'exacto' | 'sobrante' | 'faltante' {
    const diff = Math.round(this.diferenciaMonto * 100) / 100;
    if (diff === 0) return 'exacto';
    return diff > 0 ? 'sobrante' : 'faltante';
  }

  imprimir(): void {
    window.print();
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
