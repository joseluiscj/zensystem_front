import { Component, OnInit, ViewChild } from '@angular/core';
import { MaterialModule } from '../../material/material.module';
import { MatExpansionModule } from '@angular/material/expansion';
import { FormControl, ReactiveFormsModule, UntypedFormGroup } from '@angular/forms';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { CategoriaDialogComponent } from './categoria-dialog/categoria-dialog.component';
import { CategoriaService } from '../../services/categoria.service';
import { Categoria } from '../../../model/categoria';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AlertMsjComponent } from '../alert-msj/alert-msj.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({   
  selector: 'app-categoria', 
  standalone: true,
  imports: [ 
    MaterialModule,
    MatExpansionModule, 
    ReactiveFormsModule, 
    MatPaginatorModule,
    CommonModule,
    MatTooltipModule
  ],
  templateUrl: './categoria.component.html',
  styleUrl: './categoria.component.css'
})
export class CategoriaComponent implements OnInit {
  isPanelOpen = true;
  basicForm: UntypedFormGroup;

  //table
  dataSource: MatTableDataSource<Categoria>;
  dataMovil:Categoria[] = [];
  paginatedItems = [];
  pageSize = 10;
  pageIndex = 0;
  displayedColumns: string[] = [
    '#',
    'nombre', 
    // 'tipo', 
    'actions',
  ];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort:MatSort;
  constructor(
    private _dialog: MatDialog,
    private categoriaService:CategoriaService,
    private sanitizer: DomSanitizer,
    private _snackbar: MatSnackBar,
  ){}

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'auto' });
    this.categoriaService.findAllList().subscribe(data =>{
      this.createTable(data);
    }) 
    this.categoriaService.getDataChange().subscribe((data)=>{
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
    this._dialog.open(CategoriaDialogComponent, {
      data: id,
      disableClose: true,
      panelClass: 'modal-dialog-right',
    })
  }
  btnBuscar(): void {
    const formValues = this.basicForm.value; 
    this.categoriaService.findAllList(this.basicForm.value).subscribe((data)=>{
      this.createTable(data);
    })
  }

  //======TABLA WEB Y MOVIL=====
  createTable(data: Categoria[]){
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
      data: { mensaje: '¿Está seguro de eliminar la categoría?'}
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'yes') {
        const datax = {
          id: idCategoria,
          estado: '0',
        }
        this.categoriaService.deleteCategoria(datax).subscribe(data => {
          if(data['code'] == 200){
            this._snackbar.open('Categoría eliminada correctamente ', 'Correcto!', {
              duration: 3000,
              panelClass: 'custom-snackbar'
            });
            this.categoriaService.findAllList().subscribe(data =>{
              this.createTable(data);
            }) 
          }else{
            this._snackbar.open(data['message'], "Error!",{duration:6000,panelClass: 'custom-snackbar'});
          }
        }) 
      } 
    });
  }
  //////////////////////
  getRowClass(index: number): string {
    return index % 2 === 0 ? 'fila-par' : 'fila-impar';
  }
}
