import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule, UntypedFormGroup } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MaterialModule } from '../../material/material.module';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AperturaCajaService } from '../../services/apertura-caja.service';
import { CajaDetalle } from '../../../model/cajaDetalle';
import { AperturaDialogComponent } from './apertura-dialog/apertura-dialog.component';
import { CierreDialogComponent } from './cierre-dialog/cierre-dialog.component';
import { MovimientoDialogComponent } from './movimiento-dialog/movimiento-dialog.component';

@Component({
  selector: 'app-apertura-caja',
  standalone: true,
  imports: [
    MaterialModule,
    MatExpansionModule,
    ReactiveFormsModule,
    MatPaginatorModule,
    CommonModule,
    MatTooltipModule,
    MatProgressBarModule
  ],
  templateUrl: './apertura-caja.component.html',
  styleUrl: './apertura-caja.component.css'
})
export class AperturaCajaComponent implements OnInit {
  isPanelOpen = true;
  basicForm: UntypedFormGroup;
  cargaContenido: boolean = true;

  dataSource: MatTableDataSource<CajaDetalle>;
  dataMovil: CajaDetalle[] = [];
  paginatedItems: CajaDetalle[] = [];
  pageSize = 10;
  pageIndex = 0;

  totalSesiones: number = 0;
  cajasAbiertas: number = 0;
  cajasCerradas: number = 0;

  displayedColumns: string[] = [
    '#',
    'cajaNombre',
    'usuarioNombre',
    'aFecha',
    'aMonto',
    'cFecha',
    'cMonto',
    'state',
    'actions',
  ];

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private dialog: MatDialog,
    private aperturaService: AperturaCajaService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.basicForm = new UntypedFormGroup({
      caja: new FormControl(''),
      state: new FormControl(''),
      fechaDesde: new FormControl(''),
      fechaHasta: new FormControl(''),
    });

    this.cargarDatos();

    this.aperturaService.getDataChange().subscribe((data) => {
      this.createTable(data);
    });
  }

  cargarDatos(): void {
    this.cargaContenido = true;
    this.aperturaService.list(this.basicForm.value).subscribe({
      next: (data) => {
        this.createTable(data);
      },
      error: () => {
        this.cargaContenido = false;
        this.snackBar.open('Error al cargar aperturas de caja', 'Cerrar', { duration: 3000 });
      }
    });
  }

  btnBuscar(): void {
    this.cargarDatos();
  }

  onClear(): void {
    this.basicForm.reset({
      caja: '',
      state: '',
      fechaDesde: '',
      fechaHasta: ''
    });
    this.cargarDatos();
  }

  createTable(data: CajaDetalle[]): void {
    this.dataSource = new MatTableDataSource(data);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataMovil = data;
    this.cargaContenido = false;
    this.calcularTotales(data);
    this.updatePaginatedItems();
  }

  calcularTotales(data: CajaDetalle[]): void {
    this.totalSesiones = data.length;
    this.cajasAbiertas = data.filter(d => d.state === 1).length;
    this.cajasCerradas = data.filter(d => d.state === 0).length;
  }

  openAperturarDialog(): void {
    const dialogRef = this.dialog.open(AperturaDialogComponent, {
      width: '450px',
      disableClose: true,
      // panelClass: 'modal-dialog-responsive'
      panelClass: 'modal-dialog-right',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'success') {
        this.cargarDatos();
      }
    });
  }

  openCerrarDialog(item: CajaDetalle): void {
    const dialogRef = this.dialog.open(CierreDialogComponent, {
      disableClose: true,
      data: { 
        idCajaDetalle: item.id || item.idCajaDetalle,
        cajaNombre: item.cajaNombre,
        aMonto: item.aMonto
      },
      panelClass: 'modal-dialog-right'
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'success') {
        this.cargarDatos();
      }
    });
  }

  openMovimientosDialog(item: CajaDetalle): void {
    this.dialog.open(MovimientoDialogComponent, {
      width: '600px',
      disableClose: false,
      data: {
        idCajaDetalle: item.id || item.idCajaDetalle,
        cajaNombre: item.cajaNombre,
        state: item.state
      },
      // panelClass: 'modal-dialog-responsive'
      panelClass: 'modal-dialog-right',
    });
  }

  updatePaginatedItems(): void {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedItems = this.dataMovil.slice(startIndex, endIndex);
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.updatePaginatedItems();
  }

  getRowNumber(index: number): number {
    if (!this.paginator) return index + 1;
    return (this.paginator.pageIndex * this.paginator.pageSize) + index + 1;
  }

  getRowClass(index: number): string {
    return index % 2 === 0 ? 'fila-par' : 'fila-impar';
  }
}
