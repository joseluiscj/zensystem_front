import { Component, Inject, OnInit } from '@angular/core';
import { MaterialModule } from '../../../material/material.module';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe, NgFor, NgIf } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AperturaCajaService } from '../../../services/apertura-caja.service';

@Component({
  selector: 'app-cierre-dialog',
  standalone: true,
  imports: [
    MaterialModule,
    CommonModule,
    NgIf,
    NgFor,
    ReactiveFormsModule,
    FormsModule,
    DatePipe,
    CurrencyPipe,
    DecimalPipe,
    MatProgressBarModule,
    MatCheckboxModule
  ],
  templateUrl: './cierre-dialog.component.html',
  styleUrl: './cierre-dialog.component.css'
})
export class CierreDialogComponent implements OnInit {
  basicForm: UntypedFormGroup;
  isButtonDisabled: boolean = false;
  cargandoResumen: boolean = true;
  resumen: any = null;
  diferencia: number = 0;

  // Transferencia de fondos al cierre
  esCajaPrincipal: boolean = false;
  cajasDestino: any[] = [];

  transferirEfectivo: boolean = false;
  idCajaDestinoEfectivo: number | null = null;
  montoTransferirEfectivo: number = 0;

  transferirTarjeta: boolean = false;
  idCajaDestinoTarjeta: number | null = null;
  montoTransferirTarjeta: number = 0;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { idCajaDetalle: number, cajaNombre?: string, aMonto?: number },
    private dialogRef: MatDialogRef<CierreDialogComponent>,
    private aperturaService: AperturaCajaService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'auto' });
    this.initialForm();
    this.cargarResumen();
  }

  private initialForm() {
    this.basicForm = new UntypedFormGroup({
      cMonto: new UntypedFormControl(0.00, [Validators.required, Validators.min(0)]),
    });
  }

  cargarResumen() {
    this.cargandoResumen = true;
    this.aperturaService.getResumen(this.data.idCajaDetalle).subscribe({
      next: (res) => {
        this.cargandoResumen = false;
        if (res.code === 200) {
          this.resumen = res.data;
          this.esCajaPrincipal = Number(this.resumen.detalle?.principal) === 1;
          this.cajasDestino = this.resumen.cajasDestino || [];

          const saldoEsperado = this.resumen.saldoEsperadoEfectivo || 0;
          this.basicForm.controls['cMonto'].setValue(saldoEsperado);
          this.calcularDiferencia();

          // Configurar transferencias
          this.idCajaDestinoEfectivo = this.resumen.idCajaDestinoEfectivo || null;
          this.idCajaDestinoTarjeta = this.resumen.idCajaDestinoTarjeta || null;

          if (!this.esCajaPrincipal && this.cajasDestino.length > 0) {
            // Por defecto activar transferencia si hay caja destino configurada
            if (this.idCajaDestinoEfectivo) {
              this.transferirEfectivo = true;
            }
            if (this.idCajaDestinoTarjeta && this.resumen.totalTarjeta > 0) {
              this.transferirTarjeta = true;
            }
          }

          this.montoTransferirEfectivo = Math.max(0, saldoEsperado);
          this.montoTransferirTarjeta = Math.max(0, this.resumen.totalTarjeta || 0);
        } else {
          this.snackBar.open(res.message || 'Error al cargar resumen', 'Error', { duration: 4000 });
        }
      },
      error: () => {
        this.cargandoResumen = false;
        this.snackBar.open('Error al conectar con el servidor', 'Error', { duration: 4000 });
      }
    });
  }

  calcularDiferencia() {
    const conteoReal = parseFloat(this.basicForm.controls['cMonto'].value || 0);
    const saldoEsperado = this.resumen?.saldoEsperadoEfectivo || 0;
    this.diferencia = Math.round((conteoReal - saldoEsperado) * 100) / 100;

    // Actualizar monto sugerido a transferir si coincide con el conteo
    if (this.transferirEfectivo && (!this.montoTransferirEfectivo || this.montoTransferirEfectivo === saldoEsperado)) {
      this.montoTransferirEfectivo = Math.max(0, conteoReal);
    }
  }

  copiarSaldoEsperado() {
    const saldoEsperado = this.resumen?.saldoEsperadoEfectivo || 0;
    this.basicForm.controls['cMonto'].setValue(saldoEsperado);
    this.calcularDiferencia();
  }

  setTransferenciaTodoEfectivo(): void {
    const conteoReal = parseFloat(this.basicForm.controls['cMonto'].value || 0);
    this.montoTransferirEfectivo = Math.max(0, conteoReal);
  }

  setTransferenciaDejarFondo(fondo: number): void {
    const conteoReal = parseFloat(this.basicForm.controls['cMonto'].value || 0);
    this.montoTransferirEfectivo = Math.max(0, conteoReal - fondo);
  }

  get esCuadreExacto(): boolean {
    return Math.abs(this.diferencia) < 0.001;
  }

  get esSobrante(): boolean {
    return this.diferencia > 0.001;
  }

  get esFaltante(): boolean {
    return this.diferencia < -0.001;
  }

  save() {
    if (this.basicForm.invalid) {
      this.snackBar.open('Ingrese un monto válido de cierre', 'Aviso', { duration: 3000 });
      return;
    }

    const conteo = parseFloat(this.basicForm.controls['cMonto'].value || 0);
    const montoEfTrans = parseFloat(this.montoTransferirEfectivo as any || 0);
    const montoTarTrans = parseFloat(this.montoTransferirTarjeta as any || 0);

    if (this.transferirEfectivo && montoEfTrans > conteo) {
      this.snackBar.open('El monto en efectivo a transferir no puede ser mayor al dinero contado en caja', 'Aviso', { duration: 4000 });
      return;
    }

    this.isButtonDisabled = true;
    const payload = {
      idCajaDetalle: this.data.idCajaDetalle,
      cMonto: conteo,
      transferirEfectivo: this.transferirEfectivo && this.idCajaDestinoEfectivo !== null && montoEfTrans > 0,
      idCajaDestinoEfectivo: this.idCajaDestinoEfectivo,
      montoTransferirEfectivo: montoEfTrans,
      transferirTarjeta: this.transferirTarjeta && this.idCajaDestinoTarjeta !== null && montoTarTrans > 0,
      idCajaDestinoTarjeta: this.idCajaDestinoTarjeta,
      montoTransferirTarjeta: montoTarTrans
    };

    this.aperturaService.cerrar(payload).subscribe({
      next: (res) => {
        this.isButtonDisabled = false;
        if (res.code === 200) {
          this.snackBar.open(res.message || '¡Caja cerrada correctamente!', 'Correcto', {
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
        this.isButtonDisabled = false;
        const msg = err?.error?.message || 'Error al cerrar caja';
        this.snackBar.open(msg, 'Error', { duration: 5000, panelClass: 'custom-snackbar' });
      }
    });
  }

  close() {
    this.dialogRef.close();
  }
}
