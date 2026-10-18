import { Component, OnInit } from '@angular/core';
import { MaterialModule } from '../../../material/material.module';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AperturaCajaService } from '../../../services/apertura-caja.service';

@Component({
  selector: 'app-apertura-dialog',
  standalone: true,
  imports: [
    MaterialModule,
    CommonModule,
    NgFor,
    NgIf,
    ReactiveFormsModule,
    FormsModule,
    MatProgressBarModule
  ],
  templateUrl: './apertura-dialog.component.html',
  styleUrl: './apertura-dialog.component.css'
})
export class AperturaDialogComponent implements OnInit {
  basicForm: UntypedFormGroup;
  isButtonDisabled: boolean = false;
  cajasDisponibles: any[] = [];
  cargandoCajas: boolean = true;

  constructor(
    private dialogRef: MatDialogRef<AperturaDialogComponent>,
    private aperturaService: AperturaCajaService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initialForm();
    this.cargarCajasDisponibles();
  }

  private initialForm() {
    this.basicForm = new UntypedFormGroup({
      idCaja: new UntypedFormControl('', [Validators.required]),
      aMonto: new UntypedFormControl(0.00, [Validators.required, Validators.min(0)]),
    });
  }

  cargarCajasDisponibles() {
    this.cargandoCajas = true;
    this.aperturaService.getCajasDisponibles().subscribe({
      next: (res) => {
        this.cargandoCajas = false;
        if (res.code === 200) {
          this.cajasDisponibles = res.data;
          if (this.cajasDisponibles.length > 0) {
            this.basicForm.controls['idCaja'].setValue(this.cajasDisponibles[0].id);
            // Prellenar saldo anterior de la caja si existe
            if (this.cajasDisponibles[0].saldo) {
              this.basicForm.controls['aMonto'].setValue(parseFloat(this.cajasDisponibles[0].saldo));
            }
          }
        }
      },
      error: () => {
        this.cargandoCajas = false;
        this.snackBar.open('Error al cargar cajas disponibles', 'Cerrar', { duration: 3000 });
      }
    });
  }

  onCajaSelected(idCaja: number) {
    const seleccionada = this.cajasDisponibles.find(c => c.id === idCaja);
    if (seleccionada && seleccionada.saldo) {
      this.basicForm.controls['aMonto'].setValue(parseFloat(seleccionada.saldo));
    }
  }

  save() {
    if (this.basicForm.invalid) {
      this.snackBar.open('Por favor complete los campos obligatorios', 'Aviso', { duration: 3000 });
      return;
    }

    this.isButtonDisabled = true;
    const payload = {
      idCaja: this.basicForm.controls['idCaja'].value,
      aMonto: parseFloat(this.basicForm.controls['aMonto'].value || 0)
    };

    this.aperturaService.aperturar(payload).subscribe({
      next: (res) => {
        this.isButtonDisabled = false;
        if (res.code === 200) {
          this.snackBar.open('¡Caja aperturada con éxito!', 'Correcto', {
            duration: 3000,
            panelClass: 'custom-snackbar'
          });
          this.dialogRef.close('success');
        } else {
          this.snackBar.open(res.message || 'Error al aperturar caja', 'Error', {
            duration: 5000,
            panelClass: 'custom-snackbar'
          });
        }
      },
      error: (err) => {
        this.isButtonDisabled = false;
        const msg = err?.error?.message || 'Error de conexión con el servidor';
        this.snackBar.open(msg, 'Error', { duration: 5000, panelClass: 'custom-snackbar' });
      }
    });
  }

  close() {
    this.dialogRef.close();
  }
}
