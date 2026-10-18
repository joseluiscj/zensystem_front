import { Component, Inject, OnInit } from '@angular/core';
import { MaterialModule } from '../../../material/material.module';
import { CommonModule, CurrencyPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AperturaCajaService } from '../../../services/apertura-caja.service';
import { CajaMovimiento } from '../../../../model/cajaMovimiento';

@Component({
  selector: 'app-movimiento-dialog',
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
  templateUrl: './movimiento-dialog.component.html',
  styleUrl: './movimiento-dialog.component.css'
})
export class MovimientoDialogComponent implements OnInit {
  movimientos: CajaMovimiento[] = [];
  cargando: boolean = true;
  mostrarNuevoMovimiento: boolean = false;
  movimientoForm: UntypedFormGroup;
  isSaving: boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { idCajaDetalle: number, cajaNombre: string, state: number },
    private dialogRef: MatDialogRef<MovimientoDialogComponent>,
    private aperturaService: AperturaCajaService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initialForm();
    this.cargarMovimientos();
  }

  private initialForm() {
    this.movimientoForm = new UntypedFormGroup({
      tipo: new UntypedFormControl('I', [Validators.required]),
      monto: new UntypedFormControl('', [Validators.required, Validators.min(0.01)]),
      descripcion: new UntypedFormControl('', [Validators.required, Validators.maxLength(255)]),
      metodoPago: new UntypedFormControl('EF', [Validators.required]),
    });
  }

  cargarMovimientos() {
    this.cargando = true;
    this.aperturaService.getMovimientos(this.data.idCajaDetalle).subscribe({
      next: (res) => {
        this.cargando = false;
        if (res.code === 200) {
          this.movimientos = res.data;
        } else {
          this.snackBar.open(res.message || 'Error al cargar movimientos', 'Error', { duration: 4000 });
        }
      },
      error: () => {
        this.cargando = false;
        this.snackBar.open('Error al conectar con el servidor', 'Error', { duration: 4000 });
      }
    });
  }

  toggleNuevoMovimiento() {
    this.mostrarNuevoMovimiento = !this.mostrarNuevoMovimiento;
  }

  guardarMovimiento() {
    if (this.movimientoForm.invalid) {
      this.snackBar.open('Complete los datos del movimiento', 'Aviso', { duration: 3000 });
      return;
    }

    this.isSaving = true;
    const payload = {
      idCajaDetalle: this.data.idCajaDetalle,
      tipo: this.movimientoForm.controls['tipo'].value,
      monto: parseFloat(this.movimientoForm.controls['monto'].value),
      descripcion: this.movimientoForm.controls['descripcion'].value,
      metodoPago: this.movimientoForm.controls['metodoPago'].value
    };

    this.aperturaService.registrarMovimiento(payload).subscribe({
      next: (res) => {
        this.isSaving = false;
        if (res.code === 200) {
          this.snackBar.open('Movimiento registrado con éxito', 'Correcto', {
            duration: 3000,
            panelClass: 'custom-snackbar'
          });
          this.mostrarNuevoMovimiento = false;
          this.movimientoForm.reset({ tipo: 'I', metodoPago: 'EF' });
          this.cargarMovimientos();
        } else {
          this.snackBar.open(res.message || 'Error al registrar movimiento', 'Error', { duration: 4000 });
        }
      },
      error: (err) => {
        this.isSaving = false;
        this.snackBar.open(err?.error?.message || 'Error de conexión', 'Error', { duration: 4000 });
      }
    });
  }

  close() {
    this.dialogRef.close();
  }
}
