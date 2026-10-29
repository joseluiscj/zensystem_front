import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MaterialModule } from '../../../material/material.module';
import { AlmacenService, ProductoAlmacen } from '../../../services/almacen.service';

export interface MovimientoDialogData {
  producto?: ProductoAlmacen;
  productosList?: ProductoAlmacen[];
  tipoInicial?: 'E' | 'S' | 'A';
  almacenes?: any[];
}

@Component({
  selector: 'app-almacen-movimiento-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    MatProgressBarModule,
    FormsModule,
    ReactiveFormsModule,
    DecimalPipe
  ],
  templateUrl: './almacen-movimiento-dialog.component.html',
  styleUrl: './almacen-movimiento-dialog.component.css'
})
export class AlmacenMovimientoDialogComponent implements OnInit {
  movimientoForm!: UntypedFormGroup;
  cargando: boolean = false;
  productoSeleccionado: ProductoAlmacen | null = null;
  productos: ProductoAlmacen[] = [];
  almacenes: any[] = [];

  motivosPredefinidos: { [key: string]: string[] } = {
    'E': [
      'Compra a proveedor',
      'Ingreso por devolución de cliente',
      'Ingreso por traspaso de almacén',
      'Donación / Bonificación recibida',
      'Otro ingreso'
    ],
    'S': [
      'Consumo interno / Cocina / Bar',
      'Merma por vencimiento o daño',
      'Pérdida / Rotura',
      'Salida por devolución al proveedor',
      'Traspaso a otra sucursal',
      'Otra salida'
    ],
    'A': [
      'Ajuste por inventario físico mensual',
      'Corrección por conteo inicial',
      'Regularización de diferencia de stock',
      'Otro ajuste'
    ]
  };

  constructor(
    private dialogRef: MatDialogRef<AlmacenMovimientoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MovimientoDialogData,
    private fb: UntypedFormBuilder,
    private almacenService: AlmacenService,
    private snackBar: MatSnackBar
  ) {
    this.productos = (data?.productosList || []).filter(p => p.controlStock === undefined || p.controlStock == 1 || p.controlStock === true);
    this.almacenes = data?.almacenes || [];
    if (data?.producto) {
      this.productoSeleccionado = data.producto;
    }
  }

  ngOnInit(): void {
    const tipo = this.data?.tipoInicial || 'E';
    const prodId = this.productoSeleccionado?.idProducto || (this.productos.length > 0 ? this.productos[0].idProducto : '');
    const idAlmInicial = this.almacenes.length > 0 ? this.almacenes[0].id : 1;

    this.movimientoForm = this.fb.group({
      idAlmacen: [idAlmInicial, [Validators.required]],
      idProducto: [prodId, [Validators.required]],
      tipo: [tipo, [Validators.required]],
      cantidad: [1, [Validators.required, Validators.min(0.01)]],
      costoUnitario: [this.productoSeleccionado ? this.productoSeleccionado.costo : 0, [Validators.min(0)]],
      motivo: [this.motivosPredefinidos[tipo][0] || '', [Validators.required]],
      documento: [''],
      observacion: ['']
    });

    if (!this.productoSeleccionado && prodId) {
      this.onProductoChange(prodId);
    }

    this.movimientoForm.get('idProducto')?.valueChanges.subscribe(id => {
      this.onProductoChange(id);
    });

    this.movimientoForm.get('tipo')?.valueChanges.subscribe(t => {
      this.onTipoChange(t);
    });
  }

  onProductoChange(id: any): void {
    const found = this.productos.find(p => p.idProducto === Number(id));
    if (found) {
      this.productoSeleccionado = found;
      this.movimientoForm.patchValue({
        costoUnitario: found.costo
      }, { emitEvent: false });
    }
  }

  onTipoChange(t: string): void {
    const lista = this.motivosPredefinidos[t] || [];
    this.movimientoForm.patchValue({
      motivo: lista.length > 0 ? lista[0] : ''
    }, { emitEvent: false });
  }

  setTipo(t: 'E' | 'S' | 'A'): void {
    this.movimientoForm.get('tipo')?.setValue(t);
  }

  get tipoActual(): 'E' | 'S' | 'A' {
    return this.movimientoForm?.get('tipo')?.value || 'E';
  }

  get stockAnterior(): number {
    if (!this.productoSeleccionado) return 0;
    const idAlm = Number(this.movimientoForm?.get('idAlmacen')?.value);
    if (this.productoSeleccionado.stocks_almacenes) {
      const almStock = this.productoSeleccionado.stocks_almacenes.find(s => s.idAlmacen === idAlm);
      if (almStock) return Number(almStock.stock);
    }
    return Number(this.productoSeleccionado.stock || 0);
  }

  get cantidadIngresada(): number {
    return Number(this.movimientoForm?.get('cantidad')?.value || 0);
  }

  get stockProyectado(): number {
    const cant = this.cantidadIngresada;
    const ant = this.stockAnterior;
    if (this.tipoActual === 'E') {
      return ant + cant;
    } else if (this.tipoActual === 'S') {
      return Math.max(0, ant - cant);
    } else {
      return cant;
    }
  }

  guardar(): void {
    if (this.movimientoForm.invalid) {
      this.movimientoForm.markAllAsTouched();
      this.snackBar.open('Complete los campos requeridos correctamente.', 'Cerrar', { duration: 3000 });
      return;
    }

    const val = this.movimientoForm.value;

    if (val.tipo === 'S' && val.cantidad > this.stockAnterior) {
      this.snackBar.open(`Stock insuficiente en el almacén seleccionado. Stock actual: ${this.stockAnterior}`, 'Cerrar', { duration: 4000 });
      return;
    }

    this.cargando = true;
    this.almacenService.registrarMovimiento(val).subscribe({
      next: (res) => {
        this.cargando = false;
        this.snackBar.open(res.message || 'Movimiento registrado con éxito.', 'Cerrar', { duration: 3500 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.cargando = false;
        const msg = err.error?.message || 'Error al registrar movimiento en almacén';
        this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
      }
    });
  }

  cerrar(): void {
    this.dialogRef.close(false);
  }
}
