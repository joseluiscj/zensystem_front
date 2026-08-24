import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { MaterialModule } from '../../../material/material.module';
import { MatExpansionModule } from '@angular/material/expansion';
import { FormControl, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatPaginatorModule } from '@angular/material/paginator';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MesaService } from '../../../services/mesa.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PedidoService } from '../../../services/pedido.service';
import { Producto } from '../../../../model/producto';
import { RestauranteDialogDetalleComponent } from './restaurante-dialog-detalle/restaurante-dialog-detalle.component';
import { Pedido } from '../../../../model/pedido';
import { Caja } from '../../../../model/caja';
import { Observable } from 'rxjs';
import { Persona } from '../../../../model/persona';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AlertMsjComponent } from '../../alert-msj/alert-msj.component';

@Component({
  selector: 'app-restaurante-pedido',
  standalone: true,
  imports: [
    MaterialModule,
    MatExpansionModule, 
    ReactiveFormsModule, 
    MatPaginatorModule,
    CommonModule,
    NgIf,
    NgFor,
    MatCheckboxModule
  ],
  templateUrl: './restaurante-pedido.component.html',
  styleUrl: './restaurante-pedido.component.css'
})
export class RestaurantePedidoComponent implements OnInit {
  @Input() mesa_Id?: number;
  @Output() cerrar = new EventEmitter<void>();
  
  // hideSingleSelectionIndicator_pendiente = signal(false);
  // hideMultipleSelectionIndicator_antendido = signal(false);

  basicForm: UntypedFormGroup;
  ocultarCarga:boolean=true;
  nombreMesa:string = "----";
  error:boolean=false;
  listaDetalle:Producto[] = [];
  pedido:Pedido;
  
  isButtonDisabled:boolean=false;
  selectePagoCon:number;
  selecteCaja:number;
  selecteCajero:number; 

  ///tipo evento
  // caja: Caja[];
  // ValueCaja = new FormControl();
  // filterControlCaja = new FormControl();
  // filteredCaja: Observable<any[]>;
  listCaja: Caja[]=[];
  listCajero: Persona[]=[];
  accion:string = "nuevo";
  id_pedido:number;

  check_pendiente:boolean=false;
  check_atendido:boolean=false;

  constructor(
    // private _dialogRef: MatDialogRef<RestauranteDialogComponent>,
    private _dialog:MatDialog,
    private mesaService: MesaService,
    private _snackbar: MatSnackBar,
    private pedidoService: PedidoService,
  ){}

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'auto' });
    this.initialFrm();
    console.log(this.mesa_Id)
    if(this.mesa_Id){
      this.mesaService.findById(this.mesa_Id).subscribe(data => {
        if(data['code'] == 200){
          this.nombreMesa = data['data']['f_nombre'];
          this.id_pedido = data['data']['id_pedido'];
          this.pedido = data['detallePedido'];

          if(data['data']['f_disponible']==0){
            this.accion = 'actualizar';
          }
          this.listCaja = data['caja'];
          // if(this.listCaja.length>0){
          //   this.selecteCaja = this.listCaja[0].id;
          // }
          this.listCajero = data['dataCajeros']
          if(this.listCajero.length>0){
            this.selecteCajero = this.listCajero[0].id;
          }
          this.initialFrm();




        }else{
          this._snackbar.open(data['message'], "Error!",{duration:4000,panelClass: 'custom-snackbar'});
        }
      })
      this.mesaService.findByIdDetail(this.mesa_Id).subscribe(data => {
        if(data['code'] == 200){
            this.listaDetalle = data['data'];
            this.fnTotal(); 
        }else{
          this._snackbar.open(data['message'], "Error!",{duration:4000,panelClass: 'custom-snackbar'});
        }
      })
    }else{
      this._snackbar.open('Debe seleccionar mesa', "Error!",{duration:4000,panelClass: 'custom-snackbar'});
    } 
  }
  private initialFrm(){
    console.log(this.pedido)
    this.basicForm = new UntypedFormGroup({
      id: new UntypedFormControl(0),
      nombreCliente: new UntypedFormControl(this.pedido?.f_nombreCliente),
      pagoCon: new UntypedFormControl(this.pedido?.f_pagoCon),
      caja: new UntypedFormControl(this.pedido?.f_caja),
      cajero: new UntypedFormControl(this.pedido?.f_cajero),
      montoTotal: new UntypedFormControl(this.pedido?.f_montoTotal),
      montoEfectivo: new UntypedFormControl(this.pedido?.f_montoEfectivo),
      vuelto: new UntypedFormControl(this.pedido?.f_vuelto),
    }); 
    if (this.pedido?.f_state==1) {
      this.check_atendido = true;
      this.check_pendiente = false;
    }else{
      this.check_pendiente = true;
      this.check_atendido = false;
    }
  }
  save(){
    if(!this.validateFrm()){
      this.isButtonDisabled=true;
      const objP = new Pedido();
      objP.id = this.id_pedido;
      objP.f_idMesa = this.mesa_Id;
      objP.f_nombreCliente = this.basicForm.controls["nombreCliente"].value;
      objP.f_montoTotal = this.basicForm.controls["montoTotal"].value;
      objP.f_montoEfectivo = this.basicForm.controls["montoEfectivo"].value;
      objP.f_vuelto = this.basicForm.controls["vuelto"].value;
      objP.f_pagoCon = this.selectePagoCon;
      objP.f_caja = this.selecteCaja;
      objP.f_cajero = this.selecteCajero;
      objP.f_state = this.check_atendido?1:0;

      objP.f_detalle = this.listaDetalle
      if (this.accion=='nuevo') {
        this.pedidoService.save(objP).subscribe(data => {
          this.isButtonDisabled=false;
          if(data['code'] == 200){
            this._snackbar.open("Pedido registrado correctamente", "Correcto!",{duration:3000,panelClass: 'custom-snackbar'});
            // this._dialogRef.close('yes');
            this.cerrar.emit();
          }else{
            this._snackbar.open(data['message'], "Error!",{duration:4000,panelClass: 'custom-snackbar'});
          }
        })
      }else{
        this.pedidoService.update(objP.id, objP).subscribe(data => {
          this.isButtonDisabled=false;
          if(data['code'] == 200){
            this._snackbar.open("Pedido actualizado correctamente", "Correcto!",{duration:3000,panelClass: 'custom-snackbar'});
            // this._dialogRef.close('yes');
            this.cerrar.emit();
          }else{
            this._snackbar.open(data['message'], "Error!",{duration:4000,panelClass: 'custom-snackbar'});
          }
        })
      }
    }
  }
  validateFrm() :boolean{
    this.error = false; 
    if((this.basicForm.controls["montoTotal"].value) == "" || (this.basicForm.controls["montoTotal"].value) == null){
      this._snackbar.open("Debe seleccionar al menos un porducto", "Aviso!",{duration:3000});
      this.error = true;
    } 
    if(!this.check_pendiente && !this.check_atendido){
      this._snackbar.open("Debe seleccionar Pendiente o Antendido", "Aviso!",{duration:3000});
      this.error = true;
    }
    return this.error;
  }
  openDialogDetalle() {  
    let dialogRef = this._dialog.open(RestauranteDialogDetalleComponent, {
      width: '300px',
      disableClose: true,
      panelClass: 'modal-dialog-right', 
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result != '' && result != undefined) {
        this.listaDetalle.push(result);
        this.fnTotal();
      } 
    })
  }
  eliminarProducto(index:number){
    this.listaDetalle.splice(index, 1);
    this.fnTotal();
  }
  actualizarProducto(index:number){
    let dialogRef = this._dialog.open(RestauranteDialogDetalleComponent, {
      width: '300px',
      disableClose: true,
      panelClass: 'modal-dialog-right',
      data: { 
        producto: this.listaDetalle[index]
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result != '' && result != undefined) {
        this.listaDetalle[index] = result;
        this.fnTotal();
      }
    })
  }
  fnTotal(){
    let total = 0;
    this.listaDetalle.forEach((item) => {
      total += item.f_subTotal;
    })
    this.basicForm.controls["montoTotal"].setValue((total).toFixed(2));
    this.fnVuelto()
  }
  cerrarFormulario() {
    this.cerrar.emit();
  }
  fnVuelto(){
    let vuelto = this.basicForm.controls["montoTotal"].value - this.basicForm.controls["montoEfectivo"].value
    if (vuelto > 0) {
      vuelto = 0
    }else{
      vuelto=vuelto*-1
    }
    this.basicForm.controls["vuelto"].setValue(vuelto.toFixed(2))
  }

onPendienteChange(event: any): void {
  this.check_pendiente = event.checked;
  if (event.checked) {
    this.check_atendido = false;
  }
}
onAtendidoChange(event: any): void {
  this.check_atendido = event.checked;
  if (event.checked) {
    this.check_pendiente = false;
  }
}
liberarMesa(){
  let dialogRef = this._dialog.open(AlertMsjComponent, {
    width: '300px',
    disableClose: true,
    data: { mensaje: '¿Está seguro de liberar mesa?'}
  });
  dialogRef.afterClosed().subscribe(result => {
    if (result === 'yes') {
      const datax = {
        id: this.mesa_Id,
      }
      this.mesaService.liberar(datax).subscribe(data => {
        if(data['code'] == 200){
          this._snackbar.open('Mesa liberada correctamente ', 'Correcto!', {
            duration: 3000,
            panelClass: 'custom-snackbar'
          });
          this.cerrar.emit();
        }else{
          this._snackbar.open(data['message'], "Error!",{duration:6000,panelClass: 'custom-snackbar'});
        }
      }) 
    } 
  });
}
anularMesa(){
  let dialogRef = this._dialog.open(AlertMsjComponent, {
    width: '300px',
    disableClose: true,
    data: { mensaje: '¿Está seguro de ANULAR el pedido?'}
  });
  dialogRef.afterClosed().subscribe(result => {
    if (result === 'yes') {
      const datax = {
        id: this.mesa_Id,
      }
      this.mesaService.anular(datax).subscribe(data => {
        if(data['code'] == 200){
          this._snackbar.open('Pedido anulado correctamente ', 'Correcto!', {
            duration: 3000,
            panelClass: 'custom-snackbar'
          });
          this.cerrar.emit();
        }else{
          this._snackbar.open(data['message'], "Error!",{duration:6000,panelClass: 'custom-snackbar'});
        }
      }) 
    } 
  });
}
}
