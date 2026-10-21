import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../theme/shared/shared.module';
import { TratamientosService, Tratamiento } from '../../services/tratamientos.service';
import { ModalTratamientosComponent } from './modal-tratamientos/modal-tratamientos.component';
import { IconService } from '@ant-design/icons-angular';
import {
  SearchOutline,
  CloseCircleOutline,
  PlusOutline,
  EditOutline,
  MedicineBoxOutline,
  InboxOutline,
  ClockCircleOutline,
  DollarOutline,
  CheckCircleOutline,
  StopOutline,
  FilterOutline
} from '@ant-design/icons-angular/icons';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-tratamientos',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, ModalTratamientosComponent],
  templateUrl: './tratamientos.component.html',
  styleUrls: ['./tratamientos.component.scss']
})
export class TratamientosComponent implements OnInit {
  private tratamientosService = inject(TratamientosService);
  private iconService = inject(IconService);

  constructor() {
    this.iconService.addIcon(
      SearchOutline,
      CloseCircleOutline,
      PlusOutline,
      EditOutline,
      MedicineBoxOutline,
      InboxOutline,
      ClockCircleOutline,
      DollarOutline,
      CheckCircleOutline,
      StopOutline,
      FilterOutline
    );
  }

  // Estados de datos
  tratamientos: Tratamiento[] = [];
  cargando: boolean = false;
  terminoBusqueda: string = '';
  filtroEstado: string = '';

  // Configuración de Paginación
  paginaActual: number = 1;
  tamanioPagina: number = 9; // 9 cards por página (grid 3x3)
  tamaniosPagina: number[] = [6, 9, 12, 18];

  // Control del modal hijo
  modalAbierto: boolean = false;
  tratamientoSeleccionado: Tratamiento | null = null;

  ngOnInit(): void {
    this.cargarTratamientos();
  }

  // --- Getters para Paginación ---
  get totalRegistros(): number {
    return this.tratamientos.length;
  }

  get totalPaginas(): number {
    return Math.ceil(this.totalRegistros / this.tamanioPagina) || 1;
  }

  get tratamientosPaginados(): Tratamiento[] {
    const inicio = (this.paginaActual - 1) * this.tamanioPagina;
    return this.tratamientos.slice(inicio, inicio + this.tamanioPagina);
  }

  get indiceInicio(): number {
    return this.totalRegistros === 0 ? 0 : (this.paginaActual - 1) * this.tamanioPagina + 1;
  }

  get indiceFin(): number {
    return Math.min(this.paginaActual * this.tamanioPagina, this.totalRegistros);
  }

  get paginasVisibles(): number[] {
    const total = this.totalPaginas;
    const actual = this.paginaActual;
    const delta = 2;
    const paginas: number[] = [];
    const inicio = Math.max(1, actual - delta);
    const fin = Math.min(total, actual + delta);
    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }
    return paginas;
  }

  get tratamientosActivos(): number {
    return this.tratamientos.filter(t => t.estadoTratamiento === 'Activo').length;
  }

  get tratamientosInactivos(): number {
    return this.tratamientos.filter(t => t.estadoTratamiento === 'Inactivo').length;
  }

  /**
   * Cambiar a una página específica
   */
  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas && pagina !== this.paginaActual) {
      this.paginaActual = pagina;
    }
  }

  /**
   * Cambiar la cantidad de cards visibles por página
   */
  cambiarTamanioPagina(nuevoTamanio: number): void {
    this.tamanioPagina = Number(nuevoTamanio);
    this.paginaActual = 1;
  }

  /**
   * Cargar lista de tratamientos desde el backend
   */
  cargarTratamientos(): void {
    this.cargando = true;
    this.tratamientosService.listar(this.terminoBusqueda, this.filtroEstado).subscribe({
      next: (resp) => {
        this.tratamientos = resp.datos || [];
        this.cargando = false;
        if (this.paginaActual > this.totalPaginas) {
          this.paginaActual = Math.max(1, this.totalPaginas);
        }
      },
      error: (err) => {
        this.cargando = false;
        console.error('Error al cargar tratamientos:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.error?.mensaje || 'No se pudieron cargar los tratamientos',
          confirmButtonColor: '#3b82f6'
        });
      }
    });
  }

  /**
   * Manejar evento de búsqueda
   */
  onBuscar(): void {
    this.paginaActual = 1;
    this.cargarTratamientos();
  }

  /**
   * Limpiar el campo de búsqueda
   */
  limpiarBusqueda(): void {
    if (this.terminoBusqueda) {
      this.terminoBusqueda = '';
      this.paginaActual = 1;
      this.cargarTratamientos();
    }
  }

  /**
   * Cambiar el filtro de estado
   */
  onFiltroEstadoCambio(): void {
    this.paginaActual = 1;
    this.cargarTratamientos();
  }

  /**
   * Abrir modal para registrar nuevo tratamiento
   */
  abrirModalCrear(): void {
    this.tratamientoSeleccionado = null;
    this.modalAbierto = true;
  }

  /**
   * Abrir modal para editar un tratamiento existente
   */
  abrirModalEditar(item: Tratamiento): void {
    this.tratamientoSeleccionado = item;
    this.modalAbierto = true;
  }

  /**
   * Cerrar el modal
   */
  cerrarModal(): void {
    this.modalAbierto = false;
    this.tratamientoSeleccionado = null;
  }

  /**
   * Callback cuando el modal hijo guarda exitosamente
   */
  onTratamientoGuardado(): void {
    this.cargarTratamientos();
  }

  /**
   * Confirmar y cambiar estado del tratamiento (toggle Activo/Inactivo)
   */
  confirmarCambioEstado(item: Tratamiento): void {
    const nuevoEstado = item.estadoTratamiento === 'Activo' ? 'Inactivo' : 'Activo';
    const accion = nuevoEstado === 'Inactivo' ? 'desactivar' : 'activar';
    const icono = nuevoEstado === 'Inactivo' ? 'warning' : 'question';
    const colorBtn = nuevoEstado === 'Inactivo' ? '#f59e0b' : '#22c55e';

    Swal.fire({
      title: `¿${nuevoEstado === 'Inactivo' ? 'Desactivar' : 'Activar'} tratamiento?`,
      html: `¿Estás seguro de ${accion} <strong>${item.nombreTratamiento}</strong>?`,
      icon: icono,
      showCancelButton: true,
      confirmButtonColor: colorBtn,
      cancelButtonColor: '#64748b',
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.cambiarEstado(item, nuevoEstado);
      }
    });
  }

  private cambiarEstado(item: Tratamiento, nuevoEstado: string): void {
    this.tratamientosService.cambiarEstado(item.idTratamiento, nuevoEstado).subscribe({
      next: (resp) => {
        item.estadoTratamiento = nuevoEstado as 'Activo' | 'Inactivo';
        this.mostrarToast('success', resp.mensaje || `Tratamiento ${nuevoEstado.toLowerCase()} correctamente`);
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.error?.mensaje || 'Ocurrió un error al cambiar el estado',
          confirmButtonColor: '#3b82f6'
        });
      }
    });
  }

  private mostrarToast(icon: 'success' | 'error' | 'info' | 'warning', title: string): void {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });
    Toast.fire({ icon, title });
  }

  /**
   * Formatear duración en minutos a texto legible
   */
  formatearDuracion(minutos?: number | null): string {
    if (!minutos) return 'No especificada';
    if (minutos < 60) return `${minutos} min`;
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }

  /**
   * Formatear costo en moneda local
   */
  formatearCosto(costo: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(costo);
  }
}
