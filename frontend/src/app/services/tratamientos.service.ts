import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Tratamiento {
  idTratamiento: number;
  nombreTratamiento: string;
  descripcionTratamiento?: string | null;
  duracionEstimadaMin?: number | null;
  costoBase: number;
  estadoTratamiento: 'Activo' | 'Inactivo';
}

export interface TratamientosListResponse {
  success: boolean;
  mensaje: string;
  total: number;
  datos: Tratamiento[];
}

export interface TratamientoSingleResponse {
  success: boolean;
  mensaje: string;
  datos: Tratamiento;
}

export interface TratamientoPayload {
  nombreTratamiento: string;
  descripcionTratamiento?: string | null;
  duracionEstimadaMin?: number | null;
  costoBase: number;
}

@Injectable({
  providedIn: 'root'
})
export class TratamientosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/tratamientos`;

  /**
   * Listar tratamientos con filtro opcional de búsqueda y estado
   */
  listar(busqueda?: string, estado?: string): Observable<TratamientosListResponse> {
    let params = new HttpParams();
    if (busqueda && busqueda.trim()) {
      params = params.set('busqueda', busqueda.trim());
    }
    if (estado && estado.trim()) {
      params = params.set('estado', estado.trim());
    }
    return this.http.get<TratamientosListResponse>(this.apiUrl, { params });
  }

  /**
   * Obtener un tratamiento por su ID
   */
  obtenerPorId(id: number): Observable<TratamientoSingleResponse> {
    return this.http.get<TratamientoSingleResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crear un nuevo tratamiento
   */
  crear(payload: TratamientoPayload): Observable<TratamientoSingleResponse> {
    return this.http.post<TratamientoSingleResponse>(this.apiUrl, payload);
  }

  /**
   * Actualizar un tratamiento existente
   */
  actualizar(id: number, payload: TratamientoPayload): Observable<TratamientoSingleResponse> {
    return this.http.put<TratamientoSingleResponse>(`${this.apiUrl}/${id}`, payload);
  }

  /**
   * Cambiar el estado de un tratamiento (Activo / Inactivo)
   */
  cambiarEstado(id: number, estadoTratamiento: string): Observable<{ success: boolean; mensaje: string; datos: { idTratamiento: number; estadoTratamiento: string } }> {
    return this.http.patch<{ success: boolean; mensaje: string; datos: { idTratamiento: number; estadoTratamiento: string } }>(
      `${this.apiUrl}/${id}/estado`,
      { estadoTratamiento }
    );
  }
}
