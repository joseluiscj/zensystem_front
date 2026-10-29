import { Component, Inject, OnInit } from '@angular/core';
import { MaterialModule } from '../../../material/material.module';
import { CommonModule, DecimalPipe, NgFor, NgIf } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Producto } from '../../../../model/producto';
import { map, Observable, startWith } from 'rxjs';
import { Categoria } from '../../../../model/categoria';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { GlobalService } from '../../../services/global.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ProductoService } from '../../../services/producto.service';

@Component({
  selector: 'app-producto-dialog',
  standalone: true,
  imports: [
    MaterialModule,
    MatProgressBarModule,
    NgFor, 
    NgIf, 
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    DecimalPipe
  ],
  templateUrl: './producto-dialog.component.html',
  styleUrl: './producto-dialog.component.css'
})
export class ProductoDialogComponent implements OnInit {
  basicForm!: UntypedFormGroup;
  isButtonDisabled: boolean = false;
  producto!: Producto; 
  ocultar: string = 'd-none';
  selectedFile: File | null = null;
  error: boolean = false;
  textFile: string = 'Seleccionar foto';
  file_txt: string = "";
  download_link: string = "";
  ocultar_carga = "d-none";

  unidadesMedida: string[] = [
    'UNIDAD',
    'KG',
    'GRAMO',
    'LITRO',
    'MILILITRO',
    'BOTELLA',
    'LATA',
    'CAJA',
    'PAQUETE',
    'PORCION'
  ];

  // Categoria
  ValueCategoria = new FormControl();
  filterCategoria = new FormControl();
  filteredCategoria!: Observable<any[]>;
  lst_categoria: Categoria[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public idProductoSelected: number,
    private _dialogRef: MatDialogRef<ProductoDialogComponent>,
    private globalService: GlobalService,
    private _snackbar: MatSnackBar,
    private productoService: ProductoService
  ) {}

  ngOnInit(): void {
    this.initialFrm();
    this.fnCargaCboCategoria();
    if (this.idProductoSelected) {
      this.ocultar = "";
      this.productoService.findById(this.idProductoSelected).subscribe(data => {
        if (data['code'] == 200) {
          this.producto = data['data'];
          this.ValueCategoria.setValue(this.producto.f_categoria); 
          this.initialFrm();
          this.ocultar = "d-none";
        } else {
          this._snackbar.open(data['message'], "Error!", { duration: 3000, panelClass: 'custom-snackbar' });
        }
      });
    } 
  }

  private _filterCategoria(value: string): any[] {
    if (!this.lst_categoria) return [];
    const filterValue = (value || '').toLowerCase();
    return this.lst_categoria.filter(option => (option.nombre || '').toLowerCase().includes(filterValue));
  }

  get margenEstimado(): number {
    const precio = parseFloat(this.basicForm?.get('precio')?.value || 0);
    const costo = parseFloat(this.basicForm?.get('costo')?.value || 0);
    return Math.round((precio - costo) * 100) / 100;
  }

  private initialFrm() {
    this.basicForm = new UntypedFormGroup({
      id: new UntypedFormControl(this.producto?.id),
      codigo: new UntypedFormControl(this.producto?.f_codigo || ''),
      categoria: new UntypedFormControl(this.producto?.f_categoria, [Validators.required]),
      nombre: new UntypedFormControl(this.producto?.f_nombre, [Validators.required]),
      precio: new UntypedFormControl(this.producto?.f_precio || 0, [Validators.required, Validators.min(0)]),
      costo: new UntypedFormControl(this.producto?.f_costo || 0, [Validators.min(0)]),
      stockMinimo: new UntypedFormControl(this.producto?.f_stockMinimo !== undefined ? this.producto?.f_stockMinimo : 5, [Validators.min(0)]),
      unidadMedida: new UntypedFormControl(this.producto?.f_unidadMedida || 'UNIDAD', [Validators.required]),
      descripcion: new UntypedFormControl(this.producto?.f_descripcion || ''),
    });

    if (this.producto?.f_img != "" && this.producto?.f_img != null) {
      this.download_link = this.producto.f_imgId;
      this.file_txt = this.producto.f_img;
    } 
  }

  fnCargaCboCategoria() {
    this.globalService.getCategoria().subscribe((data) => {
      this.lst_categoria = data;
      this.filteredCategoria = this.filterCategoria.valueChanges.pipe(
        startWith(''),
        map(value => this._filterCategoria(value))
      );
    });
  }

  close() {
    this._dialogRef.close();
  }

  save() {
    if (!this.validateFrm()) {
      const ObjP = new Producto();
      ObjP.id = this.idProductoSelected;
      ObjP.f_categoria = this.ValueCategoria.value;
      ObjP.f_codigo = this.basicForm.controls["codigo"].value;
      ObjP.f_nombre = this.basicForm.controls["nombre"].value;
      ObjP.f_precio = parseFloat(this.basicForm.controls["precio"].value || 0);
      ObjP.f_costo = parseFloat(this.basicForm.controls["costo"].value || 0);
      ObjP.f_stockMinimo = parseFloat(this.basicForm.controls["stockMinimo"].value || 5);
      ObjP.f_unidadMedida = this.basicForm.controls["unidadMedida"].value;
      ObjP.f_descripcion = this.basicForm.controls["descripcion"].value;
      ObjP.f_img = this.file_txt;
      ObjP.f_imgId = this.download_link;

      if (!ObjP.id) { // create
        this.productoService.save(ObjP).subscribe((data) => {
          if (data['code'] == 200) {
            this._snackbar.open("Producto registrado correctamente", "Correcto!", { duration: 3000, panelClass: 'custom-snackbar' });
            this.productoService.findAll().subscribe((data) => {
              this.productoService.setDataChange(data);
              this.close();
            });
          } else {
            this._snackbar.open(data['message'] || 'Error al guardar', "Error!", { duration: 3000, panelClass: 'custom-snackbar' });
          }
        });
      } else { // update
        this.productoService.update(ObjP.id, ObjP).subscribe(data => {
          if (data['code'] == 200) {
            this._snackbar.open("Producto actualizado correctamente", "Correcto!", { duration: 3000, panelClass: 'custom-snackbar' });
            this.productoService.findAll().subscribe((data) => {
              this.productoService.setDataChange(data);
              this.close();
            });
          } else {
            this._snackbar.open(data['message'] || 'Error al actualizar', "Error!", { duration: 3000, panelClass: 'custom-snackbar' });
          }
        });
      }
    } 
  }

  validateFrm(): boolean {
    this.error = false;
    if ((this.basicForm.controls["nombre"].value)?.trim() == "" || (this.basicForm.controls["nombre"].value) == null) {
      this._snackbar.open("Debe ingresar Nombre del producto", "Aviso!", { duration: 3000 });
      this.error = true;
      return true;
    }
    if (!this.ValueCategoria.value) {
      this._snackbar.open("Debe seleccionar Categoría", "Aviso!", { duration: 3000 });
      this.error = true;
      return true;
    }
    return this.error;
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    this.ocultar_carga = '';
    if (target.files && target.files.length > 0) {
      this.selectedFile = target.files[0];
      this.textFile = this.selectedFile.name;
      const formData = new FormData();
      formData.append('file', this.selectedFile, this.selectedFile.name);
      this.productoService.saveFile(formData).subscribe((data) => {
        if (data.code == 200) {
          this.ocultar_carga = 'd-none';
          this.download_link = data.download_link;
          this.file_txt = data.file_name;
        }
      });
    }
  }

  triggerFileInput() {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  delteFile() {
    this.download_link = "";
    this.file_txt = "";
  }
}
