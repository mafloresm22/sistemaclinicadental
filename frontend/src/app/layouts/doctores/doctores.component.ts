import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../theme/shared/shared.module';
import { DoctoresService, Doctor } from '../../services/doctores.service';
import { ModalDoctoresComponent } from './modal-doctores/modal-doctores.component';
import { IconService } from '@ant-design/icons-angular';
import {
  SearchOutline,
  CloseCircleOutline,
  PlusOutline,
  EditOutline,
  StopOutline,
  CheckCircleOutline,
  UserOutline,
  MedicineBoxOutline,
  IdcardOutline,
  SafetyCertificateOutline,
  PhoneOutline,
  MailOutline
} from '@ant-design/icons-angular/icons';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-doctores',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, ModalDoctoresComponent],
  templateUrl: './doctores.component.html',
  styleUrls: ['./doctores.component.scss']
})
export class DoctoresComponent implements OnInit {
  private doctoresService = inject(DoctoresService);
  private iconService = inject(IconService);

  constructor() {
    this.iconService.addIcon(
      SearchOutline, CloseCircleOutline, PlusOutline,
      EditOutline, StopOutline, CheckCircleOutline, UserOutline,
      MedicineBoxOutline, IdcardOutline, SafetyCertificateOutline,
      PhoneOutline, MailOutline
    );
  }

  // ── Estado ───────────────────────────────────────────────
  doctores: Doctor[] = [];
  cargando = false;
  terminoBusqueda = '';
  filtroEstado = '';

  // ── Paginación ───────────────────────────────────────────
  paginaActual = 1;
  tamanioPagina = 9;
  tamaniosPagina = [6, 9, 12, 24];

  // ── Modal ────────────────────────────────────────────────
  modalAbierto = false;
  doctorSeleccionado: Doctor | null = null;

  ngOnInit(): void {
    this.cargarDoctores();
  }

  // ── Getters de paginación ────────────────────────────────
  get totalRegistros(): number { return this.doctores.length; }

  get totalPaginas(): number {
    return Math.ceil(this.totalRegistros / this.tamanioPagina) || 1;
  }

  get doctoresPaginados(): Doctor[] {
    const inicio = (this.paginaActual - 1) * this.tamanioPagina;
    return this.doctores.slice(inicio, inicio + this.tamanioPagina);
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

  // ── Métodos ──────────────────────────────────────────────

  cargarDoctores(): void {
    this.cargando = true;
    this.doctoresService.listar(this.terminoBusqueda, this.filtroEstado).subscribe({
      next: (resp) => {
        this.doctores = resp.datos || [];
        this.cargando = false;
        if (this.paginaActual > this.totalPaginas) {
          this.paginaActual = Math.max(1, this.totalPaginas);
        }
      },
      error: (err) => {
        this.cargando = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.error?.mensaje || 'No se pudieron cargar los doctores',
          confirmButtonColor: '#3b82f6'
        });
      }
    });
  }

  onBuscar(): void {
    this.paginaActual = 1;
    this.cargarDoctores();
  }

  limpiarBusqueda(): void {
    if (this.terminoBusqueda) {
      this.terminoBusqueda = '';
      this.paginaActual = 1;
      this.cargarDoctores();
    }
  }

  limpiarFiltros(): void {
    this.terminoBusqueda = '';
    this.filtroEstado = '';
    this.paginaActual = 1;
    this.cargarDoctores();
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas && pagina !== this.paginaActual) {
      this.paginaActual = pagina;
    }
  }

  cambiarTamanioPagina(nuevoTamanio: number): void {
    this.tamanioPagina = Number(nuevoTamanio);
    this.paginaActual = 1;
  }

  abrirModalCrear(): void {
    this.doctorSeleccionado = null;
    this.modalAbierto = true;
  }

  abrirModalEditar(doc: Doctor): void {
    this.doctorSeleccionado = doc;
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.doctorSeleccionado = null;
  }

  onDoctorGuardado(): void {
    this.cargarDoctores();
  }

  confirmarDesactivar(doc: Doctor): void {
    Swal.fire({
      title: '¿Desactivar doctor?',
      html: `El doctor <strong>${doc.nombreDoctor} ${doc.apellidosDoctor}</strong> pasará a estado <span class="text-danger">Inactivo</span>.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.doctoresService.desactivar(doc.idDoctor).subscribe({
          next: (resp) => {
            this.mostrarToast('success', resp.mensaje || 'Doctor desactivado correctamente');
            this.cargarDoctores();
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: err.error?.mensaje || 'No se pudo desactivar el doctor',
              confirmButtonColor: '#3b82f6'
            });
          }
        });
      }
    });
  }

  confirmarActivar(doc: Doctor): void {
    Swal.fire({
      title: '¿Activar doctor?',
      html: `El doctor <strong>${doc.nombreDoctor} ${doc.apellidosDoctor}</strong> pasará a estado <span class="text-success">Activo</span>.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#22c55e',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, activar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.doctoresService.cambiarEstado(doc.idDoctor, 'Activo').subscribe({
          next: (resp) => {
            this.mostrarToast('success', resp.mensaje || 'Doctor activado correctamente');
            this.cargarDoctores();
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: err.error?.mensaje || 'No se pudo activar el doctor',
              confirmButtonColor: '#3b82f6'
            });
          }
        });
      }
    });
  }

  /** Genera las iniciales del doctor para el avatar */
  getIniciales(doc: Doctor): string {
    const n = doc.nombreDoctor?.charAt(0) || '';
    const a = doc.apellidosDoctor?.charAt(0) || '';
    return (n + a).toUpperCase();
  }

  private mostrarToast(icon: 'success' | 'error' | 'info' | 'warning', title: string): void {
    Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (t) => {
        t.addEventListener('mouseenter', Swal.stopTimer);
        t.addEventListener('mouseleave', Swal.resumeTimer);
      }
    }).fire({ icon, title });
  }
}
