import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Especialidad {
  idEspecialidad: number;
  nombreEspecialidad: string;
  descripcionEspecialidad?: string | null;
  totalDoctores?: number;
}

export interface EspecialidadesListResponse {
  success: boolean;
  mensaje: string;
  total: number;
  datos: Especialidad[];
}

export interface EspecialidadSingleResponse {
  success: boolean;
  mensaje: string;
  datos: Especialidad;
}

export interface EspecialidadPayload {
  nombreEspecialidad: string;
  descripcionEspecialidad?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class EspecialidadesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/especialidades`;

  /**
   * Listar especialidades con filtro opcional de búsqueda
   */
  listar(busqueda?: string): Observable<EspecialidadesListResponse> {
    let params = new HttpParams();
    if (busqueda && busqueda.trim()) {
      params = params.set('busqueda', busqueda.trim());
    }
    return this.http.get<EspecialidadesListResponse>(this.apiUrl, { params });
  }

  /**
   * Obtener una especialidad por su ID
   */
  obtenerPorId(id: number): Observable<EspecialidadSingleResponse> {
    return this.http.get<EspecialidadSingleResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crear una nueva especialidad
   */
  crear(payload: EspecialidadPayload): Observable<EspecialidadSingleResponse> {
    return this.http.post<EspecialidadSingleResponse>(this.apiUrl, payload);
  }

  /**
   * Actualizar una especialidad existente
   */
  actualizar(id: number, payload: EspecialidadPayload): Observable<EspecialidadSingleResponse> {
    return this.http.put<EspecialidadSingleResponse>(`${this.apiUrl}/${id}`, payload);
  }

  /**
   * Eliminar una especialidad
   */
  eliminar(id: number): Observable<{ success: boolean; mensaje: string }> {
    return this.http.delete<{ success: boolean; mensaje: string }>(`${this.apiUrl}/${id}`);
  }
}
