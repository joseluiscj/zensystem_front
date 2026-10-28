import { Component, Inject, OnInit, AfterViewInit } from '@angular/core';
import { MaterialModule } from '../../../../material/material.module';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { map, Observable, startWith } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Categoria } from '../../../../../model/categoria';
import { GlobalService } from '../../../../services/global.service';
import { MatSelectChange } from '@angular/material/select';
import { ProductoService } from '../../../../services/producto.service';
import { Producto } from '../../../../../model/producto';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-restaurante-dialog-detalle',
  standalone: true,
  imports: [
    MaterialModule,
    NgFor, 
    NgIf,
    ReactiveFormsModule,
    FormsModule,
    CommonModule
  ],
  templateUrl: './restaurante-dialog-detalle.component.html',
  styleUrl: './restaurante-dialog-detalle.component.css'
})
export class RestauranteDialogDetalleComponent implements OnInit {

  basicForm: UntypedFormGroup;
  isButtonDisabled:boolean=false;
  //tipo 
  // ValueTipo = new FormControl();
  // filterTipo = new FormControl();
  // filteredTipo: Observable<any[]>;
  // lst_tipo: Tipo[];
  //
  //categoria
  ValueCategoria = new FormControl();
  filterCategoria = new FormControl();
  filteredCategoria: Observable<any[]>;
  lst_categoria: Categoria[];
  //
  //producto
  ValueProducto = new FormControl();
  filterProducto = new FormControl();
  filteredProducto: Observable<any[]>;
  lst_producto: Producto[];

  ft_download_link:string;
  ft_descripcion:string;

  ft_categoria:string | number;
  ft_producto:string | number;
  ft_precio:string | number;
  ft_cantidad:string | number;
  ft_observacion:string | number;
  ft_txtCategoria:string;
  ft_txtProducto:string | number;

  productox: Producto | null;
  error:boolean=false;

  // productoRes:Producto;
  primerCambio:number=0;

  constructor(
    @Inject(MAT_DIALOG_DATA) private productoRes: any,
    private _dialogRef: MatDialogRef<RestauranteDialogDetalleComponent>,
    // private _dialog:MatDialog,
    private globalService: GlobalService,
    private productoService:ProductoService,
    private _snackbar: MatSnackBar,
  ){}
  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'auto' });
    this.productox = this.resolveProductoFromData();
    // this.populateFieldsFromProducto();
    console.log(this.productox)
    this.initialFrm();
    this.fnCargaCboCategoria();
    this.ValueCategoria.valueChanges.subscribe((value) => {
      this.basicForm.controls["categoria"].setValue(value);
      this.ft_txtCategoria = this.lst_categoria?.find(x => x.id == value)?.nombre;
      this.basicForm.controls["precio"].setValue("");
      let datax = {
        idCategoria: value
      }
      this.productoService.productoCbo(datax).subscribe({
        next: (data2: any) => {
          if (data2 && data2['code'] == 200) {
            this.lst_producto = data2['data'] || [];
            this.filteredProducto = this.filterProducto.valueChanges.pipe(
              startWith(''),
              map(val => this._filterProducto(val))
            );
            if (this.productox?.f_categoria == value && this.productox?.f_producto) {
              const selectedProduct = this.lst_producto.find(item => item.id == this.productox.f_producto);
              const selectedValue = selectedProduct ? selectedProduct.id : this.productox.f_producto;
              this.basicForm.controls["producto"].setValue(selectedValue);
              this.ValueProducto.setValue(selectedValue);
            }
          } else {
            this._snackbar.open(data2?.['message'] || 'No se pudieron cargar los productos', "Error!", { duration: 4000, panelClass: 'custom-snackbar' });
          }
        },
        error: (err: any) => {
          this._snackbar.open(err?.error?.message || 'Error al consultar productos de la categoría', "Error!", { duration: 4000, panelClass: 'custom-snackbar' });
        }
      }) 
    });
    this.ValueProducto.valueChanges.subscribe((data) => {
      this.basicForm.controls["producto"].setValue(data);
      this.ft_txtProducto = this.lst_producto?.find(x => x.id == data)?.nombre;
      let datax = {
        idProducto: this.ValueProducto.value
      }
      this.productoService.productoInfo(datax).subscribe({
        next: (data3: any) => {
          if (data3 && data3['code'] == 200) {
            let productoInfo = data3['data'];
            this.ft_categoria = productoInfo?.f_categoria;
            this.ft_producto = productoInfo?.f_nombre;
            this.ft_precio = productoInfo?.f_precio;
            this.ft_download_link = productoInfo?.f_download_link;
            this.ft_descripcion = productoInfo?.f_descripcion;
            if (this.primerCambio < 2) {
              this.primerCambio++;
              this.basicForm.controls["precio"].setValue(this.productox?.f_precio ? this.productox?.f_precio : productoInfo?.f_precio);
            } else {
              this.basicForm.controls["precio"].setValue(productoInfo?.f_precio);
            }
            if (this.productox?.f_cantidad) {
              this.basicForm.controls["cantidad"].setValue(this.productox?.f_cantidad);
            } else {
              if (!this.basicForm.controls["cantidad"].value) {
                this.basicForm.controls["cantidad"].setValue(productoInfo?.f_cantidad ?? 1);
              }
            }
            if (this.productox?.f_observacion) {
              this.basicForm.controls["observacion"].setValue(this.productox?.f_observacion ?? '');
            }
          } else {
            this._snackbar.open(data3?.['message'] || 'No se pudo obtener información del producto', "Error!", { duration: 4000, panelClass: 'custom-snackbar' });
          }
        },
        error: (err: any) => {
          this._snackbar.open(err?.error?.message || 'Error al obtener información del producto', "Error!", { duration: 4000, panelClass: 'custom-snackbar' });
        }
      }); 
    });
  }
  private resolveProductoFromData(): Producto | null {
    if (!this.productoRes) {
      return null;
    }
    if (Array.isArray(this.productoRes) && this.productoRes.length > 0) {
      return this.productoRes[0];
    }
    if (this.productoRes?.producto) {
      const productoData = this.productoRes.producto;
      if (Array.isArray(productoData) && productoData.length > 0) {
        return productoData[0];
      }
      return productoData as Producto;
    }
    return this.productoRes as Producto;
  } 
  private applyInitialSelection(): void {
    if (this.productox?.f_categoria) {
      this.ValueCategoria.setValue(this.productox.f_categoria);
      this.basicForm.controls["categoria"].setValue(this.productox.f_categoria);
      this.ft_txtCategoria = this.lst_categoria?.find(x => x.id == this.productox.f_categoria)?.nombre;
    }

    if (this.productox?.f_producto) {
      this.ValueProducto.setValue(this.productox.f_producto);
      this.basicForm.controls["producto"].setValue(this.productox.f_producto);
    }
  }
  private initialFrm(){
    this.basicForm = new UntypedFormGroup({
      id: new UntypedFormControl(this.productox?.id ?? 0),
      categoria: new UntypedFormControl(this.ValueCategoria.value ?? this.productox?.f_categoria),
      producto: new UntypedFormControl(this.ValueProducto.value ?? this.productox?.f_producto),
      precio: new UntypedFormControl(this.ft_precio,[Validators.required]),
      cantidad: new UntypedFormControl(this.ft_cantidad?this.ft_cantidad:1,[Validators.required]),
      observacion: new UntypedFormControl(this.ft_observacion),
    });
  }
  private _filterCategoria(value: string): any[] {
    if (!this.lst_categoria) return [];
    const filterValue = (value || '').toLowerCase();
    return this.lst_categoria.filter(option => (option?.nombre || '').toLowerCase().includes(filterValue));
  }
  fnCargaCboCategoria(){
    this.globalService.getCategoria().subscribe((data) => {
      this.lst_categoria = data;
      this.filteredCategoria = this.filterCategoria.valueChanges.pipe(
        startWith(''),
        map(value => this._filterCategoria(value))
      );
      if (this.productox?.f_categoria) {
        this.applyInitialSelection();
      }
    })
  }
  private _filterProducto(value: string): any[] {
    if (!this.lst_producto) return [];
    const filterValue = (value || '').toLowerCase();
    return this.lst_producto.filter(option => (option?.nombre || '').toLowerCase().includes(filterValue));
  }
  close(){
    this._dialogRef.close();
  }
  save(){
    if(!this.validateFrm()){
      this.isButtonDisabled = true;
      let data = {
        id: this.basicForm.controls["id"].value,
        f_categoria: this.basicForm.controls["categoria"].value,
        f_producto: this.basicForm.controls["producto"].value,
        f_precio: this.basicForm.controls["precio"].value,
        f_cantidad: this.basicForm.controls["cantidad"].value,
        f_observacion: this.basicForm.controls["observacion"].value,
        f_download_link: this.ft_download_link,
        f_txtCategoria: this.ft_txtCategoria,
        f_txtProducto: this.ft_txtProducto,
        f_subTotal: (this.basicForm.controls["precio"].value * this.basicForm.controls["cantidad"].value)
      }
      this._dialogRef.close(data);
    }
  }
  sumarCantidad(): void {
    const actual = Number(this.basicForm.controls["cantidad"].value || 1);
    this.basicForm.controls["cantidad"].setValue(actual + 1);
  }

  restarCantidad(): void {
    const actual = Number(this.basicForm.controls["cantidad"].value || 1);
    if (actual > 1) {
      this.basicForm.controls["cantidad"].setValue(actual - 1);
    }
  }

  get subtotalPreview(): number {
    const precio = parseFloat(this.basicForm.controls["precio"].value || 0);
    const cantidad = parseFloat(this.basicForm.controls["cantidad"].value || 0);
    return Math.round(precio * cantidad * 100) / 100;
  }

  agregarNotaRapida(nota: string): void {
    const actual = (this.basicForm.controls['observacion'].value || '').trim();
    if (actual) {
      if (!actual.toLowerCase().includes(nota.toLowerCase())) {
        this.basicForm.controls['observacion'].setValue(`${actual}, ${nota}`);
      }
    } else {
      this.basicForm.controls['observacion'].setValue(nota);
    }
  }

  validateFrm() :boolean{
    this.error = false;
    if(!this.ValueCategoria.value){
      this._snackbar.open("Debe ingresar Categoria", "Aviso!",{duration:3000});
      this.error = true;
    }
    if(!this.ValueProducto.value){
      this._snackbar.open("Debe ingresar Producto", "Aviso!",{duration:3000});
      this.error = true;
    }
    if((this.basicForm.controls["precio"].value) == "" || (this.basicForm.controls["precio"].value) == null){
      this._snackbar.open("Debe ingresar Precio", "Aviso!",{duration:3000});
      this.error = true;
    }
    if((this.basicForm.controls["cantidad"].value) == "" || (this.basicForm.controls["cantidad"].value) == null){
      this._snackbar.open("Debe ingresar cantidad", "Aviso!",{duration:3000});
      this.error = true;
    }

    return this.error;
  }
}
