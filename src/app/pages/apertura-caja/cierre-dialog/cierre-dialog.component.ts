import { Component, Inject, OnInit } from '@angular/core';
import { MaterialModule } from '../../../material/material.module';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe, NgFor, NgIf } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AperturaCajaService } from '../../../services/apertura-caja.service';
import { CierreConfirmacionDialogComponent } from './cierre-confirmacion-dialog/cierre-confirmacion-dialog.component';

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
  montoTransferirEfectivo: any = '0.00';

  transferirTarjeta: boolean = false;
  idCajaDestinoTarjeta: number | null = null;
  montoTransferirTarjeta: any = '0.00';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { idCajaDetalle: number, cajaNombre?: string, aMonto?: number },
    private dialogRef: MatDialogRef<CierreDialogComponent>,
    private aperturaService: AperturaCajaService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'auto' });
    this.initialForm();
    this.cargarResumen();
  }

  private initialForm() {
    this.basicForm = new UntypedFormGroup({
      cMonto: new UntypedFormControl('0.00', [Validators.required, Validators.min(0)]),
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

          const saldoEsperado = Number(this.resumen.saldoEsperadoEfectivo || 0);
          this.basicForm.controls['cMonto'].setValue(saldoEsperado.toFixed(2));
          this.calcularDiferencia();

          // Configurar transferencias
          this.idCajaDestinoEfectivo = this.resumen.idCajaDestinoEfectivo || null;
          this.idCajaDestinoTarjeta = this.resumen.idCajaDestinoTarjeta || null;

          if (!this.esCajaPrincipal && this.cajasDestino.length > 0) {
            // Por defecto activar transferencia si hay caja destino configurada
            if (this.idCajaDestinoEfectivo) {
              this.transferirEfectivo = true;
            }
            if (this.idCajaDestinoTarjeta && Number(this.resumen.totalTarjeta || 0) > 0) {
              this.transferirTarjeta = true;
            }
          }

          this.montoTransferirEfectivo = Math.max(0, saldoEsperado).toFixed(2);
          this.montoTransferirTarjeta = Math.max(0, Number(this.resumen.totalTarjeta || 0)).toFixed(2);
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
    const rawVal = this.basicForm.controls['cMonto'].value;
    const conteoReal = parseFloat(String(rawVal !== null && rawVal !== undefined ? rawVal : 0).replace(',', '.'));
    const saldoEsperado = Number(this.resumen?.saldoEsperadoEfectivo || 0);
    const validConteo = isNaN(conteoReal) ? 0 : conteoReal;
    this.diferencia = Math.round((validConteo - saldoEsperado) * 100) / 100;

    // Actualizar monto sugerido a transferir si coincide con el conteo o si estaba sincronizado
    if (this.transferirEfectivo && (!this.montoTransferirEfectivo || parseFloat(String(this.montoTransferirEfectivo)) === saldoEsperado)) {
      this.montoTransferirEfectivo = Math.max(0, validConteo).toFixed(2);
    }
  }

  formatearCMonto(): void {
    const rawVal = this.basicForm.controls['cMonto'].value;
    const val = parseFloat(String(rawVal !== null && rawVal !== undefined ? rawVal : 0).replace(',', '.'));
    const formateado = (isNaN(val) || val < 0 ? 0 : val).toFixed(2);
    this.basicForm.controls['cMonto'].setValue(formateado);
    this.calcularDiferencia();
  }

  formatearMontoTransferirEfectivo(): void {
    const val = parseFloat(String(this.montoTransferirEfectivo !== null && this.montoTransferirEfectivo !== undefined ? this.montoTransferirEfectivo : 0).replace(',', '.'));
    this.montoTransferirEfectivo = (isNaN(val) || val < 0 ? 0 : val).toFixed(2);
  }

  formatearMontoTransferirTarjeta(): void {
    const val = parseFloat(String(this.montoTransferirTarjeta !== null && this.montoTransferirTarjeta !== undefined ? this.montoTransferirTarjeta : 0).replace(',', '.'));
    this.montoTransferirTarjeta = (isNaN(val) || val < 0 ? 0 : val).toFixed(2);
  }

  copiarSaldoEsperado() {
    const saldoEsperado = Number(this.resumen?.saldoEsperadoEfectivo || 0);
    this.basicForm.controls['cMonto'].setValue(saldoEsperado.toFixed(2));
    if (this.transferirEfectivo) {
      this.montoTransferirEfectivo = Math.max(0, saldoEsperado).toFixed(2);
    }
    this.calcularDiferencia();
  }

  setTransferenciaTodoEfectivo(): void {
    const rawVal = this.basicForm.controls['cMonto'].value;
    const conteoReal = parseFloat(String(rawVal || 0).replace(',', '.'));
    const val = isNaN(conteoReal) ? 0 : conteoReal;
    this.montoTransferirEfectivo = Math.max(0, val).toFixed(2);
  }

  setTransferenciaDejarFondo(fondo: number): void {
    const rawVal = this.basicForm.controls['cMonto'].value;
    const conteoReal = parseFloat(String(rawVal || 0).replace(',', '.'));
    const val = isNaN(conteoReal) ? 0 : conteoReal;
    this.montoTransferirEfectivo = Math.max(0, val - fondo).toFixed(2);
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

    const rawConteo = this.basicForm.controls['cMonto'].value;
    const conteo = Math.round(parseFloat(String(rawConteo !== null && rawConteo !== undefined ? rawConteo : 0).replace(',', '.')) * 100) / 100;
    const montoEfTrans = Math.round(parseFloat(String(this.montoTransferirEfectivo || 0).replace(',', '.')) * 100) / 100;
    const montoTarTrans = Math.round(parseFloat(String(this.montoTransferirTarjeta || 0).replace(',', '.')) * 100) / 100;

    if (isNaN(conteo) || conteo < 0) {
      this.snackBar.open('Ingrese un monto de efectivo físico válido', 'Aviso', { duration: 3000 });
      return;
    }

    if (this.transferirEfectivo && montoEfTrans > conteo) {
      this.snackBar.open('El monto en efectivo a transferir no puede ser mayor al dinero contado en caja', 'Aviso', { duration: 4000 });
      return;
    }

    const payload = {
      idCajaDetalle: this.data.idCajaDetalle,
      cMonto: Number(conteo.toFixed(2)),
      transferirEfectivo: this.transferirEfectivo && this.idCajaDestinoEfectivo !== null && montoEfTrans > 0,
      idCajaDestinoEfectivo: this.idCajaDestinoEfectivo,
      montoTransferirEfectivo: Number(montoEfTrans.toFixed(2)),
      transferirTarjeta: this.transferirTarjeta && this.idCajaDestinoTarjeta !== null && montoTarTrans > 0,
      idCajaDestinoTarjeta: this.idCajaDestinoTarjeta,
      montoTransferirTarjeta: Number(montoTarTrans.toFixed(2))
    };

    const nombreCajaDestinoEf = this.cajasDestino.find(c => c.id === this.idCajaDestinoEfectivo)?.nombre || 'Caja Mayor / Principal';
    const nombreCajaDestinoTar = this.cajasDestino.find(c => c.id === this.idCajaDestinoTarjeta)?.nombre || 'Caja Mayor / Principal';

    const datosConfirmacion = {
      cajaNombre: this.data.cajaNombre || this.resumen?.detalle?.cajaNombre || 'Caja',
      usuarioNombre: this.resumen?.detalle?.usuarioNombre || 'Usuario',
      conteoReal: conteo,
      saldoEsperado: Number(this.resumen?.saldoEsperadoEfectivo || 0),
      diferencia: this.diferencia,
      esCuadreExacto: this.esCuadreExacto,
      esSobrante: this.esSobrante,
      esFaltante: this.esFaltante,

      transferirEfectivo: payload.transferirEfectivo,
      montoTransferirEfectivo: montoEfTrans,
      cajaDestinoEfectivoNombre: nombreCajaDestinoEf,
      saldoRemanenteEfectivo: Math.max(0, Math.round((conteo - (payload.transferirEfectivo ? montoEfTrans : 0)) * 100) / 100),

      transferirTarjeta: payload.transferirTarjeta,
      montoTransferirTarjeta: montoTarTrans,
      cajaDestinoTarjetaNombre: nombreCajaDestinoTar,

      payload
    };

    const confirmRef = this.dialog.open(CierreConfirmacionDialogComponent, {
      width: '560px',
      maxWidth: '96vw',
      disableClose: true,
      panelClass: 'modal-dialog-center',
      data: datosConfirmacion
    });

    confirmRef.afterClosed().subscribe((res) => {
      if (res === 'success') {
        this.dialogRef.close('success');
      }
    });
  }

  close() {
    this.dialogRef.close();
  }
}
