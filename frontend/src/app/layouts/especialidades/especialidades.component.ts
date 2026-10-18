import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../theme/shared/shared.module';
import { EspecialidadesService, Especialidad } from '../../services/especialidades.service';
import { ModalEspecialidadComponent } from './modal-especialidad/modal-especialidad.component';
import { IconService } from '@ant-design/icons-angular';
import {
  SearchOutline,
  CloseCircleOutline,
  PlusOutline,
  EditOutline,
  DeleteOutline,
  InboxOutline
} from '@ant-design/icons-angular/icons';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-especialidades',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, ModalEspecialidadComponent],
  templateUrl: './especialidades.component.html',
  styleUrls: ['./especialidades.component.scss']
})
export class EspecialidadesComponent implements OnInit {
  private especialidadesService = inject(EspecialidadesService);
  private iconService = inject(IconService);

  constructor() {
    this.iconService.addIcon(
      SearchOutline,
      CloseCircleOutline,
      PlusOutline,
      EditOutline,
      DeleteOutline,
      InboxOutline
    );
  }

  // Estados de datos
  especialidades: Especialidad[] = [];
  cargando: boolean = false;
  terminoBusqueda: string = '';

  // Configuración de Paginación
  paginaActual: number = 1;
  tamanioPagina: number = 10;
  tamaniosPagina: number[] = [5, 10, 20, 50];

  // Control del modal hijo
  modalAbierto: boolean = false;
  especialidadSeleccionada: Especialidad | null = null;

  ngOnInit(): void {
    this.cargarEspecialidades();
  }

  // --- Getters para Paginación ---
  get totalRegistros(): number {
    return this.especialidades.length;
  }

  get totalPaginas(): number {
    return Math.ceil(this.totalRegistros / this.tamanioPagina) || 1;
  }

  get especialidadesPaginadas(): Especialidad[] {
    const inicio = (this.paginaActual - 1) * this.tamanioPagina;
    return this.especialidades.slice(inicio, inicio + this.tamanioPagina);
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
    const delta = 2; // Rango de páginas adyacentes
    const paginas: number[] = [];

    const inicio = Math.max(1, actual - delta);
    const fin = Math.min(total, actual + delta);

    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }
    return paginas;
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
   * Cambiar la cantidad de registros visibles por página
   */
  cambiarTamanioPagina(nuevoTamanio: number): void {
    this.tamanioPagina = Number(nuevoTamanio);
    this.paginaActual = 1;
  }

  /**
   * Cargar lista de especialidades desde el backend
   */
  cargarEspecialidades(): void {
    this.cargando = true;
    this.especialidadesService.listar(this.terminoBusqueda).subscribe({
      next: (resp) => {
        this.especialidades = resp.datos || [];
        this.cargando = false;
        // Si la página actual excede el nuevo total de páginas, corregir
        if (this.paginaActual > this.totalPaginas) {
          this.paginaActual = Math.max(1, this.totalPaginas);
        }
      },
      error: (err) => {
        this.cargando = false;
        console.error('Error al cargar especialidades:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.error?.mensaje || 'No se pudieron cargar las especialidades',
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
    this.cargarEspecialidades();
  }

  /**
   * Limpiar el campo de búsqueda
   */
  limpiarBusqueda(): void {
    if (this.terminoBusqueda) {
      this.terminoBusqueda = '';
      this.paginaActual = 1;
      this.cargarEspecialidades();
    }
  }

  /**
   * Abrir modal para registrar nueva especialidad
   */
  abrirModalCrear(): void {
    this.especialidadSeleccionada = null;
    this.modalAbierto = true;
  }

  /**
   * Abrir modal para editar una especialidad existente
   */
  abrirModalEditar(item: Especialidad): void {
    this.especialidadSeleccionada = item;
    this.modalAbierto = true;
  }

  /**
   * Cerrar el modal
   */
  cerrarModal(): void {
    this.modalAbierto = false;
    this.especialidadSeleccionada = null;
  }

  /**
   * Callback cuando el modal hijo guarda exitosamente
   */
  onEspecialidadGuardada(): void {
    this.cargarEspecialidades();
  }

  /**
   * Confirmar y eliminar especialidad
   */
  confirmarEliminar(item: Especialidad): void {
    Swal.fire({
      title: '¿Eliminar especialidad?',
      html: `¿Estás seguro de eliminar <strong>${item.nombreEspecialidad}</strong>?<br><span class="text-muted small">Esta acción no se puede deshacer.</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.eliminar(item.idEspecialidad);
      }
    });
  }

  private eliminar(id: number): void {
    this.especialidadesService.eliminar(id).subscribe({
      next: (resp) => {
        this.cargarEspecialidades();
        this.mostrarToast('success', resp.mensaje || 'Especialidad eliminada correctamente');
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'No se puede eliminar',
          text: err.error?.mensaje || 'Ocurrió un error al intentar eliminar la especialidad',
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

    Toast.fire({
      icon,
      title
    });
  }
}
