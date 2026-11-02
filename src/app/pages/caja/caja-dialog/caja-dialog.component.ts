import { Component, Inject, OnInit } from '@angular/core';
import { MaterialModule } from '../../../material/material.module';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
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
  isButtonDisabled: boolean = false;
  caja: Caja;
  check_principal: boolean = false;
  listTipoCaja: CajaTipo[] = [];
  selecteTipoCaja: number = 0;

  listSucursal: Sucursal[] = [];
  selecteSucursal: number = 0;

  listCajasDestino: any[] = [];

  error: boolean = false;
  ocultar: boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) private _idCaja: number,
    private _dialogRef: MatDialogRef<CajaDialogComponent>,
    private cajaService: CajaService,
    private globalService: GlobalService,
    private _snackbar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'auto' }); 
    this.initialFrm();

    this.cajaService.listCbo().subscribe((data) => {
      if (data['code'] === 200) {
        this.listTipoCaja = data['data'];
      } else {
        this._snackbar.open(data['message'], "Error!", { duration: 6000, panelClass: 'custom-snackbar' });
      }
    });

    this.globalService.listSucursal().subscribe((data) => {
      if (data['code'] === 200) {
        this.listSucursal = data['data'];
      } else {
        this._snackbar.open(data['message'], "Error!", { duration: 6000, panelClass: 'custom-snackbar' });
      }
    });

    this.cargarCajasDestino();

    if (this._idCaja) {
      this.ocultar = true;
      this.cajaService.findById(this._idCaja).subscribe(data => {
        if (data['code'] === 200) {
          this.caja = data['data'];
          this.check_principal = Number(this.caja?.f_principal) === 1;
          this.initialFrm();
          this.ocultar = false;
        } else {
          this._snackbar.open(data['message'], "Error!", { duration: 3000, panelClass: 'custom-snackbar' });
        }
      });
    }
  }

  cargarCajasDestino(): void {
    this.cajaService.listCajasDisponiblesCbo(this._idCaja).subscribe({
      next: (res) => {
        if (res && res.code === 200) {
          this.listCajasDestino = res.data || [];
          // Si no tiene configurada caja destino y hay una principal, sugerirla
          if (!this._idCaja && this.listCajasDestino.length > 0) {
            const principal = this.listCajasDestino.find(c => c.principal === 1);
            if (principal) {
              if (!this.basicForm.controls['idCajaDestinoEfectivo'].value) {
                this.basicForm.controls['idCajaDestinoEfectivo'].setValue(principal.id);
              }
              if (!this.basicForm.controls['idCajaDestinoTarjeta'].value) {
                this.basicForm.controls['idCajaDestinoTarjeta'].setValue(principal.id);
              }
            }
          }
        }
      }
    });
  }

  private initialFrm() {
    this.basicForm = new UntypedFormGroup({
      id: new UntypedFormControl(this.caja?.id ?? 0),
      nombre: new UntypedFormControl(this.caja?.f_nombre, [Validators.required]),
      saldo: new UntypedFormControl(this.caja?.f_saldo ?? '0.00', [Validators.required]),
      moneda: new UntypedFormControl(this.caja?.f_moneda ?? 'DOLAR', [Validators.required]),
      medioPago: new UntypedFormControl(this.caja?.f_medioPago ?? 'EF', [Validators.required]),
      sucursal: new UntypedFormControl(this.caja?.f_sucursal, [Validators.required]),
      cajaTipo: new UntypedFormControl(this.caja?.f_cajaTipo, [Validators.required]),
      principal: new UntypedFormControl(this.check_principal),
      idCajaDestinoEfectivo: new UntypedFormControl(this.caja?.f_idCajaDestinoEfectivo || null),
      idCajaDestinoTarjeta: new UntypedFormControl(this.caja?.f_idCajaDestinoTarjeta || null),
    });

    if (this.caja?.f_sucursal) {
      this.selecteSucursal = Number(this.caja.f_sucursal);
    }
    if (this.caja?.f_cajaTipo) {
      this.selecteTipoCaja = Number(this.caja.f_cajaTipo);
    }
  }

  onPrincipalChange(event: any): void {
    this.check_principal = event.checked;
    if (this.check_principal) {
      this.basicForm.controls['idCajaDestinoEfectivo'].setValue(null);
      this.basicForm.controls['idCajaDestinoTarjeta'].setValue(null);
    }
  }

  close() {
    this._dialogRef.close();
  }

  save() { 
    if (!this.validateFrm()) {
      this.isButtonDisabled = true;
      const obj = new Caja();
      obj.id = this._idCaja;
      obj.f_sucursal = this.basicForm.controls["sucursal"].value;
      obj.f_nombre = this.basicForm.controls["nombre"].value;
      obj.f_cajaTipo = this.basicForm.controls["cajaTipo"].value;
      obj.f_saldo = this.basicForm.controls["saldo"].value;
      obj.f_moneda = this.basicForm.controls["moneda"].value;
      obj.f_medioPago = this.basicForm.controls["medioPago"].value;
      obj.f_principal = this.check_principal ? 1 : 0;
      obj.f_idCajaDestinoEfectivo = !this.check_principal ? (this.basicForm.controls["idCajaDestinoEfectivo"].value || null) : null;
      obj.f_idCajaDestinoTarjeta = !this.check_principal ? (this.basicForm.controls["idCajaDestinoTarjeta"].value || null) : null;

      this.cajaService.save(obj).subscribe({
        next: (data: any) => {
          if (data['code'] === 200) {
            this._snackbar.open("Caja registrada y configurada correctamente", "Correcto!", { duration: 3000, panelClass: 'custom-snackbar' });
            this.cajaService.findAllList().subscribe((listData: any) => {
              this.cajaService.setDataChange(listData);
              this.close();
            });
          } else {
            this.isButtonDisabled = false;
            this._snackbar.open(data['message'] || 'Error al guardar', "Error!", { duration: 6000, panelClass: 'custom-snackbar' });
          }
        },
        error: () => {
          this.isButtonDisabled = false;
          this._snackbar.open("Error de conexión al guardar", "Error!", { duration: 6000, panelClass: 'custom-snackbar' });
        }
      });
    }
  }

  validateFrm(): boolean {
    this.error = false;
    if (!this.basicForm.controls["sucursal"].value) {
      this._snackbar.open("Debe seleccionar Sucursal", "Aviso!", { duration: 3000 });
      this.error = true;
      return this.error;
    }
    if (!(this.basicForm.controls["nombre"].value)?.trim()) {
      this._snackbar.open("Debe ingresar Nombre de la Caja", "Aviso!", { duration: 3000 });
      this.error = true;
      return this.error;
    }
    if (!this.basicForm.controls["cajaTipo"].value) {
      this._snackbar.open("Debe seleccionar Tipo de Caja", "Aviso!", { duration: 3000 });
      this.error = true;
      return this.error;
    }
    if (this.basicForm.controls["saldo"].value === "" || this.basicForm.controls["saldo"].value === null) {
      this._snackbar.open("Debe ingresar Saldo", "Aviso!", { duration: 3000 });
      this.error = true;
      return this.error;
    }
    if (!this.basicForm.controls["moneda"].value) {
      this._snackbar.open("Debe seleccionar Moneda", "Aviso!", { duration: 3000 });
      this.error = true;
      return this.error;
    }
    if (!this.basicForm.controls["medioPago"].value) {
      this._snackbar.open("Debe seleccionar Medio de Pago", "Aviso!", { duration: 3000 });
      this.error = true;
      return this.error;
    }
    return this.error;
  }
}
