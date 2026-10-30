import { Component, OnInit, ViewChild } from '@angular/core';
import { MaterialModule } from '../../material/material.module';
import { MatExpansionModule } from '@angular/material/expansion';
import { FormControl, ReactiveFormsModule, UntypedFormGroup } from '@angular/forms';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MesaDialogComponent } from './mesa-dialog/mesa-dialog.component';
import { MesaService } from '../../services/mesa.service';
import { Mesa } from '../../../model/mesa';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { AlertMsjComponent } from '../alert-msj/alert-msj.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-mesa', 
  standalone: true,
  imports: [MaterialModule,MatExpansionModule, ReactiveFormsModule, MatPaginatorModule,CommonModule,MatTooltipModule],
  templateUrl: './mesa.component.html',
  styleUrl: './mesa.component.css'
})
export class MesaComponent implements OnInit{
  isPanelOpen = true;
  basicForm: UntypedFormGroup;
  
  //table
  dataSource: MatTableDataSource<Mesa>;
  dataMovil:Mesa[] = [];
  paginatedItems = [];
  pageSize = 10;
  pageIndex = 0;
  displayedColumns: string[] = [
    '#',
    'nombre', 
    'descripcion', 
    'state', 
    'actions',
  ];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort:MatSort;

  constructor(
    private _dialog: MatDialog,
    private mesaService: MesaService,
    private _snackbar: MatSnackBar,
  ){}
  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'auto' });
    this.mesaService.findAllList().subscribe(data =>{
      this.createTable(data);
    })
    this.mesaService.getDataChange().subscribe((data)=>{
      this.createTable(data)
    })
      this.basicForm = new UntypedFormGroup({
            ValueSede: new FormControl(''),
            nombres: new FormControl(''),
            // ValueSitJuridica: new FormControl(''),
            // expediente: new FormControl(''),
            // fechaDesde: new FormControl(''),
            // fechaHasta: new FormControl(''),
            // afechaDesde: new FormControl(''),
            // afechaHasta: new FormControl('')
          });
  }

  openDialog(id?: number) {
    this._dialog.open(MesaDialogComponent, {
      data: id,
      disableClose: true,
      panelClass: 'modal-dialog-right',
    })
  } 

  btnBuscar(): void {
    this.mesaService.findAllList(this.basicForm.value).subscribe((data)=>{
      this.createTable(data);
    })
  }

  //======TABLA WEB Y MOVIL=====
  createTable(data: Mesa[]){
    this.dataSource = new MatTableDataSource(data);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort; 
    this.dataMovil = data; 
    this.updatePaginatedItems();
  }
  updatePaginatedItems(){
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedItems = this.dataMovil.slice(startIndex, endIndex);
  }
  onPageChange(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.updatePaginatedItems();
  }
  applyFilter(e: any){ 
    this.dataSource.filter = e.target.value.trim();
  } 
  applyFilterMov(e: any){ 
    this.dataSource.filter = e.target.value.trim();
    this.paginatedItems =this.dataSource['_renderData']['_value'];
  }
  getRowNumber(index: number): number {
    return (this.paginator.pageIndex * this.paginator.pageSize) + index + 1;
  }
  // FIN
  onClear(){
    this.basicForm.reset();
  }
  openHistorial(id?: number) {

  }

  deletDialog(idCategoria?: number){
    let dialogRef = this._dialog.open(AlertMsjComponent, {
      width: '300px',
      disableClose: true,
      data: { mensaje: '¿Está seguro de eliminar la Mesa?'}
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'yes') {
        console.log('Eliminando categoría con ID:', idCategoria);
        const datax = {
          id: idCategoria,
          estado: '0',
        }
        this.mesaService.deleteMesa(datax).subscribe(data => {
          if(data['code'] == 200){
            this._snackbar.open('Categoría eliminada correctamente ', 'Correcto!', {
              duration: 3000,
              panelClass: 'custom-snackbar'
            });
            this.mesaService.findAllList().subscribe(data =>{
              this.createTable(data);
            }) 
          }else{
            this._snackbar.open(data['message'], "Error!",{duration:6000,panelClass: 'custom-snackbar'});
          }
        }) 
      } 
    });
  }

  getRowClass(index: number): string {
    return index % 2 === 0 ? 'fila-par' : 'fila-impar';
  }


}
 