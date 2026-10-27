import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MaterialModule } from '../../../material/material.module';
import { AlmacenService, ProductoAlmacen } from '../../../services/almacen.service';

export interface ParametrosDialogData {
  producto: ProductoAlmacen;
}

@Component({
  selector: 'app-almacen-producto-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    MatProgressBarModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './almacen-producto-dialog.component.html',
  styleUrl: './almacen-producto-dialog.component.css'
})
export class AlmacenProductoDialogComponent implements OnInit {
  productoForm!: UntypedFormGroup;
  cargando: boolean = false;
  producto: ProductoAlmacen;

  unidadesMedida: string[] = [
    'UNIDAD',
    'KG',
    'GRAMO',
    'LITRO',
    'MILILITRO',
    'BOTELLA',
    'LATA',
    'CAJA',
    'PAQUETE',
    'PORCION'
  ];

  constructor(
    private dialogRef: MatDialogRef<AlmacenProductoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ParametrosDialogData,
    private fb: UntypedFormBuilder,
    private almacenService: AlmacenService,
    private snackBar: MatSnackBar
  ) {
    this.producto = data.producto;
  }

  ngOnInit(): void {
    this.productoForm = this.fb.group({
      codigo: [this.producto.codigo || '', [Validators.required, Validators.maxLength(50)]],
      unidadMedida: [this.producto.unidadMedida || 'UNIDAD', [Validators.required]],
      stockMinimo: [this.producto.stockMinimo || 5, [Validators.required, Validators.min(0)]],
      costo: [this.producto.costo || 0, [Validators.required, Validators.min(0)]],
      ubicacion: [this.producto.ubicacion || 'Almacén Principal', [Validators.maxLength(100)]]
    });
  }

  guardar(): void {
    if (this.productoForm.invalid) {
      this.productoForm.markAllAsTouched();
      return;
    }

    this.cargando = true;
    this.almacenService.actualizarParametros(this.producto.idProducto, this.productoForm.value).subscribe({
      next: (res) => {
        this.cargando = false;
        this.snackBar.open(res.message || 'Parámetros actualizados correctamente.', 'Cerrar', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.cargando = false;
        const msg = err.error?.message || 'Error al actualizar parámetros.';
        this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
      }
    });
  }

  cerrar(): void {
    this.dialogRef.close(false);
  }
}
