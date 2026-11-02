import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MaterialModule } from '../../../material/material.module';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GlobalService } from '../../../services/global.service';
import { UserService } from '../../../services/user.service';
import { User } from '../../../../model/user';

@Component({
  selector: 'app-usuario-dialog',
  standalone: true,
  imports: [MaterialModule, NgIf, ReactiveFormsModule, MatRadioModule, MatSlideToggleModule, FormsModule, CommonModule],
  templateUrl: './usuario-dialog.component.html',
  styleUrl: './usuario-dialog.component.css'
})
export class UsuarioDialogComponent implements OnInit {
  ocultar: string = "";
  basicForm: UntypedFormGroup;
  error: boolean = false;
  roles: any[] = [];
  isButtonDisabled: boolean = false;
  isInputDisabled: boolean = false;
  panelContrasena: boolean = false;
  actualizar: boolean = false;
  verTodo: boolean = true;

  constructor(
    @Inject(MAT_DIALOG_DATA) public _id: number,
    private _dialogRef: MatDialogRef<UsuarioDialogComponent>,
    private _snackbar: MatSnackBar,
    private userServeice: UserService,
    private globalService: GlobalService
  ){} 

  ngOnInit(): void {
    this.initialFrm();
    
    this.globalService.getCboRol().subscribe({
      next: (data) => {
        if(data && (data['code'] == 200 || Array.isArray(data['data']))){
          this.roles = data['data'] || [];
        }
      },
      error: () => {
        this._snackbar.open('Error al cargar perfiles', 'Cerrar', { duration: 3000 });
      }
    });

    if(this._id){
      this.actualizar = true;
      this.ocultar = "";
      this.userServeice.findById(this._id).subscribe({
        next: (res: any) => {
          this.ocultar = 'd-none';
          if(res && res['code'] == 200 && res['data']){
            this.initialFrm(res['data']);
          }
        },
        error: () => {
          this.ocultar = 'd-none';
          this._snackbar.open('Error al obtener datos del usuario', 'Cerrar', { duration: 3000 });
        }
      });
    } else {
      this.ocultar = 'd-none';
      this.actualizar = false;
    }
  }

  private initialFrm(usuario?: any): void {
    this.basicForm = new UntypedFormGroup({
      id: new UntypedFormControl(usuario?.id || 0),
      nroDocumento: new UntypedFormControl(usuario?.nroDocumento || usuario?.f_nroDocumento || '', [
        Validators.required, 
        Validators.minLength(1), 
        Validators.maxLength(20)
      ]),
      nombres: new UntypedFormControl(usuario?.nombres || usuario?.f_nombres || usuario?.nombre || '', [
        Validators.required, 
        Validators.minLength(1), 
        Validators.maxLength(100)
      ]),
      apellidoPaterno: new UntypedFormControl(usuario?.apellidoPaterno || usuario?.f_apellidoPaterno || usuario?.apellidos || '', [
        Validators.required, 
        Validators.minLength(1), 
        Validators.maxLength(100)
      ]),
      apellidoMaterno: new UntypedFormControl(usuario?.apellidoMaterno || usuario?.f_apellidoMaterno || '', [
        Validators.maxLength(100)
      ]),
      correo: new UntypedFormControl(usuario?.correo || usuario?.f_correo || usuario?.email || '', [
        Validators.email, 
        Validators.maxLength(80)
      ]),
      telefono: new UntypedFormControl(usuario?.telefono || usuario?.f_telefono || '', [
        Validators.maxLength(100)
      ]),
      rol: new UntypedFormControl(usuario?.idRol ? usuario.idRol.toString() : (usuario?.f_idRol ? usuario.f_idRol.toString() : '3'), [
        Validators.required
      ]),
      pass1: new UntypedFormControl(''),
      pass2: new UntypedFormControl(''),
    });

    if(this._id && (usuario?.nroDocumento || usuario?.f_nroDocumento)){
      this.isInputDisabled = true;
    }
  }

  save(): void {
    if(this.validateFrm()){
      return;
    }

    this.isButtonDisabled = true;
    const fVals = this.basicForm.value;

    const nroDoc = (fVals.nroDocumento || '').trim();
    const nombres = (fVals.nombres || '').trim();
    const paterno = (fVals.apellidoPaterno || '').trim();
    const materno = (fVals.apellidoMaterno || '').trim();
    const apellidos = `${paterno} ${materno}`.trim();
    const correo = (fVals.correo || '').trim();
    const telefono = (fVals.telefono || '').trim();
    const rolId = Number(fVals.rol);
    const pass = (this.panelContrasena && fVals.pass1) ? fVals.pass1.trim() : '';

    const payload: any = {
      id: this._id || undefined,
      nroDocumento: nroDoc,
      f_nroDocumento: nroDoc,
      nombre: nombres,
      nombres: nombres,
      f_nombres: nombres,
      apellidos: apellidos,
      f_apellidos: apellidos,
      apellidoPaterno: paterno,
      f_apellidoPaterno: paterno,
      apellidoMaterno: materno,
      f_apellidoMaterno: materno,
      correo: correo,
      f_correo: correo,
      email: correo,
      telefono: telefono,
      f_telefono: telefono,
      idRol: rolId,
      f_idRol: rolId,
      rol: rolId,
      password: pass,
      f_password: pass
    };

    if(this._id){
      // Actualizar usuario existente
      this.userServeice.update(this._id, payload).subscribe({
        next: (data: any) => {
          this.isButtonDisabled = false;
          if(data && (data['code'] == 200 || data['code'] === undefined)){
            this._snackbar.open("Usuario actualizado correctamente", "Correcto!", { duration: 3000, panelClass: 'custom-snackbar' });
            this.userServeice.findAllList().subscribe((listData) => {
              this.userServeice.setUserChange(listData || []);
              this.close();
            });
          } else {
            this._snackbar.open(data['message'] || 'Error al actualizar usuario', "Error!", { duration: 4000 });
          }
        },
        error: (err) => {
          this.isButtonDisabled = false;
          this._snackbar.open(err.error?.message || 'Error al actualizar usuario', "Error!", { duration: 4000 });
        }
      });
    } else {
      // Registrar nuevo usuario
      this.userServeice.saveUser(payload).subscribe({
        next: (data: any) => {
          this.isButtonDisabled = false;
          if(data && (data['code'] == 200 || data['code'] === undefined)){
            this._snackbar.open("Usuario registrado correctamente", "Correcto!", { duration: 3000, panelClass: 'custom-snackbar' });
            this.userServeice.findAllList().subscribe((listData) => {
              this.userServeice.setUserChange(listData || []);
              this.close();
            });
          } else {
            this._snackbar.open(data['message'] || 'Error al registrar usuario', "Error!", { duration: 4000 });
          }
        },
        error: (err) => {
          this.isButtonDisabled = false;
          this._snackbar.open(err.error?.message || 'Error al registrar usuario', "Error!", { duration: 4000 });
        }
      });
    }
  }

  validateFrm(): boolean {
    this.error = false;

    const nroDoc = (this.basicForm.controls["nroDocumento"].value || '').trim();
    if(nroDoc === ""){
      this._snackbar.open("Debe ingresar el Nro de Documento / Usuario", "Aviso!", { duration: 3000 });
      return true;
    }

    const nombres = (this.basicForm.controls["nombres"].value || '').trim();
    if(nombres === ""){
      this._snackbar.open("Debe ingresar el Nombre", "Aviso!", { duration: 3000 });
      return true;
    }

    const apePat = (this.basicForm.controls["apellidoPaterno"].value || '').trim();
    if(apePat === ""){
      this._snackbar.open("Debe ingresar el Apellido Paterno", "Aviso!", { duration: 3000 });
      return true;
    } 

    if(!this.basicForm.controls["rol"].value){
      this._snackbar.open("Debe seleccionar el Perfil/Rol (Administrador o Mesero)", "Aviso!", { duration: 3000 });
      return true;
    }

    if(this.panelContrasena){
      const p1 = (this.basicForm.controls["pass1"].value || '').trim();
      const p2 = (this.basicForm.controls["pass2"].value || '').trim();
      if(p1 === ""){
        this._snackbar.open("Debe ingresar la nueva contraseña", "Aviso!", { duration: 3000 });
        return true;
      }
      if(p1.length < 4){
        this._snackbar.open("La contraseña debe tener al menos 4 caracteres", "Aviso!", { duration: 3000 });
        return true;
      }
      if(p1 !== p2){
        this._snackbar.open("Las contraseñas no coinciden", "Aviso!", { duration: 3000 });
        return true;
      }
    }

    return false;
  }

  close(): void {
    this._dialogRef.close();
  }
  
  cambiarContrasena(action: boolean): void {
    this.panelContrasena = action;
  }
}
