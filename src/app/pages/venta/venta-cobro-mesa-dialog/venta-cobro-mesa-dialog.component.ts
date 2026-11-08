import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../material/material.module';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
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
  montoPagado?: number;
  montoPendiente?: number;
  items_count?: number;
  resumen_productos?: string;
}

export interface ItemCobroDetalle {
  idPedidoDetalle: number;
  idProducto: number;
  nombre: string;
  precio: number;
  cantidadTotal: number;
  cantidadPagada: number;
  cantidadPendiente: number;
  cantidadCobrar: number;
  seleccionado: boolean;
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
    MatCheckboxModule,
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
  nombreClienteGeneral: string;
  nombreClientePago: string = '';
  resumenProductos: string = '';

  // Saldos de la Comanda
  montoTotal: number = 0;
  montoPagado: number = 0;
  saldoPendiente: number = 0;

  // Modalidad de Cobro: 'TOTAL' (cuenta completa) | 'ITEMS' (por productos) | 'MONTO' (monto libre / dividir partes)
  modoCobro: 'TOTAL' | 'ITEMS' | 'MONTO' = 'TOTAL';

  // Productos de la comanda
  detalleProductos: ItemCobroDetalle[] = [];

  // Historial de Pagos Previos
  historialPagos: any[] = [];
  mostrarHistorial: boolean = false;

  // Monto a cobrar en la transacción actual
  montoACobrar: number = 0;

  // Cajas y Cajeros
  cajas: any[] = [];
  cajeros: any[] = [];
  hayCajaAperturada: boolean = false;

  // Formulario de Pago
  idCajaSeleccionada: number | null = null;
  idCajeroSeleccionado: number | null = null;
  pagoCon: string = 'EF'; // 'EF' = Efectivo, 'TA' = Tarjeta
  nroOperacion: string = ''; // Voucher POS (opcional)
  montoEfectivo: number | null = null;
  vuelto: number = 0;

  // Último abono realizado con éxito
  ultimoPagoExitoso: any = null;

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
    this.nombreClienteGeneral = data.nombreCliente || 'CONSUMIDOR FINAL';
    this.montoTotal = Number(data.montoTotal || 0);
    this.montoPagado = Number(data.montoPagado || 0);
    this.saldoPendiente = Number(data.montoPendiente !== undefined ? data.montoPendiente : Math.max(0, this.montoTotal - this.montoPagado));
    this.resumenProductos = data.resumen_productos || '';
  }

  ngOnInit(): void {
    this.cargarDatosIniciales();
  }

  cargarDatosIniciales(): void {
    this.cargando = true;
    this.pedidoService.getPosCatalogo().subscribe({
      next: (res: any) => {
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
        this.cargarDetalleComanda();
      },
      error: () => {
        this.cargando = false;
        this.snackBar.open('Error al consultar estado de cajas', 'Cerrar', { duration: 3500 });
      }
    });
  }

  cargarDetalleComanda(): void {
    this.pedidoService.obtenerPedidoCompleto(this.idPedido).subscribe({
      next: (res: any) => {
        this.cargando = false;
        if (res && res.code === 200) {
          const p = res.data || {};
          this.montoTotal = Number(p.f_montoTotal || this.montoTotal);
          this.montoPagado = Number(p.f_montoPagado || 0);
          this.saldoPendiente = Number(p.f_montoPendiente !== undefined ? p.f_montoPendiente : Math.max(0, this.montoTotal - this.montoPagado));
          if (this.saldoPendiente <= 0 && p.f_state == 0) {
            this.saldoPendiente = this.montoTotal;
          }

          this.historialPagos = res.pagos || [];

          // Mapear productos con stock y cantidades pendientes
          this.detalleProductos = (res.detalle || []).map((d: any) => {
            const cantTotal = Number(d.cantidad || d.f_cantidad || 0);
            const cantPagada = Number(d.cantidadPagada || 0);
            const cantPend = Math.max(0, cantTotal - cantPagada);
            return {
              idPedidoDetalle: d.id,
              idProducto: d.idProducto,
              nombre: d.f_txtProducto || d.nombre || 'Producto',
              precio: Number(d.f_precio || d.precio || 0),
              cantidadTotal: cantTotal,
              cantidadPagada: cantPagada,
              cantidadPendiente: cantPend,
              cantidadCobrar: 0,
              seleccionado: false
            };
          });

          this.actualizarMontoSegunModo();
        }
      },
      error: () => {
        this.cargando = false;
        this.snackBar.open('Error al cargar detalle de productos de la comanda', 'Cerrar', { duration: 3500 });
      }
    });
  }

  setModoCobro(modo: 'TOTAL' | 'ITEMS' | 'MONTO'): void {
    this.modoCobro = modo;
    if (modo === 'ITEMS') {
      // Reiniciar selección de items
      this.detalleProductos.forEach(it => {
        it.cantidadCobrar = 0;
        it.seleccionado = false;
      });
      this.montoACobrar = 0;
    } else {
      this.actualizarMontoSegunModo();
    }
    this.actualizarEfectivoYVuelto();
  }

  actualizarMontoSegunModo(): void {
    if (this.modoCobro === 'TOTAL') {
      this.montoACobrar = Math.round(this.saldoPendiente * 100) / 100;
    } else if (this.modoCobro === 'ITEMS') {
      this.recalcularTotalItems();
    } else if (this.modoCobro === 'MONTO') {
      if (this.montoACobrar <= 0 || this.montoACobrar > this.saldoPendiente) {
        this.montoACobrar = Math.round(this.saldoPendiente * 100) / 100;
      }
    }
    this.actualizarEfectivoYVuelto();
  }

  // Manejo de Selección de Ítems
  toggleItem(item: ItemCobroDetalle): void {
    if (item.cantidadPendiente <= 0) return;
    if (item.cantidadCobrar > 0) {
      item.cantidadCobrar = 0;
      item.seleccionado = false;
    } else {
      item.cantidadCobrar = 1;
      item.seleccionado = true;
    }
    this.recalcularTotalItems();
  }

  incrementarCantidad(item: ItemCobroDetalle, event?: Event): void {
    if (event) event.stopPropagation();
    if (item.cantidadCobrar < item.cantidadPendiente) {
      item.cantidadCobrar++;
      item.seleccionado = true;
      this.recalcularTotalItems();
    }
  }

  decrementarCantidad(item: ItemCobroDetalle, event?: Event): void {
    if (event) event.stopPropagation();
    if (item.cantidadCobrar > 0) {
      item.cantidadCobrar--;
      if (item.cantidadCobrar === 0) {
        item.seleccionado = false;
      }
      this.recalcularTotalItems();
    }
  }

  seleccionarTodosItems(): void {
    this.detalleProductos.forEach(it => {
      it.cantidadCobrar = it.cantidadPendiente;
      it.seleccionado = it.cantidadPendiente > 0;
    });
    this.recalcularTotalItems();
  }

  deseleccionarTodosItems(): void {
    this.detalleProductos.forEach(it => {
      it.cantidadCobrar = 0;
      it.seleccionado = false;
    });
    this.recalcularTotalItems();
  }

  recalcularTotalItems(): void {
    const total = this.detalleProductos.reduce((acc, it) => acc + (it.cantidadCobrar * it.precio), 0);
    this.montoACobrar = Math.round(total * 100) / 100;
    this.actualizarEfectivoYVuelto();
  }

  // División en partes iguales
  dividirEnPartes(n: number): void {
    if (n <= 0 || this.saldoPendiente <= 0) return;
    const parte = Math.round((this.saldoPendiente / n) * 100) / 100;
    this.montoACobrar = Math.min(this.saldoPendiente, parte);
    this.actualizarEfectivoYVuelto();
  }

  onMontoManualChange(): void {
    if (this.montoACobrar < 0) this.montoACobrar = 0;
    this.actualizarEfectivoYVuelto();
  }

  // Medios de pago
  setMedioPago(metodo: string): void {
    this.pagoCon = metodo;
    this.actualizarEfectivoYVuelto();
  }

  setMontoSugerido(monto: number): void {
    this.montoEfectivo = Math.round(monto * 100) / 100;
    this.calcularVuelto();
  }

  actualizarEfectivoYVuelto(): void {
    if (this.pagoCon === 'TA') {
      this.montoEfectivo = this.montoACobrar;
      this.vuelto = 0;
    } else {
      this.montoEfectivo = this.montoACobrar;
      this.calcularVuelto();
    }
  }

  calcularVuelto(): void {
    if (this.montoEfectivo !== null && this.montoEfectivo >= this.montoACobrar) {
      this.vuelto = Math.round((this.montoEfectivo - this.montoACobrar) * 100) / 100;
    } else {
      this.vuelto = 0;
    }
  }

  get esPagoCompleto(): boolean {
    return Math.abs(this.montoACobrar - this.saldoPendiente) <= 0.05;
  }

  get itemsSeleccionadosCount(): number {
    return this.detalleProductos.reduce((acc, it) => acc + it.cantidadCobrar, 0);
  }

  get porcentajePagado(): number {
    if (this.montoTotal <= 0) return 0;
    return Math.min(100, Math.round((this.montoPagado / this.montoTotal) * 100));
  }

  get esValidoParaCobrar(): boolean {
    if (!this.hayCajaAperturada) return false;
    if (!this.idCajaSeleccionada) return false;
    if (this.montoACobrar <= 0) return false;
    if (this.montoACobrar > (this.saldoPendiente + 0.05)) return false;

    if (this.modoCobro === 'ITEMS' && this.itemsSeleccionadosCount === 0) {
      return false;
    }

    if (this.pagoCon === 'EF') {
      if (this.montoEfectivo === null || this.montoEfectivo < this.montoACobrar) {
        return false;
      }
    }
    return true;
  }

  confirmarCobro(): void {
    if (!this.esValidoParaCobrar) {
      if (!this.hayCajaAperturada) {
        this.snackBar.open('No es posible cobrar: No hay ninguna caja aperturada en el sistema', 'Aviso', { duration: 4000 });
      } else if (this.modoCobro === 'ITEMS' && this.itemsSeleccionadosCount === 0) {
        this.snackBar.open('Seleccione al menos un producto a cobrar para este comensal', 'Aviso', { duration: 3500 });
      } else if (this.pagoCon === 'EF' && (this.montoEfectivo === null || this.montoEfectivo < this.montoACobrar)) {
        this.snackBar.open('El monto recibido en efectivo no cubre el total de este cobro', 'Aviso', { duration: 3500 });
      }
      return;
    }

    this.procesando = true;

    const itemsParaCobro = this.modoCobro === 'ITEMS' 
      ? this.detalleProductos
          .filter(it => it.cantidadCobrar > 0)
          .map(it => ({
            idPedidoDetalle: it.idPedidoDetalle,
            idProducto: it.idProducto,
            nombre: it.nombre,
            cantidad: it.cantidadCobrar,
            precio: it.precio,
            subtotal: Math.round(it.cantidadCobrar * it.precio * 100) / 100
          }))
      : [];

    const tipoCobroPayload = this.modoCobro === 'ITEMS' 
      ? 'PARCIAL_ITEMS' 
      : (this.modoCobro === 'MONTO' && !this.esPagoCompleto ? 'PARCIAL_MONTO' : 'TOTAL');

    const nombreClienteEnvio = this.nombreClientePago?.trim() 
      ? this.nombreClientePago.trim().toUpperCase() 
      : this.nombreClienteGeneral;

    const payload: any = {
      id: this.idMesa,
      idMesa: this.idMesa,
      idPedido: this.idPedido,
      tipoCobro: tipoCobroPayload,
      montoCobrar: this.montoACobrar,
      items: itemsParaCobro,
      f_pagoCon: this.pagoCon,
      f_caja: this.idCajaSeleccionada,
      f_cajero: this.idCajeroSeleccionado,
      f_montoEfectivo: this.pagoCon === 'EF' ? this.montoEfectivo : this.montoACobrar,
      f_vuelto: this.pagoCon === 'EF' ? this.vuelto : 0,
      f_nombreCliente: nombreClienteEnvio,
      f_nroOperacion: this.pagoCon === 'TA' ? (this.nroOperacion?.trim() || null) : null
    };

    this.mesaService.liberar(payload).subscribe({
      next: (res: any) => {
        this.procesando = false;
        if (res && res.code === 200) {
          const dataRes = res.data || {};
          this.ultimoPagoExitoso = dataRes;

          if (dataRes.mesaLiberada) {
            // Comanda 100% cobrada y mesa liberada
            this.snackBar.open(`¡Cobro completado y ${this.mesaNombre} liberada con éxito!`, 'Correcto', {
              duration: 4000,
              panelClass: 'custom-snackbar'
            });
            this.dialogRef.close({ cobrado: true, liberada: true, idPedido: this.idPedido });
          } else {
            // Pago parcial registrado: actualizamos estado en vivo para el siguiente comensal
            this.snackBar.open(
              `¡Pago parcial de S/ ${this.montoACobrar.toFixed(2)} registrado! Saldo restante: S/ ${Number(dataRes.saldoRestante || 0).toFixed(2)}`,
              'Correcto',
              { duration: 4500, panelClass: 'custom-snackbar' }
            );

            // Limpiar datos de este comensal y recargar la comanda
            this.nombreClientePago = '';
            this.nroOperacion = '';
            this.cargarDetalleComanda();
          }
        } else {
          this.snackBar.open(res.message || 'Error al procesar el cobro', 'Cerrar', {
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

  imprimirComprobanteAbono(pago: any): void {
    if (!pago) return;

    let itemsHtml = '';
    if (pago.itemsCobrados && pago.itemsCobrados.length > 0) {
      itemsHtml = `
        <div style="margin: 8px 0; border-top: 1px dashed #ccc; border-bottom: 1px dashed #ccc; padding: 6px 0;">
          <strong style="font-size: 11px;">Ítems de este comensal:</strong>
          <table style="width: 100%; font-size: 11px; margin-top: 4px;">
            ${pago.itemsCobrados.map((it: any) => `
              <tr>
                <td>${it.cantidad}x ${it.nombre}</td>
                <td style="text-align: right;">S/ ${Number(it.subtotal || (it.cantidad * it.precio)).toFixed(2)}</td>
              </tr>
            `).join('')}
          </table>
        </div>
      `;
    }

    const printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ticket de Pago - ${pago.nroComprobante || 'Abono'}</title>
        <style>
          body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 15px; width: 280px; }
          .text-center { text-align: center; }
          .text-end { text-align: right; }
          .fw-bold { font-weight: bold; }
          .divider { border-top: 1px dashed #666; margin: 8px 0; }
          .badge { font-size: 10px; background: #eee; padding: 2px 5px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="text-center">
          <h2 style="margin: 0; font-size: 16px;">ZENSYSTEM RESTAURANTE</h2>
          <p style="margin: 2px 0; font-size: 11px;">Comprobante de Pago en Mesa</p>
          <div class="divider"></div>
          <div class="fw-bold" style="font-size: 13px;">${pago.nroComprobante || 'TICKET DE ABONO'}</div>
          <p style="margin: 2px 0;">Comanda #${this.idPedido} &bull; ${this.mesaNombre}</p>
        </div>
        <div class="divider"></div>
        <div>
          <div><strong>Fecha:</strong> ${new Date().toLocaleString()}</div>
          <div><strong>Cliente:</strong> ${pago.nombreCliente || this.nombreClienteGeneral}</div>
          <div><strong>Medio Pago:</strong> ${pago.metodoPago === 'TA' ? 'Tarjeta' : 'Efectivo'}</div>
          ${pago.nroOperacion ? `<div><strong>Operación:</strong> ${pago.nroOperacion}</div>` : ''}
        </div>
        ${itemsHtml}
        <div class="divider"></div>
        <table style="width: 100%; font-size: 12px;">
          <tr style="font-size: 14px; font-weight: bold;">
            <td>MONTO PAGADO:</td>
            <td class="text-end">S/ ${Number(pago.montoCobrado || pago.monto || 0).toFixed(2)}</td>
          </tr>
          ${pago.saldoRestante !== undefined ? `
            <tr style="color: #666; font-size: 11px;">
              <td>Saldo Restante en Mesa:</td>
              <td class="text-end">S/ ${Number(pago.saldoRestante).toFixed(2)}</td>
            </tr>
          ` : ''}
        </table>
        <div class="divider"></div>
        <p class="text-center" style="font-size: 10px; margin: 10px 0 0;">
          ${Number(pago.saldoRestante || 0) <= 0.05 ? '¡GRACIAS POR SU PREFERENCIA!' : 'PAGO PARCIAL REGISTRADO - CUENTA EN CURSO'}
        </p>
      </body>
      </html>
    `;

    const printWin = window.open('', '_blank', 'width=350,height=550');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(printHtml);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => {
        printWin.print();
      }, 300);
    }
  }

  irAperturaCaja(): void {
    this.dialogRef.close();
    this.router.navigate(['/pages/apertura']);
  }

  cerrar(): void {
    // Si se registraron abonos parciales, avisar a la vista padre para que refresque la tabla
    if (this.ultimoPagoExitoso) {
      this.dialogRef.close({ cobrado: false, abono: true, idPedido: this.idPedido });
    } else {
      this.dialogRef.close();
    }
  }
}
