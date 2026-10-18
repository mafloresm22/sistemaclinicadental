import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PersonaInfo {
  tipo: 'Doctor' | 'Empleado';
  id: number;
  nombres: string;
  colegiatura?: string;
  cargo?: string;
}

export interface UsuarioSesion {
  idUsuario: number;
  nombreUsuario: string;
  rol: string;
  permisos: string[];
  persona: PersonaInfo | null;
}

export interface LoginResponse {
  success: boolean;
  mensaje: string;
  token: string;
  usuario: UsuarioSesion;
}

export interface LoginRequest {
  nombreUsuario: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly TOKEN_KEY = 'clinica_token';
  private readonly USER_KEY = 'clinica_usuario';

  private usuarioSubject = new BehaviorSubject<UsuarioSesion | null>(this.obtenerUsuarioAlmacenado());
  public usuarioActual$ = this.usuarioSubject.asObservable();

  /**
   * Inicia sesión llamando al endpoint del backend Node.js
   */
  login(credenciales: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, credenciales).pipe(
      tap((res) => {
        if (res.success && res.token) {
          this.guardarSesion(res.token, res.usuario);
        }
      })
    );
  }

  /**
   * Obtiene el perfil actualizado desde el backend
   */
  obtenerPerfil(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/auth/perfil`).pipe(
      tap((res) => {
        if (res.success && res.usuario) {
          this.actualizarUsuario(res.usuario);
        }
      })
    );
  }

  /**
   * Guarda el token y datos del usuario en localStorage
   */
  guardarSesion(token: string, usuario: UsuarioSesion): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(usuario));
    this.usuarioSubject.next(usuario);
  }

  /**
   * Actualiza los datos del usuario en memoria y localStorage
   */
  actualizarUsuario(usuario: UsuarioSesion): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(usuario));
    this.usuarioSubject.next(usuario);
  }

  /**
   * Retorna el token JWT guardado
   */
  obtenerToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Retorna los datos del usuario logueado
   */
  obtenerUsuario(): UsuarioSesion | null {
    return this.usuarioSubject.value;
  }

  /**
   * Comprueba si el usuario tiene una sesión activa
   */
  estaAutenticado(): boolean {
    const token = this.obtenerToken();
    if (!token) return false;

    // Verificar si el token expiró decodificando el payload
    try {
      const payloadBase64 = token.split('.')[1];
      const payload = JSON.parse(atob(payloadBase64));
      const expiraEn = payload.exp * 1000;
      if (Date.now() >= expiraEn) {
        this.logout();
        return false;
      }
      return true;
    } catch {
      return !!token;
    }
  }

  /**
   * Comprueba si el usuario cuenta con un permiso específico
   */
  tienePermiso(permiso: string): boolean {
    const usuario = this.obtenerUsuario();
    if (!usuario || !usuario.permisos) return false;
    return usuario.permisos.includes('*') || usuario.permisos.includes(permiso);
  }

  /**
   * Cierra sesión eliminando los datos y redirigiendo al login
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.usuarioSubject.next(null);
    this.router.navigate(['/login']);
  }

  private obtenerUsuarioAlmacenado(): UsuarioSesion | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
}
