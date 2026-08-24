import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalstorageService {

  constructor() { }

  setItem(key:string, value:any):void{
    const jsonData = JSON.stringify(value);
    localStorage.setItem(key,jsonData);
  }

  getItem<T>(key: string): T | null {
    const jsonData = localStorage.getItem(key);
    if (jsonData) {
      return JSON.parse(jsonData) as T;
    }
    return null;
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  clear(): void {
    localStorage.clear();
  }

}
