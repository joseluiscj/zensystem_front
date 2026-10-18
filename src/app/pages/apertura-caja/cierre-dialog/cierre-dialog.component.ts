import { Component, Inject, OnInit } from '@angular/core';
import { MaterialModule } from '../../../material/material.module';
import { CommonModule, CurrencyPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
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
    MatProgressBarModule
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

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { idCajaDetalle: number },
    private dialogRef: MatDialogRef<CierreDialogComponent>,
    private aperturaService: AperturaCajaService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
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
          const saldoEsperado = this.resumen.saldoEsperadoEfectivo || 0;
          this.basicForm.controls['cMonto'].setValue(saldoEsperado);
          this.calcularDiferencia();
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
    this.diferencia = conteoReal - saldoEsperado;
  }

  save() {
    if (this.basicForm.invalid) {
      this.snackBar.open('Ingrese un monto válido de cierre', 'Aviso', { duration: 3000 });
      return;
    }

    this.isButtonDisabled = true;
    const payload = {
      idCajaDetalle: this.data.idCajaDetalle,
      cMonto: parseFloat(this.basicForm.controls['cMonto'].value || 0)
    };

    this.aperturaService.cerrar(payload).subscribe({
      next: (res) => {
        this.isButtonDisabled = false;
        if (res.code === 200) {
          this.snackBar.open('¡Caja cerrada correctamente!', 'Correcto', {
            duration: 3000,
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
