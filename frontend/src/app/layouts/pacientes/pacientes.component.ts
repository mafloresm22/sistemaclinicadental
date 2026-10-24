import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../theme/shared/shared.module';
import { PacientesService, Paciente } from '../../services/pacientes.service';
import { ModalPacientesComponent } from './modal-pacientes/modal-pacientes.component';
import { IconService } from '@ant-design/icons-angular';
import {
  SearchOutline,
  CloseCircleOutline,
  PlusOutline,
  EditOutline,
  DeleteOutline,
  StopOutline,
  CheckCircleOutline,
  UserOutline,
  MedicineBoxOutline,
  IdcardOutline,
  PhoneOutline,
  MailOutline,
  CalendarOutline,
  AlertOutline,
  EyeOutline
} from '@ant-design/icons-angular/icons';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, ModalPacientesComponent],
  templateUrl: './pacientes.component.html',
  styleUrls: ['./pacientes.component.scss']
})
export class PacientesComponent implements OnInit {
  private pacientesService = inject(PacientesService);
  private iconService = inject(IconService);

  constructor() {
    this.iconService.addIcon(
      SearchOutline,
      CloseCircleOutline,
      PlusOutline,
      EditOutline,
      DeleteOutline,
      StopOutline,
      CheckCircleOutline,
      UserOutline,
      MedicineBoxOutline,
      IdcardOutline,
      PhoneOutline,
      MailOutline,
      CalendarOutline,
      AlertOutline,
      EyeOutline
    );
  }

  // ── Estado ───────────────────────────────────────────────
  pacientes: Paciente[] = [];
  cargando: boolean = false;
  terminoBusqueda: string = '';
  filtroEstado: string = '';

  // ── Paginación ───────────────────────────────────────────
  paginaActual: number = 1;
  tamanioPagina: number = 9;
  tamaniosPagina: number[] = [6, 9, 12, 24];

  // ── Modal ────────────────────────────────────────────────
  modalAbierto: boolean = false;
  pacienteSeleccionado: Paciente | null = null;

  ngOnInit(): void {
    this.cargarPacientes();
  }

  // ── Getters de Paginación ────────────────────────────────
  get totalRegistros(): number {
    return this.pacientes.length;
  }

  get totalPaginas(): number {
    return Math.ceil(this.totalRegistros / this.tamanioPagina) || 1;
  }

  get pacientesPaginados(): Paciente[] {
    const inicio = (this.paginaActual - 1) * this.tamanioPagina;
    return this.pacientes.slice(inicio, inicio + this.tamanioPagina);
  }

  get indiceInicio(): number {
    return this.totalRegistros === 0 ? 0 : (this.paginaActual - 1) * this.tamanioPagina + 1;
  }

  get indiceFin(): number {
    return Math.min(this.paginaActual * this.tamanioPagina, this.totalRegistros);
  }

  get paginasVisibles(): number[] {
    const delta = 2;
    const inicio = Math.max(1, this.paginaActual - delta);
    const fin = Math.min(this.totalPaginas, this.paginaActual + delta);
    return Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);
  }

  // ── Carga de datos ───────────────────────────────────────
  cargarPacientes(): void {
    this.cargando = true;
    this.pacientesService.listar(this.terminoBusqueda, this.filtroEstado).subscribe({
      next: (resp) => {
        this.pacientes = resp.datos || [];
        this.cargando = false;
        if (this.paginaActual > this.totalPaginas) {
          this.paginaActual = Math.max(1, this.totalPaginas);
        }
      },
      error: () => {
        this.cargando = false;
      }
    });
  }

  onBuscar(): void {
    this.paginaActual = 1;
    this.cargarPacientes();
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda = '';
    this.onBuscar();
  }

  cambiarTamanioPagina(nuevoTamanio: number): void {
    this.tamanioPagina = nuevoTamanio;
    this.paginaActual = 1;
  }

  irAPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  // ── Modales y Operaciones ────────────────────────────────
  abrirModalCrear(): void {
    this.pacienteSeleccionado = null;
    this.modalAbierto = true;
  }

  abrirModalEditar(paciente: Paciente): void {
    this.cargando = true;
    // Cargar con antecedentes completos vía endpoint por ID
    this.pacientesService.obtenerPorId(paciente.idPaciente).subscribe({
      next: (resp) => {
        this.pacienteSeleccionado = resp.datos;
        this.modalAbierto = true;
        this.cargando = false;
      },
      error: () => {
        this.pacienteSeleccionado = { ...paciente };
        this.modalAbierto = true;
        this.cargando = false;
      }
    });
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.pacienteSeleccionado = null;
  }

  onPacienteGuardado(): void {
    this.cargarPacientes();
  }

  // ── Cambiar Estado ───────────────────────────────────────
  toggleEstado(paciente: Paciente): void {
    const nuevoEstado = paciente.estadoPaciente === 'Activo' ? 'Inactivo' : 'Activo';
    const accion = nuevoEstado === 'Activo' ? 'activar' : 'inactivar';

    Swal.fire({
      title: `¿Desea ${accion} al paciente?`,
      text: `${paciente.nombrePaciente} ${paciente.apellidosPaciente} cambiará a estado ${nuevoEstado}.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: nuevoEstado === 'Activo' ? '#10b981' : '#f59e0b',
      cancelButtonColor: '#6c757d',
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.pacientesService.cambiarEstado(paciente.idPaciente, nuevoEstado).subscribe({
          next: () => {
            paciente.estadoPaciente = nuevoEstado;
            Swal.fire({
              icon: 'success',
              title: `Paciente ${accion === 'activar' ? 'activado' : 'inactivado'}`,
              timer: 1500,
              showConfirmButton: false
            });
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: err.error?.mensaje || 'No se pudo cambiar el estado del paciente.'
            });
          }
        });
      }
    });
  }

  // ── Eliminación Lógica ───────────────────────────────────
  eliminarPaciente(paciente: Paciente): void {
    Swal.fire({
      title: '¿Eliminar paciente?',
      text: `Se dará de baja a "${paciente.nombrePaciente} ${paciente.apellidosPaciente}". No se eliminará su historial clínico previo.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.pacientesService.eliminar(paciente.idPaciente).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Paciente eliminado',
              timer: 1500,
              showConfirmButton: false
            });
            this.cargarPacientes();
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: err.error?.mensaje || 'No se pudo eliminar al paciente.'
            });
          }
        });
      }
    });
  }

  // ── Utilidades de Visualización ──────────────────────────
  getIniciales(paciente: Paciente): string {
    const n = (paciente.nombrePaciente || '').trim()[0] || '';
    const a = (paciente.apellidosPaciente || '').trim()[0] || '';
    return `${n}${a}`.toUpperCase();
  }

  calcularEdad(fechaStr?: string | null): number | null {
    if (!fechaStr) return null;
    const hoy = new Date();
    const nac = new Date(fechaStr);
    if (isNaN(nac.getTime())) return null;

    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) {
      edad--;
    }
    return edad >= 0 ? edad : 0;
  }
}
