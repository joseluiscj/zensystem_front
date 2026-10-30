import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule, UntypedFormGroup } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MaterialModule } from '../../material/material.module';
import { MatTableDataSource } from '@angular/material/table';
import { Caja } from '../../../model/caja';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { CategoriaService } from '../../services/categoria.service';
import { DomSanitizer } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AlertMsjComponent } from '../alert-msj/alert-msj.component';
import { CajaService } from '../../services/caja.service';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import { CajaDialogComponent } from './caja-dialog/caja-dialog.component';

@Component({
  selector: 'app-caja',
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
  templateUrl: './caja.component.html',
  styleUrl: './caja.component.css'
})
export class CajaComponent {
  isPanelOpen = true;
  basicForm: UntypedFormGroup;
  cargaContenido:boolean=true;
  //table
  dataSource: MatTableDataSource<Caja>;
  dataMovil:Caja[] = [];
  paginatedItems = [];
  pageSize = 10;
  pageIndex = 0;
  displayedColumns: string[] = [
    '#',
    'sucursal', 
    'nombre', 
    'tipoCaja', 
    'saldo', 
    // 'state', 
    'actions',
  ];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort:MatSort;

  constructor(
    private _dialog: MatDialog,
    private cajaService:CajaService,
    private sanitizer: DomSanitizer,
    private _snackbar: MatSnackBar,
  ){}

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'auto' });
    this.cajaService.findAllList().subscribe(data =>{
      this.createTable(data);
    }) 
    this.cajaService.getDataChange().subscribe((data)=>{
      this.createTable(data)
    })
    this.basicForm = new UntypedFormGroup({
      ValueSede: new FormControl(''),
      nombres: new FormControl(''), 
    });
  }
  openDialog(id?: number) { 
    this._dialog.open(CajaDialogComponent, {
      data: id,
      disableClose: true,
      panelClass: 'modal-dialog-right',
    })
  }
  btnBuscar(): void {
    // const formValues = this.basicForm.value; 
    this.cajaService.findAllList(this.basicForm.value).subscribe((data)=>{
      this.createTable(data);
    })
  }

  //======TABLA WEB Y MOVIL=====
  createTable(data: Caja[]){
    this.dataSource = new MatTableDataSource(data);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort; 
    this.dataMovil = data; 
    this.cargaContenido=false;
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
  deletDialog(idCaja?: number){
    let dialogRef = this._dialog.open(AlertMsjComponent, {
      width: '300px',
      disableClose: true,
      data: { mensaje: '¿Está seguro de eliminar la caja?'}
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'yes' && idCaja) {
        this.cajaService.deleteCaja(idCaja).subscribe(data => {
          if(data['code'] == 200){
            this._snackbar.open('Caja eliminada correctamente', 'Correcto!', {
              duration: 3000,
              panelClass: 'custom-snackbar'
            });
            this.cajaService.findAllList().subscribe(data =>{
              this.createTable(data);
            });
          }else{
            this._snackbar.open(data['message'] || 'Error al eliminar caja', "Error!", {duration:6000,panelClass: 'custom-snackbar'});
          }
        });
      } 
    });
  }
  //////////////////////
  getRowClass(index: number): string {
    return index % 2 === 0 ? 'fila-par' : 'fila-impar';
  }

  
}
 