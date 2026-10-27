import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MaterialModule } from '../../../material/material.module';
import { AlmacenItem, AlmacenService } from '../../../services/almacen.service';

@Component({
  selector: 'app-almacen-gestion-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    MatProgressBarModule,
    FormsModule,
    ReactiveFormsModule,
    DecimalPipe
  ],
  templateUrl: './almacen-gestion-dialog.component.html',
  styleUrl: './almacen-gestion-dialog.component.css'
})
export class AlmacenGestionDialogComponent implements OnInit {
  cargando: boolean = false;
  almacenes: AlmacenItem[] = [];
  mostrarFormulario: boolean = false;
  almacenForm!: UntypedFormGroup;
  editandoId: number | null = null;

  constructor(
    private dialogRef: MatDialogRef<AlmacenGestionDialogComponent>,
    private almacenService: AlmacenService,
    private fb: UntypedFormBuilder,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.iniciarFormulario();
    this.cargarAlmacenes();
  }

  iniciarFormulario(alm?: AlmacenItem): void {
    this.editandoId = alm ? alm.idAlmacen : null;
    this.almacenForm = this.fb.group({
      idAlmacen: [alm?.idAlmacen || null],
      nombre: [alm?.nombre || '', [Validators.required, Validators.maxLength(100)]],
      codigo: [alm?.codigo || '', [Validators.required, Validators.maxLength(20)]],
      responsable: [alm?.responsable || ''],
      ubicacion: [alm?.ubicacion || ''],
      descripcion: [alm?.descripcion || '']
    });
  }

  cargarAlmacenes(): void {
    this.cargando = true;
    this.almacenService.getAlmacenes().subscribe({
      next: (res) => {
        this.cargando = false;
        this.almacenes = res.data || [];
      },
      error: () => {
        this.cargando = false;
        this.snackBar.open('Error al cargar lista de almacenes', 'Cerrar', { duration: 3000 });
      }
    });
  }

  nuevoAlmacen(): void {
    this.iniciarFormulario();
    this.mostrarFormulario = true;
  }

  editarAlmacen(alm: AlmacenItem): void {
    this.iniciarFormulario(alm);
    this.mostrarFormulario = true;
  }

  cancelarFormulario(): void {
    this.mostrarFormulario = false;
    this.editandoId = null;
  }

  guardar(): void {
    if (this.almacenForm.invalid) {
      this.almacenForm.markAllAsTouched();
      return;
    }

    this.cargando = true;
    this.almacenService.guardarAlmacen(this.almacenForm.value).subscribe({
      next: (res) => {
        this.cargando = false;
        this.snackBar.open(res.message || 'Almacén guardado exitosamente.', 'Cerrar', { duration: 3000 });
        this.mostrarFormulario = false;
        this.cargarAlmacenes();
      },
      error: (err) => {
        this.cargando = false;
        const msg = err.error?.message || 'Error al guardar almacén';
        this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
      }
    });
  }

  cerrar(): void {
    this.dialogRef.close(true);
  }
}
