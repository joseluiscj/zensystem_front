import { Component, Inject, OnInit } from '@angular/core';
import { MaterialModule } from '../../../material/material.module';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Caja } from '../../../../model/caja';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CajaService } from '../../../services/caja.service';
import { CajaTipo } from '../../../../model/cajaTipo';
import { GlobalService } from '../../../services/global.service';
import { Sucursal } from '../../../../model/sucursal';

@Component({
  selector: 'app-caja-dialog',
  standalone: true,
  imports: [
    MaterialModule,
    NgFor, 
    NgIf,
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    MatCheckboxModule
  ],
  templateUrl: './caja-dialog.component.html',
  styleUrl: './caja-dialog.component.css'
})
export class CajaDialogComponent implements OnInit {
  basicForm: UntypedFormGroup;
  isButtonDisabled:boolean=false;
  caja:Caja;
  check_pendiente:boolean=false;
  listTipoCaja:CajaTipo[];
  selecteTipoCaja:number
  listSucursal:Sucursal[];


  constructor(
    @Inject(MAT_DIALOG_DATA) private _idProducto: number,
    private _dialogRef: MatDialogRef<CajaDialogComponent>,
    private cajaService:CajaService,
    private globalService:GlobalService,
    private _snackbar: MatSnackBar,
  ){}

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'auto' }); 
    this.initialFrm();
    // this.cajaService.getDataChange
    this.cajaService.listCbo().subscribe((data)=>{
      if(data['code'] == 200){
        this.listTipoCaja=data['data']
      }else{
        this._snackbar.open(data['message'], "Error!",{duration:6000,panelClass: 'custom-snackbar'});
      }
    })
    this.globalService.listSucursal().subscribe((data)=>{
      if(data['code'] == 200){
        this.listTipoCaja=data['data']
      }else{
        this._snackbar.open(data['message'], "Error!",{duration:6000,panelClass: 'custom-snackbar'});
      }
    })
    
    

  }
  private initialFrm(){
    this.basicForm = new UntypedFormGroup({
      id: new UntypedFormControl(this.caja?.id ?? 0),
      nombre: new UntypedFormControl(this.caja?.f_nombre),
      saldo: new UntypedFormControl(this.caja?.f_saldo),
      moneda: new UntypedFormControl(this.caja?.f_moneda),
      medioPago: new UntypedFormControl(this.caja?.f_medioPago),
      sucursal: new UntypedFormControl(this.caja?.f_sucursal),
      cajaTipo: new UntypedFormControl(this.caja?.f_cajaTipo),
      principal: new UntypedFormControl(this.caja?.f_principal),
    });
  }

  close(){
    this._dialogRef.close();
  }
  save(){

  }
  onPendienteChange(event: any): void {
    this.check_pendiente = event.checked;
    // if (event.checked) {
    //   this.check_atendido = false;
    // }
  }



}
