import { Component, Inject, OnInit } from '@angular/core';
import { MaterialModule } from '../../../material/material.module';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Mesa } from '../../../../model/mesa';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MesaService } from '../../../services/mesa.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCheckbox } from '@angular/material/checkbox';

@Component({
  selector: 'app-mesa-dialog',
  standalone: true,
  imports: [MaterialModule, NgIf,ReactiveFormsModule,FormsModule,CommonModule, MatCheckbox],
  templateUrl: './mesa-dialog.component.html',
  styleUrl: './mesa-dialog.component.css'
})
export class MesaDialogComponent implements OnInit {
  basicForm: UntypedFormGroup;
  mesa:Mesa;
  ocultar: boolean = false;
  isButtonDisabled:boolean = false;
  error:boolean=false;
  disableSelect = new FormControl(false);

  constructor(
    @Inject(MAT_DIALOG_DATA) private idSelected:number,
    private _dialogRef: MatDialogRef<MesaDialogComponent>,
    private mesaService:MesaService,
    private _snackbar: MatSnackBar,
  ){}

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'auto' });
    this.initialFrm();
    if(this.idSelected){
      this.ocultar=true;
      this.mesaService.findById(this.idSelected).subscribe(data => {
      this.ocultar=false;
        if(data['code'] == 200){
          this.mesa = data['data'];
          this.initialFrm()  
        }else{
          this._snackbar.open(data['message'], "Error!",{duration:3000,panelClass: 'custom-snackbar'});
        }
      })
    }
  }
  private initialFrm(){
    this.basicForm = new UntypedFormGroup({
      id: new UntypedFormControl(this.mesa?.id),
      nombre: new UntypedFormControl(this.mesa?.f_nombre,[Validators.required]),
      descripcion: new UntypedFormControl(this.mesa?.f_descripcion),
    })

    this.disableSelect.setValue(this.mesa?.f_state==1?true:false);
  }
  close(){
    this._dialogRef.close();
  }
  save(){
    if(!this.validateFrm()){
      this.isButtonDisabled = true;
      const Obj = new Mesa();
      Obj.id = this.idSelected;
      Obj.f_nombre = this.basicForm.controls["nombre"].value;
      Obj.f_descripcion = this.basicForm.controls["descripcion"].value;
      Obj.f_state = this.disableSelect.value?1:0;
      if(!Obj.id){ //create 
        this.mesaService.save(Obj).subscribe((data)=>{
          this.isButtonDisabled = false;
          if(data['code'] == 200){
            this._snackbar.open("Datos registrados correctamente", "Correcto!",{duration:3000,panelClass: 'custom-snackbar'});
            this.mesaService.findAll().subscribe((data)=>{
              this.mesaService.setDataChange(data);
              this.close();
            })
          }else{
            this._snackbar.open(data['message'], "Error!",{duration:3000,panelClass: 'custom-snackbar'});
          }
        })
      }else{ //update
        this.mesaService.update(Obj.id, Obj).subscribe(data => {
          this.isButtonDisabled = false;
          if(data['code'] == 200){
            this._snackbar.open("Datos actualizados correctamente", "Correcto!",{duration:3000,panelClass: 'custom-snackbar'});
            this.mesaService.findAll().subscribe((data)=>{
              this.mesaService.setDataChange(data);
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

    return this.error;
  }

}
