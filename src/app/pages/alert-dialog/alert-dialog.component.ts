import { Component, Inject, OnInit } from '@angular/core';
import { MaterialModule } from '../../material/material.module';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-alert-dialog',
  standalone: true,
  imports: [MaterialModule],
  templateUrl: './alert-dialog.component.html',
  styleUrl: './alert-dialog.component.css'
})
export class AlertDialogComponent implements OnInit {
  msj: string = "";
  msj_detaill: string = "";

  constructor(
    private _dialogRef: MatDialogRef<AlertDialogComponent>,
    private _snackbar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public _data :any
  ){}

  ngOnInit(): void {
    if(!this._data || this._data == null){
      this._snackbar.open("Verificar datos", "Aviso!",{duration:3000});
    }else{
      this.msj = this._data.mensaje;
      this.msj_detaill = this._data?.mensajeDetalle;
    }
  }

  save(){
    this._dialogRef.close('yes');
  }

  close(){
    this._dialogRef.close('no');
  }
  
}
