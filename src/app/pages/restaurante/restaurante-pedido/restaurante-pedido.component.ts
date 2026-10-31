import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MaterialModule } from '../../../material/material.module';
import { MatExpansionModule } from '@angular/material/expansion';
import { FormsModule, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatPaginatorModule } from '@angular/material/paginator';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MesaService } from '../../../services/mesa.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PedidoService } from '../../../services/pedido.service';
import { Producto } from '../../../../model/producto';
import { RestauranteDialogDetalleComponent } from './restaurante-dialog-detalle/restaurante-dialog-detalle.component';
import { Pedido } from '../../../../model/pedido';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AlertMsjComponent } from '../../alert-msj/alert-msj.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-restaurante-pedido',
  standalone: true,
  imports: [
    MaterialModule,
    MatExpansionModule, 
    ReactiveFormsModule, 
    FormsModule,
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

  basicForm: UntypedFormGroup;
  ocultarCarga: boolean = true;
  nombreMesa: string = "----";
  error: boolean = false;
  listaDetalle: Producto[] = [];
  pedido: Pedido;
  
  isButtonDisabled: boolean = false;
  accion: string = "nuevo";
  id_pedido: number;

  check_pendiente: boolean = true;
  check_atendido: boolean = false;

  constructor(
    private _dialog: MatDialog,
    private mesaService: MesaService,
    private _snackbar: MatSnackBar,
    private pedidoService: PedidoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'auto' });
    this.initialFrm();
    if (this.mesa_Id) {
      this.mesaService.findById(this.mesa_Id).subscribe(data => {
        if (data['code'] == 200) {
          this.nombreMesa = data['data']['f_nombre'];
          this.id_pedido = data['data']['id_pedido'];
          this.pedido = data['detallePedido'];

          if (data['data']['f_disponible'] == 0) {
            this.accion = 'actualizar';
          }

          this.initialFrm();
        } else {
          this._snackbar.open(data['message'], "Error!", { duration: 4000, panelClass: 'custom-snackbar' });
        }
      });

      this.mesaService.findByIdDetail(this.mesa_Id).subscribe(data => {
        if (data['code'] == 200) {
          this.listaDetalle = data['data'] || [];
          this.fnTotal(); 
        } else {
          this._snackbar.open(data['message'], "Error!", { duration: 4000, panelClass: 'custom-snackbar' });
        }
      });
    } else {
      this._snackbar.open('Debe seleccionar mesa', "Error!", { duration: 4000, panelClass: 'custom-snackbar' });
    } 
  }

  private initialFrm() {
    this.basicForm = new UntypedFormGroup({
      id: new UntypedFormControl(this.id_pedido || 0),
      nombreCliente: new UntypedFormControl(this.pedido?.f_nombreCliente || 'CONSUMIDOR FINAL'),
      montoTotal: new UntypedFormControl(this.pedido?.f_montoTotal || '0.00'),
    }); 

    if (this.pedido?.f_state == 1) {
      this.check_atendido = true;
      this.check_pendiente = false;
    } else {
      this.check_pendiente = true;
      this.check_atendido = false;
    }
  }

  save() {
    if (!this.validateFrm()) {
      this.isButtonDisabled = true;
      const objP = new Pedido();
      objP.id = this.id_pedido;
      objP.f_idMesa = this.mesa_Id;
      objP.f_nombreCliente = this.basicForm.controls["nombreCliente"].value || 'CONSUMIDOR FINAL';
      objP.f_montoTotal = this.basicForm.controls["montoTotal"].value;
      objP.f_montoEfectivo = 0;
      objP.f_vuelto = 0;
      objP.f_pagoCon = 'EF';
      objP.f_state = this.check_atendido ? 1 : 0;
      objP.f_detalle = this.listaDetalle;

      if (this.accion == 'nuevo') {
        this.pedidoService.save(objP).subscribe(data => {
          this.isButtonDisabled = false;
          if (data['code'] == 200) {
            this._snackbar.open("Comanda registrada correctamente. El cobro se realiza desde Ventas.", "Correcto!", { duration: 4000, panelClass: 'custom-snackbar' });
            this.cerrar.emit();
          } else {
            this._snackbar.open(data['message'] || 'Error al guardar comanda', "Error!", { duration: 4000, panelClass: 'custom-snackbar' });
          }
        });
      } else {
        this.pedidoService.update(objP.id, objP).subscribe(data => {
          this.isButtonDisabled = false;
          if (data['code'] == 200) {
            this._snackbar.open("Comanda actualizada correctamente. El cobro se realiza desde Ventas.", "Correcto!", { duration: 4000, panelClass: 'custom-snackbar' });
            this.cerrar.emit();
          } else {
            this._snackbar.open(data['message'] || 'Error al actualizar comanda', "Error!", { duration: 4000, panelClass: 'custom-snackbar' });
          }
        });
      }
    }
  }

  validateFrm(): boolean {
    this.error = false; 
    if (!this.listaDetalle || this.listaDetalle.length === 0) {
      this._snackbar.open("Debe agregar al menos un producto a la comanda", "Aviso!", { duration: 3000 });
      this.error = true;
    } 
    return this.error;
  }

  openDialogDetalle() {  
    let dialogRef = this._dialog.open(RestauranteDialogDetalleComponent, {
      width: '430px',
      maxWidth: '95vw',
      disableClose: true,
      panelClass: 'modal-dialog-right', 
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result != '' && result != undefined) {
        this.listaDetalle.push(result);
        this.fnTotal();
      } 
    });
  }

  eliminarProducto(index: number) {
    this.listaDetalle.splice(index, 1);
    this.fnTotal();
  }

  actualizarProducto(index: number) {
    let dialogRef = this._dialog.open(RestauranteDialogDetalleComponent, {
      width: '430px',
      maxWidth: '95vw',
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
    });
  }

  incrementarCantidad(index: number): void {
    if (this.listaDetalle[index]) {
      const cant = Number(this.listaDetalle[index].f_cantidad || 0) + 1;
      this.listaDetalle[index].f_cantidad = cant;
      this.listaDetalle[index].f_subTotal = Math.round(cant * Number(this.listaDetalle[index].f_precio || 0) * 100) / 100;
      this.fnTotal();
    }
  }

  decrementarCantidad(index: number): void {
    if (this.listaDetalle[index]) {
      const cant = Number(this.listaDetalle[index].f_cantidad || 0);
      if (cant > 1) {
        this.listaDetalle[index].f_cantidad = cant - 1;
        this.listaDetalle[index].f_subTotal = Math.round((cant - 1) * Number(this.listaDetalle[index].f_precio || 0) * 100) / 100;
        this.fnTotal();
      } else {
        this.eliminarProducto(index);
      }
    }
  }

  seleccionarEstado(estado: 'pendiente' | 'atendido'): void {
    if (estado === 'pendiente') {
      this.check_pendiente = true;
      this.check_atendido = false;
    } else {
      this.check_pendiente = false;
      this.check_atendido = true;
    }
  }

  fnTotal() {
    let total = 0;
    this.listaDetalle.forEach((item) => {
      total += Number(item.f_subTotal || 0);
    });
    const totalStr = total.toFixed(2);
    this.basicForm.controls["montoTotal"].setValue(totalStr);
  }

  cerrarFormulario() {
    this.cerrar.emit();
  }

  irAVentas() {
    this.router.navigate(['/pages/venta']);
  }

  anularMesa() {
    let dialogRef = this._dialog.open(AlertMsjComponent, {
      width: '320px',
      disableClose: true,
      data: { mensaje: '¿Está seguro de ANULAR esta comanda y liberar la mesa?' }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'yes') {
        const datax = {
          id: this.mesa_Id,
        };
        this.mesaService.anular(datax).subscribe(data => {
          if (data['code'] == 200) {
            this._snackbar.open('Comanda anulada y mesa liberada correctamente', 'Correcto!', {
              duration: 3000,
              panelClass: 'custom-snackbar'
            });
            this.cerrar.emit();
          } else {
            this._snackbar.open(data['message'], "Error!", { duration: 6000, panelClass: 'custom-snackbar' });
          }
        }); 
      } 
    });
  }
}
