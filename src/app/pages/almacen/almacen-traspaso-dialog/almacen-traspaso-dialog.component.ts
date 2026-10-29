import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MaterialModule } from '../../../material/material.module';
import { AlmacenService, ProductoAlmacen } from '../../../services/almacen.service';

export interface TraspasoDialogData {
  producto?: ProductoAlmacen;
  productosList: ProductoAlmacen[];
  almacenes: any[];
}

@Component({
  selector: 'app-almacen-traspaso-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    MatProgressBarModule,
    FormsModule,
    ReactiveFormsModule,
    DecimalPipe
  ],
  templateUrl: './almacen-traspaso-dialog.component.html',
  styleUrl: './almacen-traspaso-dialog.component.css'
})
export class AlmacenTraspasoDialogComponent implements OnInit {
  traspasoForm!: UntypedFormGroup;
  cargando: boolean = false;
  productoSeleccionado: ProductoAlmacen | null = null;
  productos: ProductoAlmacen[] = [];
  almacenes: any[] = [];

  motivosTraspaso: string[] = [
    'Abastecimiento de Barra / Salón',
    'Reposición para Cocina',
    'Transferencia por solicitud de turno',
    'Reubicación de mercadería',
    'Traspaso operativo directo'
  ];

  constructor(
    private dialogRef: MatDialogRef<AlmacenTraspasoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TraspasoDialogData,
    private fb: UntypedFormBuilder,
    private almacenService: AlmacenService,
    private snackBar: MatSnackBar
  ) {
    this.productos = (data?.productosList || []).filter(p => p.controlStock === undefined || p.controlStock == 1 || p.controlStock === true);
    this.almacenes = data?.almacenes || [];
    this.productoSeleccionado = data?.producto || (this.productos.length > 0 ? this.productos[0] : null);
  }

  ngOnInit(): void {
    const prodId = this.productoSeleccionado ? this.productoSeleccionado.idProducto : '';
    const almOrigen = this.almacenes.length > 0 ? this.almacenes[0].id : 1;
    const almDestino = this.almacenes.length > 1 ? this.almacenes[1].id : (this.almacenes.length > 0 ? this.almacenes[0].id : 2);

    this.traspasoForm = this.fb.group({
      idProducto: [prodId, [Validators.required]],
      idAlmacenOrigen: [almOrigen, [Validators.required]],
      idAlmacenDestino: [almDestino, [Validators.required]],
      cantidad: [1, [Validators.required, Validators.min(0.01)]],
      motivo: [this.motivosTraspaso[0], [Validators.required]],
      observacion: ['']
    });

    this.traspasoForm.get('idProducto')?.valueChanges.subscribe(id => {
      this.productoSeleccionado = this.productos.find(p => p.idProducto === Number(id)) || null;
    });
  }

  get stockEnOrigen(): number {
    if (!this.productoSeleccionado || !this.productoSeleccionado.stocks_almacenes) return 0;
    const idOrigen = Number(this.traspasoForm?.get('idAlmacenOrigen')?.value);
    const item = this.productoSeleccionado.stocks_almacenes.find(s => s.idAlmacen === idOrigen);
    return item ? Number(item.stock) : 0;
  }

  get stockEnDestino(): number {
    if (!this.productoSeleccionado || !this.productoSeleccionado.stocks_almacenes) return 0;
    const idDestino = Number(this.traspasoForm?.get('idAlmacenDestino')?.value);
    const item = this.productoSeleccionado.stocks_almacenes.find(s => s.idAlmacen === idDestino);
    return item ? Number(item.stock) : 0;
  }

  get cantidadTraspaso(): number {
    return Number(this.traspasoForm?.get('cantidad')?.value || 0);
  }

  get stockOrigenResultante(): number {
    return Math.max(0, this.stockEnOrigen - this.cantidadTraspaso);
  }

  get stockDestinoResultante(): number {
    return this.stockEnDestino + this.cantidadTraspaso;
  }

  guardar(): void {
    if (this.traspasoForm.invalid) {
      this.traspasoForm.markAllAsTouched();
      this.snackBar.open('Complete los datos correctamente.', 'Cerrar', { duration: 3000 });
      return;
    }

    const val = this.traspasoForm.value;
    if (val.idAlmacenOrigen === val.idAlmacenDestino) {
      this.snackBar.open('El almacén de origen y destino deben ser distintos.', 'Cerrar', { duration: 3500 });
      return;
    }

    if (val.cantidad > this.stockEnOrigen) {
      this.snackBar.open(`Stock insuficiente en el almacén de origen. Disponible: ${this.stockEnOrigen}`, 'Cerrar', { duration: 4000 });
      return;
    }

    this.cargando = true;
    this.almacenService.realizarTraspaso(val).subscribe({
      next: (res) => {
        this.cargando = false;
        this.snackBar.open(res.message || 'Traspaso realizado con éxito.', 'Cerrar', { duration: 3500 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.cargando = false;
        const msg = err.error?.message || 'Error al procesar el traspaso entre almacenes';
        this.snackBar.open(msg, 'Cerrar', { duration: 4500 });
      }
    });
  }

  cerrar(): void {
    this.dialogRef.close(false);
  }
}
