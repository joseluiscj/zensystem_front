import { Component, Inject, OnInit } from '@angular/core';
import { MaterialModule } from '../../../../material/material.module';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Tipo } from '../../../../../model/tipo';
import { TipoService } from '../../../../services/tipo.service';
import { MatSnackBar } from '@angular/material/snack-bar';

interface data_env{
  id: number;
  action: string;
}

@Component({
  selector: 'app-tipo-dialog',
  standalone: true,
  imports: [MaterialModule, NgIf,ReactiveFormsModule,FormsModule,CommonModule],
  templateUrl: './tipo-dialog.component.html',
  styleUrl: './tipo-dialog.component.css'
})

export class TipoDialogComponent implements OnInit{
  basicForm: UntypedFormGroup;
  tipo:Tipo;
  data_env :data_env;
  error:boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) private send_data:any,
    private _dialogRef: MatDialogRef<TipoDialogComponent>,
    private tipoService: TipoService,
    private _snackbar: MatSnackBar,
    
  ){}
  ngOnInit(): void {
    this.initialFrm();
    this.data_env = this.send_data[0];
    if(this.data_env.id != 0){
      this.tipoService.findById(this.data_env.id).subscribe(data => {
        if(data['code'] == 200){
          this.tipo = data['data']
          this.initialFrm();
        }else{
          this._snackbar.open(data['message'], "Error!",{duration:3000,panelClass: 'custom-snackbar'});
        }
      })
    }
  }
  private initialFrm(){
    this.basicForm = new UntypedFormGroup({
      id: new UntypedFormControl(this.tipo?.id),
      nombre: new UntypedFormControl(this.tipo?.f_nombre,[Validators.required]),
    })
  }
  close(){
    this._dialogRef.close();
  }
  save(){
    if(!this.validateFrm()){
      const Obj = new Tipo();
      Obj.id = this.data_env.id;
      Obj.f_nombre = this.basicForm.controls["nombre"].value;
      if(!Obj.id){ //new
        this.tipoService.save(Obj).subscribe(data => {
          if(data['code'] == 200){     
            this._snackbar.open("Datos registrados correctamente", "Correcto!",{duration:3000,panelClass: 'custom-snackbar'});
            this._dialogRef.close('yes');
          }else{
            this._snackbar.open(data['message'], "Error!",{duration:3000,panelClass: 'custom-snackbar'});
          }
        })
      }else{ //update
        this.tipoService.update(Obj.id, Obj).subscribe(data => {
          if(data['code'] == 200){
            this._snackbar.open("Datos actualizados correctamente", "Correcto!",{duration:3000,panelClass: 'custom-snackbar'});
            this._dialogRef.close('yes');
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
