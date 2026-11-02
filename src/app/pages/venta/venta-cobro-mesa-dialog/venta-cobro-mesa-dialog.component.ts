import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../material/material.module';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MesaService } from '../../../services/mesa.service';
import { PedidoService } from '../../../services/pedido.service';
import { LoginService } from '../../../services/login.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

export interface CobroMesaData {
  idPedido: number;
  idMesa?: number;
  mesa_nombre?: string;
  nombreCliente?: string;
  montoTotal: number;
  items_count?: number;
  resumen_productos?: string;
}

@Component({
  selector: 'app-venta-cobro-mesa-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    MatProgressBarModule,
    DecimalPipe
  ],
  templateUrl: './venta-cobro-mesa-dialog.component.html',
  styleUrl: './venta-cobro-mesa-dialog.component.css'
})
export class VentaCobroMesaDialogComponent implements OnInit {
  cargando: boolean = true;
  procesando: boolean = false;

  idPedido: number;
  idMesa: number;
  mesaNombre: string;
  nombreCliente: string;
  montoTotal: number = 0;
  resumenProductos: string = '';

  // Cajas y Cajeros
  cajas: any[] = [];
  cajeros: any[] = [];
  hayCajaAperturada: boolean = false;

  // Formulario de Pago
  idCajaSeleccionada: number | null = null;
  idCajeroSeleccionado: number | null = null;
  pagoCon: string = 'EF'; // 'EF' = Efectivo, 'TA' = Tarjeta
  nroOperacion: string = ''; // Número de operación del voucher POS (opcional)
  montoEfectivo: number | null = null;
  vuelto: number = 0;

  constructor(
    private dialogRef: MatDialogRef<VentaCobroMesaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CobroMesaData,
    private mesaService: MesaService,
    private pedidoService: PedidoService,
    private loginService: LoginService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.idPedido = data.idPedido;
    this.idMesa = data.idMesa || 0;
    this.mesaNombre = data.mesa_nombre || 'Mesa en Salón';
    this.nombreCliente = data.nombreCliente || 'CONSUMIDOR FINAL';
    this.montoTotal = Number(data.montoTotal || 0);
    this.resumenProductos = data.resumen_productos || '';
    this.montoEfectivo = this.montoTotal;
  }

  ngOnInit(): void {
    this.cargarCatalogoPOS();
  }

  cargarCatalogoPOS(): void {
    this.cargando = true;
    this.pedidoService.getPosCatalogo().subscribe({
      next: (res: any) => {
        this.cargando = false;
        if (res && res.code === 200 && res.data) {
          this.cajas = res.data.cajas || [];
          this.cajeros = res.data.cajeros || [];
          this.hayCajaAperturada = this.cajas.length > 0;

          const currentUser = this.loginService.getCurrentUser();

          if (this.hayCajaAperturada) {
            const miCaja = currentUser ? this.cajas.find((c: any) => Number(c.idUsuarioApertura) === Number(currentUser.id)) : null;
            this.idCajaSeleccionada = miCaja ? miCaja.id : this.cajas[0].id;
          }
          if (this.cajeros.length > 0) {
            const miCajero = currentUser ? this.cajeros.find((cj: any) => Number(cj.id) === Number(currentUser.id)) : null;
            this.idCajeroSeleccionado = miCajero ? miCajero.id : this.cajeros[0].id;
          }
        }
      },
      error: (err) => {
        this.cargando = false;
        console.error(err);
        this.snackBar.open('Error al consultar estado de cajas', 'Cerrar', { duration: 3500 });
      }
    });
  }

  setMedioPago(metodo: string): void {
    this.pagoCon = metodo;
    if (metodo === 'TA') {
      this.montoEfectivo = this.montoTotal;
      this.vuelto = 0;
    } else {
      this.calcularVuelto();
    }
  }

  setMontoSugerido(monto: number): void {
    this.montoEfectivo = Math.round(monto * 100) / 100;
    this.calcularVuelto();
  }

  calcularVuelto(): void {
    if (this.montoEfectivo !== null && this.montoEfectivo >= this.montoTotal) {
      this.vuelto = Math.round((this.montoEfectivo - this.montoTotal) * 100) / 100;
    } else {
      this.vuelto = 0;
    }
  }

  get esValidoParaCobrar(): boolean {
    if (!this.hayCajaAperturada) return false;
    if (!this.idCajaSeleccionada) return false;
    if (this.montoTotal <= 0) return false;
    if (this.pagoCon === 'EF') {
      if (this.montoEfectivo === null || this.montoEfectivo < this.montoTotal) {
        return false;
      }
    }
    return true;
  }

  irAperturaCaja(): void {
    this.dialogRef.close();
    this.router.navigate(['/pages/apertura']);
  }

  confirmarCobro(): void {
    if (!this.esValidoParaCobrar) {
      if (!this.hayCajaAperturada) {
        this.snackBar.open('No es posible cobrar: No hay ninguna caja aperturada en el sistema', 'Aviso', { duration: 4000 });
      } else if (this.pagoCon === 'EF' && (this.montoEfectivo === null || this.montoEfectivo < this.montoTotal)) {
        this.snackBar.open('El monto recibido en efectivo no cubre el total a cobrar', 'Aviso', { duration: 3500 });
      }
      return;
    }

    this.procesando = true;

    const payload = {
      id: this.idMesa,
      idMesa: this.idMesa,
      idPedido: this.idPedido,
      f_pagoCon: this.pagoCon,
      f_caja: this.idCajaSeleccionada,
      f_cajero: this.idCajeroSeleccionado,
      f_montoEfectivo: this.pagoCon === 'EF' ? this.montoEfectivo : this.montoTotal,
      f_vuelto: this.pagoCon === 'EF' ? this.vuelto : 0,
      f_nombreCliente: this.nombreCliente,
      f_nroOperacion: this.pagoCon === 'TA' ? (this.nroOperacion?.trim() || null) : null
    };

    this.mesaService.liberar(payload).subscribe({
      next: (res: any) => {
        this.procesando = false;
        if (res && res.code === 200) {
          this.snackBar.open(`¡Cobro registrado y ${this.mesaNombre} liberada con éxito!`, 'Correcto', {
            duration: 4000,
            panelClass: 'custom-snackbar'
          });
          this.dialogRef.close({ cobrado: true, idPedido: this.idPedido });
        } else {
          this.snackBar.open(res.message || 'Error al procesar cobro y liberar mesa', 'Cerrar', {
            duration: 5000,
            panelClass: 'custom-snackbar'
          });
        }
      },
      error: (err) => {
        this.procesando = false;
        console.error(err);
        const msg = err.error?.message || 'Error de comunicación con el servidor';
        this.snackBar.open(msg, 'Cerrar', { duration: 5000, panelClass: 'custom-snackbar' });
      }
    });
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
