import { Component, OnInit } from '@angular/core';
import { LocalstorageService } from '../../services/localstorage.service';
import { MaterialModule } from '../../material/material.module';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [MaterialModule, NgFor],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css'
})
export class InicioComponent implements OnInit {
  name_storage:string;
  user_name:string;
  user_rol:string;
  // a_inicio:Inicio[]
  formControls = [
    'Autocomplete', 'Checkbox', 'Datepicker', 
    'Form field', 'Input', 'Radio button', 
    'Select', 'Slider', 'Slide toggle'
  ];
  menus = [
    { title: 'Navigation' },
    { title: 'Layout' },
    { title: 'Buttons & Indicators' },
    { title: 'Popups & Modals' },
    { title: 'Data table' }
  ];

  constructor(
    // private UserService: UserService,
    private localStorage: LocalstorageService,
    // private inicioService:InicioService
  ){}

  ngOnInit(): void {
    // this.name_storage = this.localStorage.getItem("user_storage");
    this.user_name = "José Luis"
    this.user_rol = "Administrador"

  }


}
