import { Component, Inject, OnInit } from '@angular/core';
import { MaterialModule } from '../../../material/material.module';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe, NgFor, NgIf } from '@angular/common';
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
    DecimalPipe,
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
  filtroTipo: 'TODOS' | 'I' | 'E' = 'TODOS';
  searchTerm: string = '';
  esPantallaCompleta: boolean = false;
  expandirTodos: boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { idCajaDetalle: number, cajaNombre: string, state: number },
    private dialogRef: MatDialogRef<MovimientoDialogComponent>,
    private aperturaService: AperturaCajaService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'auto' });
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

  esMovimientoCierre(m: CajaMovimiento): boolean {
    const origen = (m.origen || '').toUpperCase();
    if (origen === 'CIERRE') return true;
    const nro = (m.nroComprobante || '').toUpperCase();
    if (nro.includes('TRANSF-CIERRE')) return true;
    const desc = (m.descripcion || '').toLowerCase();
    if (desc.includes('por cierre') || (desc.includes('transferencia') && desc.includes('cierre'))) return true;
    return false;
  }

  get totalIngresos(): number {
    return this.movimientos
      .filter(m => m.tipo === 'I' && !this.esMovimientoCierre(m))
      .reduce((sum, m) => sum + Number(m.monto || 0), 0);
  }

  get totalEgresos(): number {
    return this.movimientos
      .filter(m => m.tipo === 'E' && !this.esMovimientoCierre(m))
      .reduce((sum, m) => sum + Number(m.monto || 0), 0);
  }

  get balanceNeto(): number {
    return this.totalIngresos - this.totalEgresos;
  }

  get conteoIngresos(): number {
    return this.movimientos.filter(m => m.tipo === 'I' && !this.esMovimientoCierre(m)).length;
  }

  get conteoEgresos(): number {
    return this.movimientos.filter(m => m.tipo === 'E' && !this.esMovimientoCierre(m)).length;
  }

  get totalTransferidoCierre(): number {
    return this.movimientos
      .filter(m => this.esMovimientoCierre(m))
      .reduce((sum, m) => sum + Number(m.monto || 0), 0);
  }

  get conteoTransferenciasCierre(): number {
    return this.movimientos.filter(m => this.esMovimientoCierre(m)).length;
  }

  get movimientosFiltrados(): CajaMovimiento[] {
    let list = this.movimientos;
    if (this.filtroTipo === 'I') {
      list = list.filter(m => m.tipo === 'I');
    } else if (this.filtroTipo === 'E') {
      list = list.filter(m => m.tipo === 'E');
    }

    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const q = this.searchTerm.toLowerCase().trim();
      list = list.filter(m => 
        (m.descripcion && m.descripcion.toLowerCase().includes(q)) ||
        (m.categoria && m.categoria.toLowerCase().includes(q)) ||
        (m.beneficiario && m.beneficiario.toLowerCase().includes(q)) ||
        (m.tipoComprobante && m.tipoComprobante.toLowerCase().includes(q)) ||
        (m.nroComprobante && m.nroComprobante.toLowerCase().includes(q)) ||
        (m.usuarioNombre && m.usuarioNombre.toLowerCase().includes(q)) ||
        (m.monto && String(m.monto).includes(q))
      );
    }

    return list;
  }

  togglePantallaCompleta(): void {
    this.esPantallaCompleta = !this.esPantallaCompleta;
    if (this.esPantallaCompleta) {
      this.dialogRef.updateSize('100vw', '100vh');
      this.dialogRef.addPanelClass('modal-dialog-fullscreen');
    } else {
      this.dialogRef.updateSize('1150px', '94vh');
      this.dialogRef.removePanelClass('modal-dialog-fullscreen');
    }
  }

  toggleDetalle(m: CajaMovimiento): void {
    m.expandido = !m.expandido;
  }

  toggleExpandirTodos(): void {
    this.expandirTodos = !this.expandirTodos;
    this.movimientos.forEach(m => m.expandido = this.expandirTodos);
  }

  setTipoMovimiento(tipo: 'I' | 'E'): void {
    this.movimientoForm.controls['tipo'].setValue(tipo);
  }

  setDescripcionRapida(desc: string): void {
    this.movimientoForm.controls['descripcion'].setValue(desc);
  }

  cargarMovimientos() {
    this.cargando = true;
    this.aperturaService.getMovimientos(this.data.idCajaDetalle).subscribe({
      next: (res) => {
        this.cargando = false;
        if (res.code === 200) {
          this.movimientos = res.data || [];
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

  formatearMonto(): void {
    const raw = this.movimientoForm.controls['monto'].value;
    if (raw !== null && raw !== undefined && String(raw).trim() !== '') {
      const val = parseFloat(String(raw).replace(',', '.'));
      if (!isNaN(val) && val >= 0) {
        this.movimientoForm.controls['monto'].setValue(val.toFixed(2));
      }
    }
  }

  guardarMovimiento() {
    if (this.movimientoForm.invalid) {
      this.snackBar.open('Complete los datos del movimiento', 'Aviso', { duration: 3000 });
      return;
    }

    const montoVal = parseFloat(String(this.movimientoForm.controls['monto'].value || 0).replace(',', '.'));
    this.isSaving = true;
    const payload = {
      idCajaDetalle: this.data.idCajaDetalle,
      tipo: this.movimientoForm.controls['tipo'].value,
      monto: Math.round((isNaN(montoVal) || montoVal < 0 ? 0 : montoVal) * 100) / 100,
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
