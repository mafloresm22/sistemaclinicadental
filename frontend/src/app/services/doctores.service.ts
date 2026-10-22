import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// ── Interfaces ──────────────────────────────────────────────
export interface Doctor {
  idDoctor: number;
  nombreDoctor: string;
  apellidosDoctor: string;
  tipoDocumento: 'DNI' | 'CE' | 'Pasaporte';
  documentoDoctor: string;
  nroColegiatura?: string | null;
  celularDoctor?: string | null;
  correoDoctor?: string | null;
  estadoDoctor: 'Activo' | 'Inactivo';
  usuarioId: number;
  especialidades?: string | null;
  idEspecialidades?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface DoctoresListResponse {
  success: boolean;
  mensaje: string;
  total: number;
  datos: Doctor[];
}

export interface DoctorSingleResponse {
  success: boolean;
  mensaje: string;
  datos: Doctor;
}

export interface DoctorPayload {
  nombreDoctor: string;
  apellidosDoctor: string;
  tipoDocumento?: string;
  documentoDoctor: string;
  nroColegiatura?: string | null;
  celularDoctor?: string | null;
  correoDoctor?: string | null;
  usuarioId?: number;
  especialidades?: number[];
}

// ── Service ──────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class DoctoresService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/doctores`;

  listar(busqueda?: string, estado?: string): Observable<DoctoresListResponse> {
    let params = new HttpParams();
    if (busqueda?.trim()) params = params.set('busqueda', busqueda.trim());
    if (estado?.trim())   params = params.set('estado', estado.trim());
    return this.http.get<DoctoresListResponse>(this.apiUrl, { params });
  }

  obtenerPorId(id: number): Observable<DoctorSingleResponse> {
    return this.http.get<DoctorSingleResponse>(`${this.apiUrl}/${id}`);
  }

  crear(payload: DoctorPayload): Observable<DoctorSingleResponse> {
    return this.http.post<DoctorSingleResponse>(this.apiUrl, payload);
  }

  actualizar(id: number, payload: DoctorPayload): Observable<DoctorSingleResponse> {
    return this.http.put<DoctorSingleResponse>(`${this.apiUrl}/${id}`, payload);
  }

  desactivar(id: number): Observable<{ success: boolean; mensaje: string; datos: { idDoctor: number; estadoDoctor: string } }> {
    return this.http.delete<{ success: boolean; mensaje: string; datos: { idDoctor: number; estadoDoctor: string } }>(`${this.apiUrl}/${id}`);
  }

  cambiarEstado(id: number, estadoDoctor: string): Observable<{ success: boolean; mensaje: string }> {
    return this.http.patch<{ success: boolean; mensaje: string }>(`${this.apiUrl}/${id}/estado`, { estadoDoctor });
  }
}
