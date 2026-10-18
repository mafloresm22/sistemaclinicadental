import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../theme/shared/shared.module';
import {
  InfraestructuraService,
  Sede,
  Consultorio
} from '../../services/infraestructura.service';
import { ModalSedesComponent } from './modal-sedes/modal-sedes.component';
import { ModalConsultorioComponent } from './modal-consultorio/modal-consultorio.component';
import { IconService } from '@ant-design/icons-angular';
import {
  SearchOutline,
  CloseCircleOutline,
  PlusOutline,
  EditOutline,
  DeleteOutline,
  InboxOutline,
  BankOutline,
  ApartmentOutline,
  PlusCircleOutline,
  CheckOutline,
  AlertOutline,
  InfoCircleOutline,
  EyeOutline,
  SwapOutline
} from '@ant-design/icons-angular/icons';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-infraestructura',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    ModalSedesComponent,
    ModalConsultorioComponent
  ],
  templateUrl: './infraestructura.component.html',
  styleUrls: ['./infraestructura.component.scss']
})
export class InfraestructuraComponent implements OnInit {
  private infraService = inject(InfraestructuraService);
  private iconService = inject(IconService);

  constructor() {
    this.iconService.addIcon(
      SearchOutline,
      CloseCircleOutline,
      PlusOutline,
      EditOutline,
      DeleteOutline,
      InboxOutline,
      BankOutline,
      ApartmentOutline,
      PlusCircleOutline,
      CheckOutline,
      AlertOutline,
      InfoCircleOutline,
      EyeOutline,
      SwapOutline
    );
  }

  // Control de Pestañas
  tabActiva: 'sedes' | 'consultorios' = 'sedes';

  // ==========================================
  // ESTADO: SEDES
  // ==========================================
  sedes: Sede[] = [];
  cargandoSedes: boolean = false;
  busquedaSede: string = '';
  filtroEstadoSede: string = 'Todos';

  // Paginación Sedes
  paginaSedes: number = 1;
  tamanioPaginaSedes: number = 5;
  tamaniosPagina: number[] = [5, 10, 20];

  // Modal Sedes
  modalSedeAbierto: boolean = false;
  sedeSeleccionada: Sede | null = null;

  // ==========================================
  // ESTADO: CONSULTORIOS
  // ==========================================
  consultorios: Consultorio[] = [];
  cargandoConsultorios: boolean = false;
  busquedaConsultorio: string = '';
  filtroSedeConsultorios: number = 0;
  filtroEstadoConsultorio: string = 'Todos';

  // Paginación Consultorios
  paginaConsultorios: number = 1;
  tamanioPaginaConsultorios: number = 5;

  // Modal Consultorios
  modalConsultorioAbierto: boolean = false;
  consultorioSeleccionado: Consultorio | null = null;
  sedePreseleccionadaId: number | null = null;

  ngOnInit(): void {
    this.cargarSedes();
    this.cargarConsultorios();
  }

  // ==========================================
  // GETTERS PARA SEDES
  // ==========================================
  get totalSedes(): number {
    return this.sedes.length;
  }

  get sedesActivas(): Sede[] {
    return this.sedes.filter((s) => s.estadoSede === 'Activo');
  }

  get totalPaginasSedes(): number {
    return Math.ceil(this.totalSedes / this.tamanioPaginaSedes) || 1;
  }

  get sedesPaginadas(): Sede[] {
    const inicio = (this.paginaSedes - 1) * this.tamanioPaginaSedes;
    return this.sedes.slice(inicio, inicio + this.tamanioPaginaSedes);
  }

  get indiceInicioSedes(): number {
    return this.totalSedes === 0 ? 0 : (this.paginaSedes - 1) * this.tamanioPaginaSedes + 1;
  }

  get indiceFinSedes(): number {
    return Math.min(this.paginaSedes * this.tamanioPaginaSedes, this.totalSedes);
  }

  get paginasVisiblesSedes(): number[] {
    const total = this.totalPaginasSedes;
    const actual = this.paginaSedes;
    const delta = 2;
    const paginas: number[] = [];
    const inicio = Math.max(1, actual - delta);
    const fin = Math.min(total, actual + delta);
    for (let i = inicio; i <= fin; i++) paginas.push(i);
    return paginas;
  }

  // ==========================================
  // GETTERS PARA CONSULTORIOS
  // ==========================================
  get totalConsultorios(): number {
    return this.consultorios.length;
  }

  get totalPaginasConsultorios(): number {
    return Math.ceil(this.totalConsultorios / this.tamanioPaginaConsultorios) || 1;
  }

  get consultoriosPaginados(): Consultorio[] {
    const inicio = (this.paginaConsultorios - 1) * this.tamanioPaginaConsultorios;
    return this.consultorios.slice(inicio, inicio + this.tamanioPaginaConsultorios);
  }

  get indiceInicioConsultorios(): number {
    return this.totalConsultorios === 0 ? 0 : (this.paginaConsultorios - 1) * this.tamanioPaginaConsultorios + 1;
  }

  get indiceFinConsultorios(): number {
    return Math.min(this.paginaConsultorios * this.tamanioPaginaConsultorios, this.totalConsultorios);
  }

  get paginasVisiblesConsultorios(): number[] {
    const total = this.totalPaginasConsultorios;
    const actual = this.paginaConsultorios;
    const delta = 2;
    const paginas: number[] = [];
    const inicio = Math.max(1, actual - delta);
    const fin = Math.min(total, actual + delta);
    for (let i = inicio; i <= fin; i++) paginas.push(i);
    return paginas;
  }

  // ==========================================
  // MÉTODOS DE PESTAÑAS Y FLUJO UNIFICADO
  // ==========================================
  seleccionarTab(tab: 'sedes' | 'consultorios'): void {
    this.tabActiva = tab;
  }

  /**
   * Navega a la pestaña de consultorios filtrando por la sede seleccionada
   */
  verConsultoriosDeSede(sede: Sede): void {
    this.tabActiva = 'consultorios';
    this.filtroSedeConsultorios = sede.idSede;
    this.busquedaConsultorio = '';
    this.paginaConsultorios = 1;
    this.cargarConsultorios();
  }

  // ==========================================
  // LÓGICA DE SEDES
  // ==========================================
  cargarSedes(): void {
    this.cargandoSedes = true;
    this.infraService.listarSedes(this.busquedaSede, this.filtroEstadoSede).subscribe({
      next: (resp) => {
        this.sedes = resp.datos || [];
        this.cargandoSedes = false;
        if (this.paginaSedes > this.totalPaginasSedes) {
          this.paginaSedes = Math.max(1, this.totalPaginasSedes);
        }
      },
      error: (err) => {
        this.cargandoSedes = false;
        console.error('Error al listar sedes:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.error?.mensaje || 'No se pudieron cargar las sedes',
          confirmButtonColor: '#3b82f6'
        });
      }
    });
  }

  onBuscarSedes(): void {
    this.paginaSedes = 1;
    this.cargarSedes();
  }

  limpiarBusquedaSedes(): void {
    if (this.busquedaSede || this.filtroEstadoSede !== 'Todos') {
      this.busquedaSede = '';
      this.filtroEstadoSede = 'Todos';
      this.paginaSedes = 1;
      this.cargarSedes();
    }
  }

  cambiarPaginaSedes(p: number): void {
    if (p >= 1 && p <= this.totalPaginasSedes && p !== this.paginaSedes) {
      this.paginaSedes = p;
    }
  }

  cambiarTamanioPaginaSedes(tam: number): void {
    this.tamanioPaginaSedes = Number(tam);
    this.paginaSedes = 1;
  }

  abrirModalCrearSede(): void {
    this.sedeSeleccionada = null;
    this.modalSedeAbierto = true;
  }

  abrirModalEditarSede(item: Sede): void {
    this.sedeSeleccionada = item;
    this.modalSedeAbierto = true;
  }

  cerrarModalSede(): void {
    this.modalSedeAbierto = false;
    this.sedeSeleccionada = null;
  }

  onSedeGuardada(): void {
    this.cargarSedes();
    // También recargar consultorios para mantener sincronizados los nombres de sedes
    this.cargarConsultorios();
  }

  cambiarEstadoSede(item: Sede): void {
    const nuevoEstado = item.estadoSede === 'Activo' ? 'Inactivo' : 'Activo';
    this.infraService.cambiarEstadoSede(item.idSede, nuevoEstado).subscribe({
      next: (resp) => {
        this.mostrarToast('success', resp.mensaje);
        this.cargarSedes();
        this.cargarConsultorios();
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.error?.mensaje || 'No se pudo cambiar el estado de la sede',
          confirmButtonColor: '#3b82f6'
        });
      }
    });
  }

  confirmarEliminarSede(item: Sede): void {
    Swal.fire({
      title: '¿Eliminar sede?',
      html: `¿Estás seguro de eliminar <strong>${item.nombreSede}</strong>?<br><span class="text-muted small">Esta acción no se puede deshacer.</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.infraService.eliminarSede(item.idSede).subscribe({
          next: (resp) => {
            this.mostrarToast('success', resp.mensaje);
            this.cargarSedes();
            this.cargarConsultorios();
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'No se puede eliminar',
              text: err.error?.mensaje || 'Error al intentar eliminar la sede',
              confirmButtonColor: '#3b82f6'
            });
          }
        });
      }
    });
  }

  // ==========================================
  // LÓGICA DE CONSULTORIOS
  // ==========================================
  cargarConsultorios(): void {
    this.cargandoConsultorios = true;
    this.infraService
      .listarConsultorios(
        this.busquedaConsultorio,
        this.filtroSedeConsultorios,
        this.filtroEstadoConsultorio
      )
      .subscribe({
        next: (resp) => {
          this.consultorios = resp.datos || [];
          this.cargandoConsultorios = false;
          if (this.paginaConsultorios > this.totalPaginasConsultorios) {
            this.paginaConsultorios = Math.max(1, this.totalPaginasConsultorios);
          }
        },
        error: (err) => {
          this.cargandoConsultorios = false;
          console.error('Error al listar consultorios:', err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err.error?.mensaje || 'No se pudieron cargar los consultorios',
            confirmButtonColor: '#3b82f6'
          });
        }
      });
  }

  onBuscarConsultorios(): void {
    this.paginaConsultorios = 1;
    this.cargarConsultorios();
  }

  limpiarBusquedaConsultorios(): void {
    if (this.busquedaConsultorio || this.filtroSedeConsultorios !== 0 || this.filtroEstadoConsultorio !== 'Todos') {
      this.busquedaConsultorio = '';
      this.filtroSedeConsultorios = 0;
      this.filtroEstadoConsultorio = 'Todos';
      this.paginaConsultorios = 1;
      this.cargarConsultorios();
    }
  }

  cambiarPaginaConsultorios(p: number): void {
    if (p >= 1 && p <= this.totalPaginasConsultorios && p !== this.paginaConsultorios) {
      this.paginaConsultorios = p;
    }
  }

  cambiarTamanioPaginaConsultorios(tam: number): void {
    this.tamanioPaginaConsultorios = Number(tam);
    this.paginaConsultorios = 1;
  }

  /**
   * Abre modal para crear consultorio validando que exista al menos una sede
   */
  abrirModalCrearConsultorio(sedeId?: number): void {
    if (this.sedes.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Primero debes registrar una Sede',
        text: 'Los consultorios deben estar asignados a una sede física. Por favor registra una sede primero.',
        confirmButtonText: 'Crear Sede Ahora',
        showCancelButton: true,
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#3b82f6',
        cancelButtonColor: '#64748b'
      }).then((result) => {
        if (result.isConfirmed) {
          this.seleccionarTab('sedes');
          this.abrirModalCrearSede();
        }
      });
      return;
    }

    this.consultorioSeleccionado = null;
    this.sedePreseleccionadaId = sedeId || null;
    this.modalConsultorioAbierto = true;
  }

  abrirModalEditarConsultorio(item: Consultorio): void {
    this.consultorioSeleccionado = item;
    this.sedePreseleccionadaId = item.sedeId;
    this.modalConsultorioAbierto = true;
  }

  cerrarModalConsultorio(): void {
    this.modalConsultorioAbierto = false;
    this.consultorioSeleccionado = null;
    this.sedePreseleccionadaId = null;
  }

  onConsultorioGuardado(): void {
    this.cargarConsultorios();
    // Actualizar también las sedes para reflejar el nuevo totalConsultorios
    this.cargarSedes();
  }

  cambiarEstadoConsultorio(item: Consultorio): void {
    const nuevoEstado = item.estadoConsultorio === 'Activo' ? 'Inactivo' : 'Activo';
    this.infraService.cambiarEstadoConsultorio(item.idConsultorio, nuevoEstado).subscribe({
      next: (resp) => {
        this.mostrarToast('success', resp.mensaje);
        this.cargarConsultorios();
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.error?.mensaje || 'No se pudo cambiar el estado del consultorio',
          confirmButtonColor: '#3b82f6'
        });
      }
    });
  }

  confirmarEliminarConsultorio(item: Consultorio): void {
    if (item.estadoConsultorio === 'Inactivo') {
      Swal.fire({
        icon: 'info',
        title: 'Consultorio Inactivo',
        text: `El consultorio "${item.nombreConsultorio}" ya se encuentra en estado Inactivo.`,
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    Swal.fire({
      title: '¿Desactivar consultorio?',
      html: `¿Estás seguro de cambiar a estado <strong>Inactivo</strong> el consultorio <strong>${item.nombreConsultorio}</strong>?<br><span class="text-muted small">No estará disponible para la asignación de citas médicas.</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.infraService.cambiarEstadoConsultorio(item.idConsultorio, 'Inactivo').subscribe({
          next: (resp) => {
            this.mostrarToast('success', resp.mensaje);
            this.cargarConsultorios();
            this.cargarSedes();
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: err.error?.mensaje || 'Error al intentar desactivar el consultorio',
              confirmButtonColor: '#3b82f6'
            });
          }
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
}
