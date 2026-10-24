import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// ── Interfaces ──────────────────────────────────────────────
export type TipoDocumento = 'DNI' | 'CE' | 'Pasaporte';
export type SexoPaciente = 'Masculino' | 'Femenino' | 'Otro';
export type TipoAntecedente = 'Alergia' | 'Enfermedad' | 'Medicacion' | 'Cirugia' | 'Otro';

export interface Antecedente {
  idAntecedente?: number;
  pacienteId?: number;
  tipoAntecedente: TipoAntecedente;
  descripcionAntecedente?: string | null;
  fechaRegistro?: string;
  registradoPorId?: number | null;
  registradoPorNombre?: string | null;
}

export interface Paciente {
  idPaciente: number;
  nombrePaciente: string;
  apellidosPaciente: string;
  tipoDocumento: TipoDocumento;
  documentoPaciente: string;
  fechaNacimientoPaciente?: string | null;
  sexoPaciente?: SexoPaciente | null;
  celularPaciente?: string | null;
  correoPaciente?: string | null;
  direccionPaciente?: string | null;
  contactoEmergenciaNombre?: string | null;
  contactoEmergenciaCelular?: string | null;
  apoderadoId?: number | null;
  apoderadoNombre?: string | null;
  estadoPaciente: 'Activo' | 'Inactivo';
  totalAntecedentes?: number;
  antecedentes?: Antecedente[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PacientesListResponse {
  success: boolean;
  mensaje: string;
  total: number;
  datos: Paciente[];
}

export interface PacienteSingleResponse {
  success: boolean;
  mensaje: string;
  datos: Paciente;
}

export interface AntecedentesListResponse {
  success: boolean;
  mensaje: string;
  total: number;
  datos: Antecedente[];
}

export interface AntecedenteSingleResponse {
  success: boolean;
  mensaje: string;
  datos: Antecedente;
}

export interface PacientePayload {
  nombrePaciente: string;
  apellidosPaciente: string;
  tipoDocumento?: TipoDocumento;
  documentoPaciente: string;
  fechaNacimientoPaciente?: string | null;
  sexoPaciente?: SexoPaciente | null;
  celularPaciente?: string | null;
  correoPaciente?: string | null;
  direccionPaciente?: string | null;
  contactoEmergenciaNombre?: string | null;
  contactoEmergenciaCelular?: string | null;
  apoderadoId?: number | null;
  estadoPaciente?: 'Activo' | 'Inactivo';
  antecedentes?: Array<{
    tipoAntecedente: TipoAntecedente;
    descripcionAntecedente?: string | null;
  }>;
}

// ── Service ──────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class PacientesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/pacientes`;

  /**
   * Listar pacientes con filtros opcionales de búsqueda y estado
   */
  listar(busqueda?: string, estado?: string): Observable<PacientesListResponse> {
    let params = new HttpParams();
    if (busqueda?.trim()) params = params.set('busqueda', busqueda.trim());
    if (estado?.trim()) params = params.set('estado', estado.trim());
    return this.http.get<PacientesListResponse>(this.apiUrl, { params });
  }

  /**
   * Obtener paciente por ID con sus antecedentes incluidos
   */
  obtenerPorId(id: number): Observable<PacienteSingleResponse> {
    return this.http.get<PacienteSingleResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crear paciente con o sin antecedentes iniciales en una transacción
   */
  crear(payload: PacientePayload): Observable<PacienteSingleResponse> {
    return this.http.post<PacienteSingleResponse>(this.apiUrl, payload);
  }

  /**
   * Actualizar datos del paciente
   */
  actualizar(id: number, payload: PacientePayload): Observable<{ success: boolean; mensaje: string }> {
    return this.http.put<{ success: boolean; mensaje: string }>(`${this.apiUrl}/${id}`, payload);
  }

  /**
   * Cambiar estado Activo / Inactivo
   */
  cambiarEstado(id: number, estadoPaciente: 'Activo' | 'Inactivo'): Observable<{ success: boolean; mensaje: string }> {
    return this.http.patch<{ success: boolean; mensaje: string }>(`${this.apiUrl}/${id}/estado`, { estadoPaciente });
  }

  /**
   * Eliminación lógica (soft-delete)
   */
  eliminar(id: number): Observable<{ success: boolean; mensaje: string }> {
    return this.http.delete<{ success: boolean; mensaje: string }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Listar antecedentes de un paciente
   */
  listarAntecedentes(idPaciente: number): Observable<AntecedentesListResponse> {
    return this.http.get<AntecedentesListResponse>(`${this.apiUrl}/${idPaciente}/antecedentes`);
  }

  /**
   * Agregar un antecedente a un paciente existente
   */
  agregarAntecedente(
    idPaciente: number,
    antecedente: { tipoAntecedente: TipoAntecedente; descripcionAntecedente?: string | null }
  ): Observable<AntecedenteSingleResponse> {
    return this.http.post<AntecedenteSingleResponse>(`${this.apiUrl}/${idPaciente}/antecedentes`, antecedente);
  }

  /**
   * Eliminar un antecedente médico
   */
  eliminarAntecedente(idPaciente: number, idAntecedente: number): Observable<{ success: boolean; mensaje: string }> {
    return this.http.delete<{ success: boolean; mensaje: string }>(
      `${this.apiUrl}/${idPaciente}/antecedentes/${idAntecedente}`
    );
  }
}
