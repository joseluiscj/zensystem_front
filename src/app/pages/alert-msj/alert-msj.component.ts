import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from '../../material/material.module';

@Component({
  selector: 'app-alert-msj',
  standalone: true,
  imports: [MaterialModule],
  templateUrl: './alert-msj.component.html',
  styleUrl: './alert-msj.component.css'
})
export class AlertMsjComponent implements OnInit {
  msj: string = "";

  constructor(
    private _dialogRef: MatDialogRef<AlertMsjComponent>,
    private _snackbar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public _data :any
  ){}
  ngOnInit(): void {
    if(!this._data || this._data == null){
      this._snackbar.open("Verificar datos", "Aviso!",{duration:3000});
    }else{
      this.msj = this._data.mensaje;
    }
  }
  save(){
    this._dialogRef.close('yes');
  }
  close(){
    this._dialogRef.close('no');
  }
  
}
