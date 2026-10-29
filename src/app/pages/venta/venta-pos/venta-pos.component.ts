import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MaterialModule } from '../../../material/material.module';
import { PedidoService } from '../../../services/pedido.service';

export interface PosItemCarrito {
  idProducto: number;
  nombre: string;
  codigo: string;
  precio: number;
  cantidad: number;
  subtotal: number;
  unidadMedida: string;
  stock: number;
  controlStock: boolean | number;
  categoria_nombre?: string;
  imgId?: string;
  observacion?: string;
}

@Component({
  selector: 'app-venta-pos',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    MatProgressBarModule,
    FormsModule,
    DecimalPipe
  ],
  templateUrl: './venta-pos.component.html',
  styleUrl: './venta-pos.component.css'
})
export class VentaPosComponent implements OnInit {
  @Output() volver = new EventEmitter<boolean>();

  cargando: boolean = false;
  guardando: boolean = false;

  // Catálogos
  productos: any[] = [];
  productosFiltrados: any[] = [];
  categorias: any[] = [];
  cajas: any[] = [];
  almacenes: any[] = [];

  // Filtros de búsqueda en catálogo
  searchProducto: string = '';
  categoriaSeleccionada: any = 'todas';

  // Configuración de la venta
  nombreCliente: string = 'CONSUMIDOR FINAL';
  tipoComprobante: string = 'Ticket de Venta';
  idCajaSeleccionada: any = '';
  idAlmacenSeleccionado: any = 1;
  pagoCon: string = 'EF';
  montoEfectivo: number | null = null;

  tiposComprobante: string[] = [
    'Ticket de Venta',
    'Boleta de Venta',
    'Factura Comercial',
    'Nota de Venta'
  ];

  mediosPago: { codigo: string; nombre: string; icon: string }[] = [
    { codigo: 'EF', nombre: 'Efectivo', icon: 'payments' },
    { codigo: 'TJ', nombre: 'Tarjeta', icon: 'credit_card' },
    { codigo: 'YP', nombre: 'Yape', icon: 'phone_android' },
    { codigo: 'PL', nombre: 'Plin', icon: 'phone_android' },
    { codigo: 'TR', nombre: 'Transferencia', icon: 'account_balance' }
  ];

  // Carrito de compras / Ticket
  carrito: PosItemCarrito[] = [];

  constructor(
    private pedidoService: PedidoService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.cargarCatalogo();
  }

  regresar(registrado: boolean = false): void {
    this.volver.emit(registrado);
  }

  cargarCatalogo(): void {
    this.cargando = true;
    this.pedidoService.getPosCatalogo().subscribe({
      next: (res) => {
        this.cargando = false;
        if (res && res.code === 200 && res.data) {
          this.productos = res.data.productos || [];
          this.categorias = res.data.categorias || [];
          this.cajas = res.data.cajas || [];
          this.almacenes = res.data.almacenes || [];

          if (this.cajas.length > 0) {
            this.idCajaSeleccionada = this.cajas[0].id;
          }
          if (this.almacenes.length > 0) {
            this.idAlmacenSeleccionado = this.almacenes[0].id;
          }
          this.filtrarProductos();
        }
      },
      error: () => {
        this.cargando = false;
        this.snackBar.open('Error al cargar catálogo de productos para el Punto de Venta', 'Cerrar', { duration: 3500 });
      }
    });
  }

  filtrarProductos(): void {
    const term = (this.searchProducto || '').toLowerCase().trim();
    const cat = this.categoriaSeleccionada;

    this.productosFiltrados = this.productos.filter(p => {
      const matchCat = cat === 'todas' || p.idCategoria === Number(cat);
      const matchText = !term || 
        (p.nombre && p.nombre.toLowerCase().includes(term)) || 
        (p.codigo && p.codigo.toLowerCase().includes(term));
      return matchCat && matchText;
    });
  }

  setCategoria(catId: any): void {
    this.categoriaSeleccionada = catId;
    this.filtrarProductos();
  }

  agregarAlCarrito(prod: any): void {
    const index = this.carrito.findIndex(item => item.idProducto === prod.id);
    if (index >= 0) {
      this.carrito[index].cantidad++;
      this.carrito[index].subtotal = Number((this.carrito[index].cantidad * this.carrito[index].precio).toFixed(2));
    } else {
      const precio = Number(prod.precio || 0);
      this.carrito.push({
        idProducto: prod.id,
        nombre: prod.nombre,
        codigo: prod.codigo,
        precio: precio,
        cantidad: 1,
        subtotal: precio,
        unidadMedida: prod.unidadMedida || 'UNIDAD',
        stock: Number(prod.stock || 0),
        controlStock: prod.controlStock,
        categoria_nombre: prod.categoria_nombre,
        imgId: prod.imgId,
        observacion: ''
      });
    }

    if (this.pagoCon === 'EF') {
      this.montoEfectivo = this.totalVenta;
    }
  }

  cambiarCantidad(item: PosItemCarrito, delta: number): void {
    const nuevaCant = item.cantidad + delta;
    if (nuevaCant <= 0) {
      this.eliminarDelCarrito(item);
    } else {
      item.cantidad = nuevaCant;
      item.subtotal = Number((item.cantidad * item.precio).toFixed(2));
      if (this.pagoCon === 'EF') {
        this.montoEfectivo = this.totalVenta;
      }
    }
  }

  actualizarCantidadInput(item: PosItemCarrito, event: any): void {
    const val = parseFloat(event.target.value);
    if (isNaN(val) || val <= 0) {
      item.cantidad = 1;
    } else {
      item.cantidad = val;
    }
    item.subtotal = Number((item.cantidad * item.precio).toFixed(2));
    if (this.pagoCon === 'EF') {
      this.montoEfectivo = this.totalVenta;
    }
  }

  eliminarDelCarrito(item: PosItemCarrito): void {
    this.carrito = this.carrito.filter(i => i.idProducto !== item.idProducto);
    if (this.pagoCon === 'EF') {
      this.montoEfectivo = this.totalVenta;
    }
  }

  limpiarCarrito(): void {
    this.carrito = [];
    this.montoEfectivo = null;
  }

  setMedioPago(codigo: string): void {
    this.pagoCon = codigo;
    if (codigo === 'EF') {
      this.montoEfectivo = this.totalVenta;
    } else {
      this.montoEfectivo = null;
    }
  }

  setMontoSugerido(monto: number): void {
    this.montoEfectivo = monto;
  }

  get totalVenta(): number {
    const total = this.carrito.reduce((acc, curr) => acc + curr.subtotal, 0);
    return Number(total.toFixed(2));
  }

  get totalItems(): number {
    return this.carrito.reduce((acc, curr) => acc + curr.cantidad, 0);
  }

  get vuelto(): number {
    if (this.pagoCon !== 'EF' || this.montoEfectivo === null) return 0;
    const diff = this.montoEfectivo - this.totalVenta;
    return diff > 0 ? Number(diff.toFixed(2)) : 0;
  }

  get esValidoParaCobrar(): boolean {
    if (this.carrito.length === 0) return false;
    if (this.totalVenta <= 0) return false;
    if (this.pagoCon === 'EF') {
      return this.montoEfectivo !== null && this.montoEfectivo >= this.totalVenta;
    }
    return true;
  }

  guardarVenta(): void {
    if (!this.esValidoParaCobrar) {
      this.snackBar.open('Verifique el monto de cobro o agregue productos al ticket.', 'Cerrar', { duration: 3000 });
      return;
    }

    const payload = {
      montoTotal: this.totalVenta,
      pagoCon: this.pagoCon,
      montoEfectivo: this.pagoCon === 'EF' ? (this.montoEfectivo || this.totalVenta) : this.totalVenta,
      montoVuelto: this.pagoCon === 'EF' ? this.vuelto : 0,
      nombreCliente: (this.nombreCliente || '').trim() || 'CONSUMIDOR FINAL',
      idCaja: this.idCajaSeleccionada,
      idAlmacen: this.idAlmacenSeleccionado,
      detalle: this.carrito.map(item => ({
        idProducto: item.idProducto,
        cantidad: item.cantidad,
        precio: item.precio,
        observacion: item.observacion || ''
      }))
    };

    this.guardando = true;
    this.pedidoService.registrarVentaDirecta(payload).subscribe({
      next: (res) => {
        this.guardando = false;
        this.snackBar.open(res.message || 'Venta directa registrada con éxito.', 'Cerrar', { duration: 3500 });
        this.regresar(true);
      },
      error: (err) => {
        this.guardando = false;
        const msg = err.error?.message || 'Error al registrar la venta directa';
        this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
      }
    });
  }
}
