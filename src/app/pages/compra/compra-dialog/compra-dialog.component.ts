import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MaterialModule } from '../../../material/material.module';
import {
  AlmacenCatalogo,
  CajaCatalogo,
  CompraService,
  GuardarCompraPayload,
  ProductoCatalogo
} from '../../../services/compra.service';

export interface DetalleCompraItemForm {
  idProducto: number;
  nombre: string;
  codigo: string;
  unidadMedida: string;
  categoria: string;
  stockActual: number;
  cantidad: number;
  costoUnitario: number;
  subtotal: number;
  actualizarCostoProducto: boolean;
}

@Component({
  selector: 'app-compra-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    MatProgressBarModule,
    FormsModule,
    ReactiveFormsModule,
    DecimalPipe
  ],
  templateUrl: './compra-dialog.component.html',
  styleUrls: ['./compra-dialog.component.scss']
})
export class CompraDialogComponent implements OnInit {
  compraForm!: UntypedFormGroup;
  cargando: boolean = false;
  guardando: boolean = false;

  almacenes: AlmacenCatalogo[] = [];
  cajas: CajaCatalogo[] = [];
  productos: ProductoCatalogo[] = [];
  proximoCodigo: string = 'COM-00001';

  // Control de búsqueda y filtrado de productos
  filtroProducto: string = '';
  categoriaSeleccionada: string = 'Todas';
  categorias: string[] = ['Todas'];
  productosFiltrados: ProductoCatalogo[] = [];
  mostrarPanelProductos: boolean = true;

  // Lista de detalles agregados a la compra
  detalles: DetalleCompraItemForm[] = [];

  tiposComprobante = [
    { codigo: 'FACTURA', nombre: 'Factura' },
    { codigo: 'BOLETA', nombre: 'Boleta' },
    { codigo: 'NOTA_VENTA', nombre: 'Nota de Venta' },
    { codigo: 'GUIA', nombre: 'Guía de Remisión' },
    { codigo: 'TICKET', nombre: 'Ticket / Comprobante' },
    { codigo: 'RECIBO', nombre: 'Recibo' }
  ];

  metodosPago = [
    { codigo: 'EF', nombre: 'Efectivo' },
    { codigo: 'TA', nombre: 'Tarjeta Débito / Crédito' },
    { codigo: 'TR', nombre: 'Transferencia / Yape / Plin' },
    // { codigo: 'CR', nombre: 'A Crédito / Por pagar' },
    // { codigo: 'NINGUNO', nombre: 'Sin movimiento de dinero' }
  ];

  constructor(
    public dialogRef: MatDialogRef<CompraDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: UntypedFormBuilder,
    private compraService: CompraService,
    private snackBar: MatSnackBar
  ) {}

  private formatFechaLocal(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  ngOnInit(): void {
    const hoy = this.formatFechaLocal(new Date());

    this.compraForm = this.fb.group({
      proveedorNombre: ['', [Validators.required, Validators.maxLength(255)]],
      proveedorDocumento: ['', [Validators.maxLength(30)]],
      tipoComprobante: ['FACTURA', [Validators.required]],
      nroComprobante: ['', [Validators.maxLength(60)]],
      fechaCompra: [hoy, [Validators.required]],
      idAlmacen: [null, [Validators.required]],
      idCaja: [null],
      metodoPago: ['EF', [Validators.required]],
      nroOperacion: [''],
      observaciones: ['']
    });

    this.cargarCatalogos();
  }

  cargarCatalogos(): void {
    this.cargando = true;
    this.compraService.getCatalogoApoyo().subscribe({
      next: (res) => {
        this.cargando = false;
        if (res.code === 200 && res.data) {
          this.almacenes = res.data.almacenes || [];
          this.cajas = res.data.cajas || [];
          this.productos = (res.data.productos || []).filter(p => Number(p.controlStock) === 1);
          this.proximoCodigo = res.data.proximoCodigo || 'COM-00001';

          // Extraer categorías únicas
          const catSet = new Set<string>();
          this.productos.forEach(p => {
            if (p.categoria && p.categoria.trim()) {
              catSet.add(p.categoria.trim());
            }
          });
          this.categorias = ['Todas', ...Array.from(catSet)];

          this.buscarProductos();

          // Seleccionar almacén principal por defecto
          const principal = this.almacenes.find(a => a.esPrincipal == 1) || this.almacenes[0];
          if (principal) {
            this.compraForm.patchValue({ idAlmacen: principal.idAlmacen });
          }

          // Seleccionar primera caja activa si existe
          if (this.cajas.length > 0) {
            const cajaDefecto = this.cajas.find(c => c.principal == 1) || this.cajas[0];
            this.compraForm.patchValue({ idCaja: cajaDefecto.idCaja });
          }
        }
      },
      error: () => {
        this.cargando = false;
        this.snackBar.open('Error al cargar catálogos de compras', 'Cerrar', { duration: 3000 });
      }
    });
  }

  buscarProductos(): void {
    const term = this.filtroProducto.toLowerCase().trim();

    this.productosFiltrados = this.productos.filter(p => {
      // Filtro por categoría
      const coincideCat = this.categoriaSeleccionada === 'Todas' ||
        (p.categoria && p.categoria.toLowerCase() === this.categoriaSeleccionada.toLowerCase());

      // Filtro por texto
      const coincideTexto = !term ||
        p.nombre.toLowerCase().includes(term) ||
        (p.codigo && p.codigo.toLowerCase().includes(term)) ||
        (p.categoria && p.categoria.toLowerCase().includes(term));

      return coincideCat && coincideTexto;
    });
  }

  seleccionarCategoria(cat: string): void {
    this.categoriaSeleccionada = cat;
    this.buscarProductos();
  }

  limpiarBusqueda(): void {
    this.filtroProducto = '';
    this.categoriaSeleccionada = 'Todas';
    this.buscarProductos();
  }

  togglePanelProductos(): void {
    this.mostrarPanelProductos = !this.mostrarPanelProductos;
  }

  onSelectProductoDirecto(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const id = Number(select.value);
    if (id) {
      const prod = this.productos.find(p => p.idProducto === id);
      if (prod) {
        this.agregarProducto(prod);
      }
      select.value = ''; // Reset select to placeholder
    }
  }

  agregarProducto(producto: ProductoCatalogo): void {
    // Si ya existe en la lista, incrementar cantidad
    const existente = this.detalles.find(d => d.idProducto === producto.idProducto);
    if (existente) {
      existente.cantidad = Number((existente.cantidad + 1).toFixed(2));
      this.recalcularFila(existente);
      this.snackBar.open(`Cantidad de "${producto.nombre}" aumentada a ${existente.cantidad}`, 'OK', { duration: 1500 });
    } else {
      const nuevoDetalle: DetalleCompraItemForm = {
        idProducto: producto.idProducto,
        nombre: producto.nombre,
        codigo: producto.codigo || '',
        unidadMedida: producto.unidadMedida || 'UNIDAD',
        categoria: producto.categoria || 'General',
        stockActual: Number(producto.stock) || 0,
        cantidad: 1,
        costoUnitario: Number(producto.costo) > 0 ? Number(producto.costo) : (Number(producto.precio) > 0 ? Number((producto.precio * 0.7).toFixed(2)) : 0),
        subtotal: 0,
        actualizarCostoProducto: true
      };
      this.recalcularFila(nuevoDetalle);
      this.detalles.push(nuevoDetalle);
      this.snackBar.open(`✓ "${producto.nombre}" agregado a la compra`, 'OK', { duration: 1500 });
    }
  }

  contarPorCategoria(cat: string): number {
    if (cat === 'Todas') return this.productos.length;
    return this.productos.filter(p => p.categoria && p.categoria.toLowerCase() === cat.toLowerCase()).length;
  }

  recalcularFila(det: DetalleCompraItemForm): void {
    const cant = Number(det.cantidad) || 0;
    const costo = Number(det.costoUnitario) || 0;
    det.subtotal = Math.round(cant * costo * 100) / 100;
  }

  eliminarFila(index: number): void {
    this.detalles.splice(index, 1);
  }

  get totalCompra(): number {
    return this.detalles.reduce((acc, curr) => acc + (Number(curr.subtotal) || 0), 0);
  }

  get subtotalSinIgv(): number {
    const tipo = this.compraForm?.get('tipoComprobante')?.value;
    if (tipo === 'FACTURA') {
      return Math.round((this.totalCompra / 1.18) * 100) / 100;
    }
    return this.totalCompra;
  }

  get igvMonto(): number {
    const tipo = this.compraForm?.get('tipoComprobante')?.value;
    if (tipo === 'FACTURA') {
      return Math.round((this.totalCompra - this.subtotalSinIgv) * 100) / 100;
    }
    return 0;
  }

  get cajaSeleccionada(): CajaCatalogo | null {
    const id = this.compraForm?.get('idCaja')?.value;
    if (!id) return null;
    return this.cajas.find(c => c.idCaja == id) || null;
  }

  get requiereCaja(): boolean {
    const metodo = this.compraForm?.get('metodoPago')?.value;
    const idCaja = this.compraForm?.get('idCaja')?.value;
    return Boolean(idCaja && ['EF', 'TA', 'TR'].includes(metodo));
  }

  get saldoCajaInsuficiente(): boolean {
    if (!this.requiereCaja || !this.cajaSeleccionada) return false;
    const saldo = Number(this.cajaSeleccionada.saldo) || 0;
    return this.totalCompra > saldo;
  }

  get saldoFaltante(): number {
    if (!this.saldoCajaInsuficiente || !this.cajaSeleccionada) return 0;
    const saldo = Number(this.cajaSeleccionada.saldo) || 0;
    return Math.round((this.totalCompra - saldo) * 100) / 100;
  }

  guardar(): void {
    if (this.compraForm.invalid) {
      this.compraForm.markAllAsTouched();
      this.snackBar.open('Complete los campos obligatorios del proveedor y comprobante', 'Aceptar', { duration: 3000 });
      return;
    }

    if (this.detalles.length === 0) {
      this.snackBar.open('Debe agregar al menos un producto a la compra', 'Aceptar', { duration: 3000 });
      return;
    }

    // Validar saldo suficiente en caja si el método de pago descuenta de caja
    if (this.saldoCajaInsuficiente && this.cajaSeleccionada) {
      const saldo = Number(this.cajaSeleccionada.saldo) || 0;
      this.snackBar.open(
        `Saldo insuficiente en la caja "${this.cajaSeleccionada.nombre}". Saldo disponible: S/ ${saldo.toFixed(2)}, Requerido: S/ ${this.totalCompra.toFixed(2)}. Faltan S/ ${this.saldoFaltante.toFixed(2)}.`,
        'Entendido',
        { duration: 6000 }
      );
      return;
    }

    // Validar cantidades y costos
    for (const d of this.detalles) {
      if (d.cantidad <= 0) {
        this.snackBar.open(`La cantidad de "${d.nombre}" debe ser mayor a 0`, 'Aceptar', { duration: 3000 });
        return;
      }
      if (d.costoUnitario < 0) {
        this.snackBar.open(`El costo unitario de "${d.nombre}" no puede ser negativo`, 'Aceptar', { duration: 3000 });
        return;
      }
    }

    const fv = this.compraForm.value;

    const payload: GuardarCompraPayload = {
      proveedorNombre: fv.proveedorNombre,
      proveedorDocumento: fv.proveedorDocumento || null,
      tipoComprobante: fv.tipoComprobante,
      nroComprobante: fv.nroComprobante || null,
      fechaCompra: fv.fechaCompra,
      idAlmacen: fv.idAlmacen,
      idCaja: fv.idCaja || null,
      metodoPago: fv.metodoPago,
      nroOperacion: fv.nroOperacion || null,
      observaciones: fv.observaciones || null,
      detalles: this.detalles.map(d => ({
        idProducto: d.idProducto,
        cantidad: Number(d.cantidad),
        costoUnitario: Number(d.costoUnitario),
        actualizarCostoProducto: d.actualizarCostoProducto
      }))
    };

    this.guardando = true;
    this.compraService.guardarCompra(payload).subscribe({
      next: (res) => {
        this.guardando = false;
        if (res.code === 200) {
          this.snackBar.open(res.message || 'Compra registrada exitosamente', 'Cerrar', { duration: 4000 });
          this.dialogRef.close(true);
        } else {
          this.snackBar.open(res.message || 'Error al registrar compra', 'Cerrar', { duration: 4000 });
        }
      },
      error: (err) => {
        this.guardando = false;
        const msg = err?.error?.message || 'Error al conectar con el servidor al registrar compra.';
        this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
      }
    });
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }
}
