import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MaterialModule } from '../../../material/material.module';
import { CajaCatalogo, CajaMovimientoItem, CajaMovimientoService } from '../../../services/caja-movimiento.service';

export interface MovimientoCajaDialogData {
  tipoInicial?: 'I' | 'E';
  cajas: CajaCatalogo[];
  categoriasGastos: string[];
  categoriasIngresos: string[];
  movimiento?: CajaMovimientoItem;
}

@Component({
  selector: 'app-movimiento-caja-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    MatProgressBarModule,
    FormsModule,
    ReactiveFormsModule,
    DecimalPipe
  ],
  templateUrl: './movimiento-caja-dialog.component.html',
  styleUrl: './movimiento-caja-dialog.component.css'
})
export class MovimientoCajaDialogComponent implements OnInit {
  movimientoForm!: UntypedFormGroup;
  cargando: boolean = false;
  cajas: CajaCatalogo[] = [];
  cajaSeleccionada: CajaCatalogo | null = null;
  mostrarDetallesAvanzados: boolean = false;

  esEdicion: boolean = false;
  idMovimiento: number | null = null;
  movimientoOriginal: CajaMovimientoItem | null = null;

  categoriasGastos: string[] = [];
  categoriasIngresos: string[] = [];

  tiposComprobante: string[] = [
    'Factura',
    'Boleta',
    'Recibo por Honorarios',
    'Ticket de Venta',
    'Vale de Caja',
    'Guía de Remisión',
    'Sin Comprobante'
  ];

  mediosPago: { codigo: string; nombre: string }[] = [
    { codigo: 'EF', nombre: 'Efectivo' },
    { codigo: 'TJ', nombre: 'Tarjeta' },
    { codigo: 'TR', nombre: 'Transferencia Bancaria' },
    { codigo: 'YP', nombre: 'Yape' },
    { codigo: 'PL', nombre: 'Plin' }
  ];

  constructor(
    private dialogRef: MatDialogRef<MovimientoCajaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MovimientoCajaDialogData,
    private fb: UntypedFormBuilder,
    private cajaMovimientoService: CajaMovimientoService,
    private snackBar: MatSnackBar
  ) {
    this.cajas = data?.cajas || [];
    this.categoriasGastos = data?.categoriasGastos || [];
    this.categoriasIngresos = data?.categoriasIngresos || [];
  }

  ngOnInit(): void {
    const mov = this.data?.movimiento;
    this.movimientoOriginal = mov || null;
    this.esEdicion = !!mov;
    this.idMovimiento = mov ? mov.idCajaMovimiento : null;

    const tipo = mov ? mov.tipo : (this.data?.tipoInicial || 'E');
    const idCajaInicial = mov ? mov.idCaja : (this.cajas.length > 0 ? this.cajas[0].id : '');

    const hoy = new Date().toISOString().substring(0, 10);
    const fechaInicial = mov?.fecha ? mov.fecha.substring(0, 10) : hoy;

    this.movimientoForm = this.fb.group({
      tipo: [tipo, [Validators.required]],
      idCaja: [idCajaInicial, [Validators.required]],
      monto: [mov ? mov.monto : '', [Validators.required, Validators.min(0.01)]],
      categoria: [mov ? mov.categoria : (tipo === 'E' ? (this.categoriasGastos[0] || 'General') : (this.categoriasIngresos[0] || 'General')), [Validators.required]],
      beneficiario: [mov?.beneficiario || ''],
      tipoComprobante: [mov?.tipoComprobante || 'Sin Comprobante'],
      nroComprobante: [mov?.nroComprobante || ''],
      metodoPago: [mov?.metodoPago || 'EF', [Validators.required]],
      fecha: [fechaInicial, [Validators.required]],
      descripcion: [mov?.descripcion || '', [Validators.required, Validators.maxLength(255)]]
    });

    if (mov && (mov.beneficiario || (mov.tipoComprobante && mov.tipoComprobante !== 'Sin Comprobante') || mov.nroComprobante)) {
      this.mostrarDetallesAvanzados = true;
    }

    if (idCajaInicial) {
      this.actualizarCajaSeleccionada(idCajaInicial);
    }

    this.movimientoForm.get('idCaja')?.valueChanges.subscribe(id => {
      this.actualizarCajaSeleccionada(id);
    });

    this.movimientoForm.get('tipo')?.valueChanges.subscribe(t => {
      this.actualizarCategoriasPorTipo(t);
    });
  }

  actualizarCajaSeleccionada(id: any): void {
    this.cajaSeleccionada = this.cajas.find(c => c.id === Number(id)) || null;
  }

  actualizarCategoriasPorTipo(t: 'I' | 'E'): void {
    const defaultCat = t === 'E' ? (this.categoriasGastos[0] || 'General') : (this.categoriasIngresos[0] || 'General');
    this.movimientoForm.patchValue({
      categoria: defaultCat
    }, { emitEvent: false });
  }

  setTipo(t: 'I' | 'E'): void {
    this.movimientoForm.get('tipo')?.setValue(t);
  }

  setDescripcionRapida(desc: string): void {
    this.movimientoForm.get('descripcion')?.setValue(desc);
  }

  toggleDetallesAvanzados(): void {
    this.mostrarDetallesAvanzados = !this.mostrarDetallesAvanzados;
  }

  get tipoActual(): 'I' | 'E' {
    return this.movimientoForm?.get('tipo')?.value || 'E';
  }

  get categoriasActuales(): string[] {
    return this.tipoActual === 'E' ? this.categoriasGastos : this.categoriasIngresos;
  }

  get saldoActual(): number {
    return Number(this.cajaSeleccionada?.saldo || 0);
  }

  get montoIngresado(): number {
    return Number(this.movimientoForm?.get('monto')?.value || 0);
  }

  get saldoResultante(): number {
    const monto = this.montoIngresado;
    let base = this.saldoActual;

    // Si es edición y la caja es la misma del registro original, descontamos/sumamos el efecto original para proyectar el nuevo saldo
    if (this.esEdicion && this.movimientoOriginal && Number(this.movimientoForm?.get('idCaja')?.value) === this.movimientoOriginal.idCaja) {
      const montoAntiguo = Number(this.movimientoOriginal.monto || 0);
      if (this.movimientoOriginal.tipo === 'I') {
        base -= montoAntiguo;
      } else {
        base += montoAntiguo;
      }
    }

    if (this.tipoActual === 'I') {
      return base + monto;
    } else {
      return base - monto;
    }
  }

  guardar(): void {
    if (this.movimientoForm.invalid) {
      this.movimientoForm.markAllAsTouched();
      this.snackBar.open('Complete los campos requeridos correctamente.', 'Cerrar', { duration: 3000 });
      return;
    }

    const val = this.movimientoForm.value;
    this.cargando = true;

    if (this.esEdicion && this.idMovimiento) {
      this.cajaMovimientoService.actualizarMovimiento(this.idMovimiento, val).subscribe({
        next: (res) => {
          this.cargando = false;
          this.snackBar.open(res.message || 'Movimiento de caja actualizado exitosamente.', 'Cerrar', { duration: 3500 });
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.cargando = false;
          const msg = err.error?.message || 'Error al actualizar movimiento en caja';
          this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
        }
      });
    } else {
      this.cajaMovimientoService.registrarMovimiento(val).subscribe({
        next: (res) => {
          this.cargando = false;
          this.snackBar.open(res.message || 'Movimiento de caja registrado exitosamente.', 'Cerrar', { duration: 3500 });
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.cargando = false;
          const msg = err.error?.message || 'Error al registrar movimiento en caja';
          this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
        }
      });
    }
  }

  cerrar(): void {
    this.dialogRef.close(false);
  }
}
