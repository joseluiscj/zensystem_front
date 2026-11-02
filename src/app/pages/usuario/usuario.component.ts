import { Component, OnInit, ViewChild } from '@angular/core';
import { MaterialModule } from '../../material/material.module';
import { MatExpansionModule } from '@angular/material/expansion';
import { CommonModule, NgFor } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, UntypedFormGroup } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import moment from 'moment';
import { MatSort } from '@angular/material/sort';
import { GlobalService } from '../../services/global.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UsuarioDialogComponent } from './usuario-dialog/usuario-dialog.component';
import { UserService } from '../../services/user.service';
import { User } from '../../../model/user';
import { AlertDialogComponent } from '../alert-dialog/alert-dialog.component';

@Component({
  selector: 'app-usuario',
  standalone: true,
  imports: [MaterialModule, MatExpansionModule, NgFor, ReactiveFormsModule, MatPaginatorModule, CommonModule, MatTooltipModule],
  templateUrl: './usuario.component.html',
  styleUrl: './usuario.component.css'
})
export class UsuarioComponent implements OnInit {
  displayedColumns: string[] = [
    '#',
    'nombres',
    'nroDocumento', 
    'rolNombre', 
    'active', 
    'actions',
  ];

  dataSource: MatTableDataSource<User>;
  dataMovil: User[] = [];
  paginatedItems: any[] = [];
  pageSize: number = 10;
  pageIndex: number = 0;
  valsearchtxt: string = "";
  verTodo: boolean = true;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private globalService: GlobalService,
    private _dialog: MatDialog,
    private _snackbar: MatSnackBar,
    private userService: UserService
  ){}

  ngOnInit(): void {
    this.verTodo = true;
    this.cargarUsuarios();

    this.userService.getUserChange().subscribe((data: User[]) => {
      this.createTable(data || []);
    });
  }

  cargarUsuarios(): void {
    this.userService.findAllList().subscribe({
      next: (data: User[]) => {
        this.createTable(data || []);
      },
      error: () => {
        this._snackbar.open('Error al cargar lista de usuarios', 'Cerrar', { duration: 3000 });
      }
    });
  }

  openDialog(id?: number): void {
    this._dialog.open(UsuarioDialogComponent, {
      data: id,
      width: '460px',
      disableClose: true,
      panelClass: 'modal-dialog-right',
    });
  }

  openAnular(id?: number): void {
    if (id === 1) {
      this._snackbar.open('No se puede anular al usuario principal root', 'Aviso', { duration: 3000 });
      return;
    }
    const dialogRef = this._dialog.open(AlertDialogComponent, {
      width: '320px',
      data: { mensaje: 'anular' }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'yes') {
        this.userService.anularU(id!).subscribe({
          next: (data) => {
            if (data['code'] == 200) {
              this._snackbar.open("Usuario anulado correctamente", "Correcto!", { duration: 3000, panelClass: 'custom-snackbar' });
              this.cargarUsuarios();
            } else {
              this._snackbar.open(data['message'] || 'Error al anular usuario', "Error!", { duration: 3500 });
            }
          },
          error: (err) => {
            this._snackbar.open(err.error?.message || 'Error al anular usuario', "Error!", { duration: 3500 });
          }
        });
      }
    });
  }
  
  activeDialog(id?: number): void {
    const dialogRef = this._dialog.open(AlertDialogComponent, {
      width: '320px',
      data: { mensaje: 'activar' }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'yes') {
        this.userService.activeU(id!).subscribe({
          next: (data) => {
            if (data['code'] == 200) {
              this._snackbar.open("Usuario activado correctamente", "Correcto!", { duration: 3000, panelClass: 'custom-snackbar' });
              this.cargarUsuarios();
            } else {
              this._snackbar.open(data['message'] || 'Error al activar usuario', "Error!", { duration: 3500 });
            }
          },
          error: (err) => {
            this._snackbar.open(err.error?.message || 'Error al activar usuario', "Error!", { duration: 3500 });
          }
        });
      }
    });
  }

  deletDialog(id?: number): void {
    if (id === 1) {
      this._snackbar.open('No se puede eliminar al usuario principal root', 'Aviso', { duration: 3000 });
      return;
    }
    const dialogRef = this._dialog.open(AlertDialogComponent, {
      width: '320px',
      data: { mensaje: 'eliminar' }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'yes') {
        this.userService.deleteU(id!).subscribe({
          next: (data) => {
            if (data['code'] == 200) {
              this._snackbar.open("Usuario eliminado correctamente", "Correcto!", { duration: 3000, panelClass: 'custom-snackbar' });
              this.cargarUsuarios();
            } else {
              this._snackbar.open(data['message'] || 'Error al eliminar usuario', "Error!", { duration: 3500 });
            }
          },
          error: (err) => {
            this._snackbar.open(err.error?.message || 'Error al eliminar usuario', "Error!", { duration: 3500 });
          }
        });
      }
    });
  }

  createTable(data: User[]): void {
    this.dataSource = new MatTableDataSource(data);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort; 
    this.dataMovil = data; 
    this.updatePaginatedItems();
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

  applyFilter(e: any): void { 
    this.dataSource.filter = e.target.value.trim().toLowerCase();
  } 

  applyFilterMov(e: any): void { 
    this.dataSource.filter = e.target.value.trim().toLowerCase();
    this.paginatedItems = this.dataSource['_renderData']['_value'];
  }

  getRowNumber(index: number): number {
    return (this.paginator ? (this.paginator.pageIndex * this.paginator.pageSize) : 0) + index + 1;
  }
}
