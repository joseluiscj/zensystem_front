import { Component, OnInit } from '@angular/core';
import { MaterialModule } from '../material/material.module';
import { NgIf } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoginService } from '../services/login.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [MaterialModule, NgIf, ReactiveFormsModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  loginForm: UntypedFormGroup;
  ocultar: String = 'd-none';

  constructor(
    private loginService: LoginService,
    private fb: FormBuilder,
    private router: Router,
    private _snackbar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      user: ['', [Validators.required, Validators.maxLength(20)]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(80)]],
    });
  }

  ngOnInit(): void {
    this.loginService.logout(false);
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const v_usuario = this.loginForm.get('user')?.value;
      const v_password = this.loginForm.get('password')?.value;
      let error = false;

      if (!v_usuario || v_usuario.trim() === '' || !v_password || v_password.trim() === '') {
        error = true;
        this._snackbar.open("Verificar datos en el formulario", "Aviso!", { duration: 3000, panelClass: 'custom-snackbar' });
      } else {
        setTimeout(() => {
          this.ocultar = "d-none";
        }, 3000);
        this.ocultar = "";
        this.loginService.login(v_usuario, v_password).subscribe(data => {
          this.loginService.setToken(data.access_token);
          this.router.navigate(["pages/inicio"]);
        });
      }
    }
  }
}
