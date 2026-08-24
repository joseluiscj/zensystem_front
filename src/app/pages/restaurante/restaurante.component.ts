import { Component, OnInit } from '@angular/core';
import { MaterialModule } from '../../material/material.module';
import { MatExpansionModule } from '@angular/material/expansion';
import { ReactiveFormsModule } from '@angular/forms';
import { MatPaginatorModule } from '@angular/material/paginator';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MesaService } from '../../services/mesa.service';
import { RestaurantePedidoComponent } from './restaurante-pedido/restaurante-pedido.component';
import {MatProgressBarModule} from '@angular/material/progress-bar';

interface data_env{
  id: number;
  nombre: string;
  disponible: number;
  cliente: string;
  montoTotal: number;
  state: number;
}

@Component({
  selector: 'app-restaurante',
  standalone: true,
  imports: [
    MaterialModule,
    MatExpansionModule, 
    ReactiveFormsModule, 
    MatPaginatorModule,
    CommonModule,
    MatTooltipModule,
    RestaurantePedidoComponent,
    MatProgressBarModule
  ],
  templateUrl: './restaurante.component.html',
  styleUrl: './restaurante.component.css'
})
export class RestauranteComponent implements OnInit{
  mesas:data_env[];
  mostrarFormulario = false;
  idMesaSeleccionada?: number;
  cardaData:boolean=true;
  mOcupadas:number=0;
  mDisponible:number=0;
  mTotal:number=0;

  constructor(
    private _dialog:MatDialog,
    private mesaService : MesaService
  ){}
  ngOnInit(): void {
    // this.mesaService.listMesas().subscribe(data => {
    //   this.cardaData=false;
    //   this.mesas = data;
    //   this.listData();
    //   this.mTotal=this.mesas.length;
    //   this.mesas.forEach((item)=>{
    //     this.mOcupadas += item.disponible==0?1:0;
    //   })
    // })
    this.listData();
  }
  openDialog(id?: number) { 
    // let dialogRef = this._dialog.open(RestauranteDialogComponent, {
    //   data: id,
    //   disableClose: true,
    //   panelClass: 'modal-dialog-right',
    // });
    // dialogRef.afterClosed().subscribe(result => {
    //   if (result == 'yes') {
    //     this.mesaService.listMesas().subscribe(data => {
    //       this.mesas = data;
    //     })
    //   }
    // })
    this.idMesaSeleccionada = id; 
    this.mostrarFormulario = true;
  } 
  cerrarFormulario() {
    this.mostrarFormulario = false;
    this.idMesaSeleccionada = undefined;
    this.listData();
  }
  listData(){
    this.mOcupadas=0;
    this.mDisponible=0;
    this.mesaService.listMesas().subscribe(data => {
      this.cardaData=false;
      this.mesas = data;
      this.mTotal=this.mesas.length;
      this.mesas.forEach((item)=>{
        this.mOcupadas += item.disponible==0?1:0;
      })
    })
  }

}
