import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Sede {
  idSede: number;
  nombreSede: string;
  direccionSede?: string | null;
  telefonoSede?: string | null;
  estadoSede: 'Activo' | 'Inactivo';
  totalConsultorios?: number;
  createdAt?: string;
  consultorios?: Consultorio[];
}

export interface SedePayload {
  nombreSede: string;
  direccionSede?: string | null;
  telefonoSede?: string | null;
  estadoSede?: 'Activo' | 'Inactivo';
}

export interface Consultorio {
  idConsultorio: number;
  nombreConsultorio: string;
  estadoConsultorio: 'Activo' | 'Inactivo';
  sedeId: number;
  nombreSede?: string;
  estadoSede?: 'Activo' | 'Inactivo';
}

export interface ConsultorioPayload {
  nombreConsultorio: string;
  sedeId: number;
  estadoConsultorio?: 'Activo' | 'Inactivo';
}

export interface SedesListResponse {
  success: boolean;
  mensaje: string;
  total: number;
  datos: Sede[];
}

export interface SedeSingleResponse {
  success: boolean;
  mensaje: string;
  datos: Sede;
}

export interface ConsultoriosListResponse {
  success: boolean;
  mensaje: string;
  total: number;
  datos: Consultorio[];
}

export interface ConsultorioSingleResponse {
  success: boolean;
  mensaje: string;
  datos: Consultorio;
}

@Injectable({
  providedIn: 'root'
})
export class InfraestructuraService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/infraestructura`;


  // SERVICIOS: SEDES

  /**
   * Listar sedes con filtros opcionales de búsqueda y estado
   */
  listarSedes(busqueda?: string, estado?: string): Observable<SedesListResponse> {
    let params = new HttpParams();
    if (busqueda && busqueda.trim()) {
      params = params.set('busqueda', busqueda.trim());
    }
    if (estado && estado.trim() && estado !== 'Todos') {
      params = params.set('estado', estado.trim());
    }
    return this.http.get<SedesListResponse>(`${this.apiUrl}/sedes`, { params });
  }

  /**
   * Obtener una sede por su ID con sus consultorios
   */
  obtenerSedePorId(idSede: number): Observable<SedeSingleResponse> {
    return this.http.get<SedeSingleResponse>(`${this.apiUrl}/sedes/${idSede}`);
  }

  /**
   * Crear una nueva sede
   */
  crearSede(payload: SedePayload): Observable<SedeSingleResponse> {
    return this.http.post<SedeSingleResponse>(`${this.apiUrl}/sedes`, payload);
  }

  /**
   * Actualizar una sede existente
   */
  actualizarSede(idSede: number, payload: SedePayload): Observable<SedeSingleResponse> {
    return this.http.put<SedeSingleResponse>(`${this.apiUrl}/sedes/${idSede}`, payload);
  }

  /**
   * Cambiar estado de una sede (Activo / Inactivo)
   */
  cambiarEstadoSede(idSede: number, estadoSede: 'Activo' | 'Inactivo'): Observable<{ success: boolean; mensaje: string }> {
    return this.http.patch<{ success: boolean; mensaje: string }>(`${this.apiUrl}/sedes/${idSede}/estado`, { estadoSede });
  }

  /**
   * Eliminar una sede
   */
  eliminarSede(idSede: number): Observable<{ success: boolean; mensaje: string }> {
    return this.http.delete<{ success: boolean; mensaje: string }>(`${this.apiUrl}/sedes/${idSede}`);
  }

  // SERVICIOS: CONSULTORIOS

  /**
   * Listar consultorios con filtros por sede, texto y estado
   */
  listarConsultorios(busqueda?: string, sedeId?: number, estado?: string): Observable<ConsultoriosListResponse> {
    let params = new HttpParams();
    if (busqueda && busqueda.trim()) {
      params = params.set('busqueda', busqueda.trim());
    }
    if (sedeId && sedeId > 0) {
      params = params.set('sedeId', sedeId.toString());
    }
    if (estado && estado.trim() && estado !== 'Todos') {
      params = params.set('estado', estado.trim());
    }
    return this.http.get<ConsultoriosListResponse>(`${this.apiUrl}/consultorios`, { params });
  }

  /**
   * Obtener un consultorio por su ID
   */
  obtenerConsultorioPorId(idConsultorio: number): Observable<ConsultorioSingleResponse> {
    return this.http.get<ConsultorioSingleResponse>(`${this.apiUrl}/consultorios/${idConsultorio}`);
  }

  /**
   * Crear un nuevo consultorio
   */
  crearConsultorio(payload: ConsultorioPayload): Observable<ConsultorioSingleResponse> {
    return this.http.post<ConsultorioSingleResponse>(`${this.apiUrl}/consultorios`, payload);
  }

  /**
   * Actualizar un consultorio existente
   */
  actualizarConsultorio(idConsultorio: number, payload: ConsultorioPayload): Observable<ConsultorioSingleResponse> {
    return this.http.put<ConsultorioSingleResponse>(`${this.apiUrl}/consultorios/${idConsultorio}`, payload);
  }

  /**
   * Cambiar estado de un consultorio (Activo / Inactivo)
   */
  cambiarEstadoConsultorio(idConsultorio: number, estadoConsultorio: 'Activo' | 'Inactivo'): Observable<{ success: boolean; mensaje: string }> {
    return this.http.patch<{ success: boolean; mensaje: string }>(`${this.apiUrl}/consultorios/${idConsultorio}/estado`, { estadoConsultorio });
  }
}
