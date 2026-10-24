import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PiezaDental {
  idPieza: number;
  nombrePieza: string;
  cuadrante: number;
  arcada: 'Superior' | 'Inferior';
}

export interface PiezasListResponse {
  success: boolean;
  mensaje: string;
  total: number;
  datos: PiezaDental[];
}

export interface PiezaSingleResponse {
  success: boolean;
  mensaje: string;
  datos: PiezaDental;
}

@Injectable({
  providedIn: 'root'
})
export class PiezasDentalesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/piezas-dentales`;

  /**
   * Listar catálogo de piezas dentales con filtros opcionales
   */
  listar(arcada?: string, cuadrante?: number, busqueda?: string): Observable<PiezasListResponse> {
    let params = new HttpParams();
    if (arcada && arcada.trim()) {
      params = params.set('arcada', arcada.trim());
    }
    if (cuadrante !== undefined && cuadrante !== null) {
      params = params.set('cuadrante', cuadrante.toString());
    }
    if (busqueda && busqueda.trim()) {
      params = params.set('busqueda', busqueda.trim());
    }
    return this.http.get<PiezasListResponse>(this.apiUrl, { params });
  }

  /**
   * Obtener una pieza dental por su ID (código FDI)
   */
  obtenerPorId(idPieza: number): Observable<PiezaSingleResponse> {
    return this.http.get<PiezaSingleResponse>(`${this.apiUrl}/${idPieza}`);
  }

  /**
   * Actualizar el nombre descriptivo de una pieza dental
   */
  actualizar(idPieza: number, nombrePieza: string): Observable<PiezaSingleResponse> {
    return this.http.put<PiezaSingleResponse>(`${this.apiUrl}/${idPieza}`, { nombrePieza });
  }
}
