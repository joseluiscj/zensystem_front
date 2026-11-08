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
  cajasOrigen: any[] = [];
  cajaOrigenSeleccionada: any = null;
  usuariosDisponibles: any[] = [];
  cargandoCajas: boolean = true;
  usuarioActualId: number | null = null;

  constructor(
    private dialogRef: MatDialogRef<AperturaDialogComponent>,
    private aperturaService: AperturaCajaService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'auto' });
    this.initialForm();
    this.cargarCajasDisponibles();
  }

  private initialForm() {
    this.basicForm = new UntypedFormGroup({
      idCaja: new UntypedFormControl('', [Validators.required]),
      idUsuario: new UntypedFormControl('', [Validators.required]),
      aMonto: new UntypedFormControl('0.00', [Validators.required, Validators.min(0)]),
      idCajaOrigen: new UntypedFormControl(null),
    });
  }

  cargarCajasDisponibles() {
    this.cargandoCajas = true;
    this.aperturaService.getCajasDisponibles().subscribe({
      next: (res: any) => {
        this.cargandoCajas = false;
        if (res.code === 200) {
          this.cajasDisponibles = res.data || [];
          this.cajasOrigen = res.cajasOrigen || [];
          this.usuariosDisponibles = res.usuarios || [];
          this.usuarioActualId = res.usuarioActual || null;

          if (this.cajasDisponibles.length > 0) {
            this.basicForm.controls['idCaja'].setValue(this.cajasDisponibles[0].id);
            // Prellenar saldo anterior de la caja si existe
            if (this.cajasDisponibles[0].saldo !== undefined && this.cajasDisponibles[0].saldo !== null) {
              this.basicForm.controls['aMonto'].setValue(parseFloat(this.cajasDisponibles[0].saldo || 0).toFixed(2));
            }
          }

          if (this.usuariosDisponibles.length > 0) {
            const actual = this.usuariosDisponibles.find(u => u.id === this.usuarioActualId);
            if (actual) {
              this.basicForm.controls['idUsuario'].setValue(actual.id);
            } else {
              this.basicForm.controls['idUsuario'].setValue(this.usuariosDisponibles[0].id);
            }
          }

          this.actualizarCajaOrigenDefault();
        }
      },
      error: () => {
        this.cargandoCajas = false;
        this.snackBar.open('Error al cargar cajas disponibles y usuarios', 'Cerrar', { duration: 3000 });
      }
    });
  }

  getCajasOrigenFiltradas(): any[] {
    const idCajaDestino = this.basicForm?.controls['idCaja']?.value;
    return this.cajasOrigen.filter(c => c.id !== idCajaDestino);
  }

  actualizarCajaOrigenDefault(): void {
    const filtradas = this.getCajasOrigenFiltradas();
    if (filtradas.length === 0) {
      this.basicForm.controls['idCajaOrigen'].setValue(null);
      this.cajaOrigenSeleccionada = null;
      return;
    }

    const idCajaDestino = this.basicForm?.controls['idCaja']?.value;
    const cajaDestino = this.cajasDisponibles.find(c => c.id === idCajaDestino);
    const saldoRemanente = parseFloat(cajaDestino?.saldo || 0);

    // Si la caja ya tiene saldo remanente positivo del cierre anterior,
    // por defecto no debe transferir de caja principal (es saldo propio que ya quedó en la gaveta)
    if (saldoRemanente > 0) {
      this.basicForm.controls['idCajaOrigen'].setValue(null);
      this.cajaOrigenSeleccionada = null;
    } else {
      // Si la caja quedó en 0 (liquidada totalmente al cierre), se sugiere transferir el fondo desde Caja Principal
      const principal = filtradas.find(c => c.principal == 1) || filtradas[0];
      this.basicForm.controls['idCajaOrigen'].setValue(principal ? principal.id : null);
      this.cajaOrigenSeleccionada = principal || null;
    }
  }

  onCajaSelected(idCaja: number) {
    const seleccionada = this.cajasDisponibles.find(c => c.id === idCaja);
    if (seleccionada && seleccionada.saldo !== undefined && seleccionada.saldo !== null) {
      const saldo = parseFloat(seleccionada.saldo || 0);
      this.basicForm.controls['aMonto'].setValue(saldo > 0 ? saldo.toFixed(2) : '0.00');
    }
    this.actualizarCajaOrigenDefault();
  }

  onCajaOrigenSelected(id: any): void {
    if (id) {
      this.cajaOrigenSeleccionada = this.cajasOrigen.find(c => c.id === id) || null;
    } else {
      this.cajaOrigenSeleccionada = null;
    }
  }

  get montoInicialNumerico(): number {
    const raw = this.basicForm?.controls['aMonto']?.value;
    const val = parseFloat(String(raw !== null && raw !== undefined ? raw : 0).replace(',', '.'));
    return isNaN(val) || val < 0 ? 0 : val;
  }

  formatearAMonto(): void {
    const raw = this.basicForm.controls['aMonto'].value;
    const val = parseFloat(String(raw !== null && raw !== undefined ? raw : 0).replace(',', '.'));
    this.basicForm.controls['aMonto'].setValue((isNaN(val) || val < 0 ? 0 : val).toFixed(2));
  }

  save() {
    if (this.basicForm.invalid) {
      this.snackBar.open('Por favor complete los campos obligatorios', 'Aviso', { duration: 3000 });
      return;
    }

    const aMontoVal = parseFloat(String(this.basicForm.controls['aMonto'].value || 0).replace(',', '.'));
    const idCajaOrigenVal = this.montoInicialNumerico > 0 ? (this.basicForm.controls['idCajaOrigen'].value || null) : null;

    this.isButtonDisabled = true;
    const payload = {
      idCaja: this.basicForm.controls['idCaja'].value,
      idUsuario: this.basicForm.controls['idUsuario'].value,
      aMonto: Math.round((isNaN(aMontoVal) || aMontoVal < 0 ? 0 : aMontoVal) * 100) / 100,
      idCajaOrigen: idCajaOrigenVal
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
