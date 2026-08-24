import { Component, Inject, OnInit } from '@angular/core';
import { MaterialModule } from '../../../material/material.module';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { map, Observable, startWith } from 'rxjs';
import { Tipo } from '../../../../model/tipo';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { GlobalService } from '../../../services/global.service';
import { Categoria } from '../../../../model/categoria';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CategoriaService } from '../../../services/categoria.service';
import { MatSelectChange } from '@angular/material/select';
import { TipoDialogComponent } from './tipo-dialog/tipo-dialog.component';

@Component({
  selector: 'app-categoria-dialog',
  standalone: true,
  imports: [MaterialModule,NgFor, NgIf,ReactiveFormsModule,FormsModule,CommonModule],
  templateUrl: './categoria-dialog.component.html',
  styleUrl: './categoria-dialog.component.css'
})
export class CategoriaDialogComponent implements OnInit {
  basicForm: UntypedFormGroup;
  ocultar: boolean = false;
  isButtonDisabled:boolean=false;
  categoria:Categoria;
  error:boolean=false;
  
  ocultarAdd:string = "";
  ocultarUpdate:string = "d-none";
  ocultarDelete:string = "d-none";
  //tipo
  // ValueTipo = new FormControl();
  // filterTipo = new FormControl();
  // filteredTipo: Observable<any[]>;
  // lst_tipo: Tipo[];
  //

  constructor(
    @Inject(MAT_DIALOG_DATA) private idCategoriaSelected:number,
    private _dialogRef: MatDialogRef<CategoriaDialogComponent>,
    private globalService: GlobalService,
    private _snackbar: MatSnackBar,
    private categoriaService: CategoriaService,
    private _dialog:MatDialog
  ){}

  ngOnInit(): void {
    this.initialFrm();
    // this.getTipo();

    if(this.idCategoriaSelected){
      this.ocultarUpdate = "";
      this.ocultarDelete = "";
      this.ocultar=true;
      this.categoriaService.findById(this.idCategoriaSelected).subscribe(data => {
        this.ocultar=false;
        if(data['code'] == 200){
          this.categoria = data['data']
          // this.ValueTipo.setValue(this.categoria.f_tipo); 
          this.initialFrm()  
        }else{
          this._snackbar.open(data['message'], "Error!",{duration:3000,panelClass: 'custom-snackbar'});
        }
      })
    }
  }
  // getTipo(){
  //   this.globalService.getCboDialog().subscribe((data)=>{ 
  //     this.lst_tipo = data.tipo; 
  //     this.filteredTipo = this.filterTipo.valueChanges.pipe(
  //       startWith(''),
  //       map(value => this._filterTipo(value))
  //     );
  //   })
  // }
  // private _filterTipo(value: string): any[] {
  //   const filterValue = value.toLowerCase();
  //   return this.lst_tipo.filter(option => option.nombre.toLowerCase().includes(filterValue));
  // }
  private initialFrm(){
    this.basicForm = new UntypedFormGroup({
      id: new UntypedFormControl(this.categoria?.id),
      nombre: new UntypedFormControl(this.categoria?.f_nombre,[Validators.required]),
    })
  }

  save() {
    if(!this.validateFrm()){
      this.isButtonDisabled = true;
      const ObjC = new Categoria();
      ObjC.id = this.idCategoriaSelected
      ObjC.f_nombre = this.basicForm.controls["nombre"].value;
      // ObjC.f_tipo = this.ValueTipo.value;
      if(!ObjC.id){ //create
        this.categoriaService.save(ObjC).subscribe((data)=>{
          this.isButtonDisabled = false;
          if(data['code'] == 200){     
            this._snackbar.open("Datos registrados correctamente", "Correcto!",{duration:3000,panelClass: 'custom-snackbar'});
            this.categoriaService.findAll().subscribe((data)=>{
              this.categoriaService.setDataChange(data);
              this.close();
            })
          }else{
            this._snackbar.open(data['message'], "Error!",{duration:3000,panelClass: 'custom-snackbar'});
          }
        })
      }else{ //update
        this.categoriaService.update(ObjC.id, ObjC).subscribe(data => {
          this.isButtonDisabled = false;
          if(data['code'] == 200){
            this._snackbar.open("Datos actualizados correctamente", "Correcto!",{duration:3000,panelClass: 'custom-snackbar'});
            this.categoriaService.findAll().subscribe((data)=>{
              this.categoriaService.setDataChange(data);
              this.close();
            })
          }else{
            this._snackbar.open(data['message'], "Error!",{duration:3000,panelClass: 'custom-snackbar'});
          }
        })
      }
    }
  }

  validateFrm() :boolean{
    this.error = false;
    if((this.basicForm.controls["nombre"].value)?.trim() == "" || (this.basicForm.controls["nombre"].value) == null){
      this._snackbar.open("Debe ingresar Nombre", "Aviso!",{duration:3000});
      this.error = true;
    }
    // if(!this.ValueTipo.value){
    //   this._snackbar.open("Debe ingresar Tipo", "Aviso!",{duration:3000});
    //   this.error = true;
    // }
    return this.error;
  }

  close(){
    this._dialogRef.close();
  }

  // addTipo(action?:string){
  //   const datax = [{
  //     id: 0,
  //     action: action
  //   }]
  //   let dialogg = this._dialog.open(TipoDialogComponent, {
  //     data: datax,
  //     disableClose: true,
  //     panelClass: 'modal-dialog-right',
  //   })
  //   dialogg.afterClosed().subscribe(result => {
  //     if(result=='yes'){
  //       this.getTipo();
  //     }
  //   })
  // }
  // updateTipo(action?:string){
  //   const datax = [{
  //     id: this.ValueTipo.value,
  //     action: action
  //   }]
  //   let dialogg = this._dialog.open(TipoDialogComponent, {
  //     data: datax,
  //     disableClose: true,
  //     panelClass: 'modal-dialog-right',
  //   })
  //   dialogg.afterClosed().subscribe(result => {
  //     if(result=='yes'){
  //       this.getTipo();
  //     }
  //   })
  // }
  // deleteTipo(){
  //   console.log('deleteTipo')
  // }
  onTipoChange(event :MatSelectChange){
    if(event.value != null){
      this.ocultarUpdate = "";
      this.ocultarDelete = "";
    }
  }
}
