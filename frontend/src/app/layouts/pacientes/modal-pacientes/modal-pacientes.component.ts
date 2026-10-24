import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  inject,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule
} from '@angular/forms';
import { SharedModule } from '../../../theme/shared/shared.module';
import {
  PacientesService,
  Paciente,
  PacientePayload,
  Antecedente,
  TipoAntecedente,
  TipoDocumento,
  SexoPaciente
} from '../../../services/pacientes.service';
import { IconService } from '@ant-design/icons-angular';
import {
  EditOutline,
  UserAddOutline,
  InfoCircleOutline,
  CheckOutline,
  UserOutline,
  MedicineBoxOutline,
  PlusOutline,
  DeleteOutline,
  SearchOutline,
  CloseOutline,
  AlertOutline,
  CalendarOutline,
  PhoneOutline,
  MailOutline,
  HomeOutline
} from '@ant-design/icons-angular/icons';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-modal-pacientes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SharedModule],
  templateUrl: './modal-pacientes.component.html',
  styleUrls: ['./modal-pacientes.component.scss']
})
export class ModalPacientesComponent implements OnInit, OnChanges {
  private fb = inject(FormBuilder);
  private pacientesService = inject(PacientesService);
  private iconService = inject(IconService);

  constructor() {
    this.iconService.addIcon(
      EditOutline,
      UserAddOutline,
      InfoCircleOutline,
      CheckOutline,
      UserOutline,
      MedicineBoxOutline,
      PlusOutline,
      DeleteOutline,
      SearchOutline,
      CloseOutline,
      AlertOutline,
      CalendarOutline,
      PhoneOutline,
      MailOutline,
      HomeOutline
    );
  }

  @Input() visible: boolean = false;
  @Input() paciente: Paciente | null = null;

  @Output() guardado = new EventEmitter<void>();
  @Output() cerrado = new EventEmitter<void>();

  guardando: boolean = false;
  modoEdicion: boolean = false;
  tabActiva: 'datos' | 'antecedentes' = 'datos';

  // Menor de edad y apoderado
  esMenorDeEdad: boolean = false;
  edadCalculada: number | null = null;
  busquedaApoderado: string = '';
  buscandoApoderados: boolean = false;
  apoderadosSugeridos: Paciente[] = [];
  apoderadoSeleccionado: Paciente | null = null;

  // Antecedentes en memoria (creación) o sincronizados (edición)
  listaAntecedentes: Antecedente[] = [];
  nuevoTipoAntecedente: TipoAntecedente = 'Alergia';
  nuevaDescripcionAntecedente: string = '';

  tiposDocumento: TipoDocumento[] = ['DNI', 'CE', 'Pasaporte'];
  sexos: SexoPaciente[] = ['Masculino', 'Femenino', 'Otro'];
  tiposAntecedente: TipoAntecedente[] = ['Alergia', 'Enfermedad', 'Medicacion', 'Cirugia', 'Otro'];

  formPaciente: FormGroup = this.fb.group({
    nombrePaciente: ['', [Validators.required, Validators.maxLength(80)]],
    apellidosPaciente: ['', [Validators.required, Validators.maxLength(100)]],
    tipoDocumento: ['DNI', [Validators.required]],
    documentoPaciente: ['', [Validators.required, Validators.maxLength(20)]],
    fechaNacimientoPaciente: [''],
    sexoPaciente: ['Masculino'],
    celularPaciente: ['', [Validators.maxLength(20)]],
    correoPaciente: ['', [Validators.email, Validators.maxLength(120)]],
    direccionPaciente: ['', [Validators.maxLength(200)]],
    contactoEmergenciaNombre: ['', [Validators.maxLength(100)]],
    contactoEmergenciaCelular: ['', [Validators.maxLength(20)]],
    apoderadoId: [null]
  });

  campo(nombre: string) {
    return this.formPaciente.get(nombre);
  }

  ngOnInit(): void {
    // Escuchar cambios en la fecha de nacimiento para calcular edad en tiempo real
    this.formPaciente.get('fechaNacimientoPaciente')?.valueChanges.subscribe((fecha) => {
      this.evaluarEdadYMenor(fecha);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.tabActiva = 'datos';
      if (this.paciente) {
        this.modoEdicion = true;
        this.formPaciente.patchValue({
          nombrePaciente: this.paciente.nombrePaciente,
          apellidosPaciente: this.paciente.apellidosPaciente,
          tipoDocumento: this.paciente.tipoDocumento || 'DNI',
          documentoPaciente: this.paciente.documentoPaciente,
          fechaNacimientoPaciente: this.paciente.fechaNacimientoPaciente
            ? this.paciente.fechaNacimientoPaciente.substring(0, 10)
            : '',
          sexoPaciente: this.paciente.sexoPaciente || 'Masculino',
          celularPaciente: this.paciente.celularPaciente || '',
          correoPaciente: this.paciente.correoPaciente || '',
          direccionPaciente: this.paciente.direccionPaciente || '',
          contactoEmergenciaNombre: this.paciente.contactoEmergenciaNombre || '',
          contactoEmergenciaCelular: this.paciente.contactoEmergenciaCelular || '',
          apoderadoId: this.paciente.apoderadoId || null
        });

        this.evaluarEdadYMenor(this.paciente.fechaNacimientoPaciente);

        if (this.paciente.apoderadoId && this.paciente.apoderadoNombre) {
          this.apoderadoSeleccionado = {
            idPaciente: this.paciente.apoderadoId,
            nombrePaciente: this.paciente.apoderadoNombre,
            apellidosPaciente: '',
            tipoDocumento: 'DNI',
            documentoPaciente: '',
            estadoPaciente: 'Activo'
          };
          this.busquedaApoderado = this.paciente.apoderadoNombre;
        } else {
          this.apoderadoSeleccionado = null;
          this.busquedaApoderado = '';
        }

        // Cargar antecedentes si existen
        this.listaAntecedentes = this.paciente.antecedentes ? [...this.paciente.antecedentes] : [];
        if (this.paciente.idPaciente) {
          this.recargarAntecedentes(this.paciente.idPaciente);
        }
      } else {
        this.modoEdicion = false;
        this.resetearFormulario();
      }
    }
  }

  evaluarEdadYMenor(fechaStr: string | null | undefined): void {
    if (!fechaStr) {
      this.esMenorDeEdad = false;
      this.edadCalculada = null;
      return;
    }
    const hoy = new Date();
    const nac = new Date(fechaStr);
    if (isNaN(nac.getTime())) {
      this.esMenorDeEdad = false;
      this.edadCalculada = null;
      return;
    }

    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) {
      edad--;
    }
    this.edadCalculada = edad >= 0 ? edad : 0;
    this.esMenorDeEdad = this.edadCalculada < 18;

    if (!this.esMenorDeEdad && !this.modoEdicion) {
      this.formPaciente.patchValue({ apoderadoId: null });
      this.apoderadoSeleccionado = null;
      this.busquedaApoderado = '';
    }
  }

  // ── Buscador de Apoderado ───────────────────────────────────
  buscarApoderados(): void {
    const termino = this.busquedaApoderado.trim();
    if (termino.length < 2) {
      this.apoderadosSugeridos = [];
      return;
    }

    this.buscandoApoderados = true;
    this.pacientesService.listar(termino, 'Activo').subscribe({
      next: (resp) => {
        // Filtrar para no sugerirse a sí mismo
        const actualId = this.paciente?.idPaciente;
        this.apoderadosSugeridos = (resp.datos || []).filter(
          (p) => !actualId || p.idPaciente !== actualId
        );
        this.buscandoApoderados = false;
      },
      error: () => {
        this.buscandoApoderados = false;
      }
    });
  }

  seleccionarApoderado(apoderado: Paciente): void {
    this.apoderadoSeleccionado = apoderado;
    this.busquedaApoderado = `${apoderado.nombrePaciente} ${apoderado.apellidosPaciente} (${apoderado.tipoDocumento}: ${apoderado.documentoPaciente})`;
    this.formPaciente.patchValue({ apoderadoId: apoderado.idPaciente });
    this.apoderadosSugeridos = [];
  }

  limpiarApoderado(): void {
    this.apoderadoSeleccionado = null;
    this.busquedaApoderado = '';
    this.formPaciente.patchValue({ apoderadoId: null });
    this.apoderadosSugeridos = [];
  }

  // ── Manejo de Antecedentes ──────────────────────────────────
  agregarAntecedente(): void {
    if (!this.nuevaDescripcionAntecedente.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Descripción requerida',
        text: 'Por favor, describe el antecedente (ej: Alergia a la penicilina, Diabetes tipo 2).',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    const nuevo: Antecedente = {
      tipoAntecedente: this.nuevoTipoAntecedente,
      descripcionAntecedente: this.nuevaDescripcionAntecedente.trim()
    };

    // Si estamos en edición y el paciente ya existe en BD, lo registramos vía API
    if (this.modoEdicion && this.paciente?.idPaciente) {
      this.pacientesService.agregarAntecedente(this.paciente.idPaciente, nuevo).subscribe({
        next: (resp) => {
          this.listaAntecedentes.unshift(resp.datos);
          this.nuevaDescripcionAntecedente = '';
          Swal.fire({
            icon: 'success',
            title: 'Antecedente añadido',
            timer: 1500,
            showConfirmButton: false
          });
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err.error?.mensaje || 'No se pudo agregar el antecedente'
          });
        }
      });
    } else {
      // Modo creación: se acumula en el array para el POST integral
      this.listaAntecedentes.push(nuevo);
      this.nuevaDescripcionAntecedente = '';
    }
  }

  quitarAntecedente(index: number, ant: Antecedente): void {
    // Si ya existe en base de datos
    if (ant.idAntecedente && this.paciente?.idPaciente) {
      Swal.fire({
        title: '¿Eliminar antecedente?',
        text: `Se eliminará "${ant.tipoAntecedente}: ${ant.descripcionAntecedente}" de la historia clínica.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed && this.paciente?.idPaciente && ant.idAntecedente) {
          this.pacientesService.eliminarAntecedente(this.paciente.idPaciente, ant.idAntecedente).subscribe({
            next: () => {
              this.listaAntecedentes.splice(index, 1);
              Swal.fire({
                icon: 'success',
                title: 'Eliminado',
                timer: 1400,
                showConfirmButton: false
              });
            },
            error: (err) => {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err.error?.mensaje || 'No se pudo eliminar el antecedente'
              });
            }
          });
        }
      });
    } else {
      // En modo creación simplemente lo retiramos de la lista
      this.listaAntecedentes.splice(index, 1);
    }
  }

  recargarAntecedentes(idPaciente: number): void {
    this.pacientesService.listarAntecedentes(idPaciente).subscribe({
      next: (resp) => {
        this.listaAntecedentes = resp.datos || [];
      }
    });
  }

  // ── Guardar Paciente ───────────────────────────────────────
  guardar(): void {
    if (this.formPaciente.invalid) {
      this.formPaciente.markAllAsTouched();
      this.tabActiva = 'datos';
      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Por favor complete todos los campos obligatorios marcados en rojo.',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    const formVal = this.formPaciente.value;

    const payload: PacientePayload = {
      nombrePaciente: formVal.nombrePaciente.trim(),
      apellidosPaciente: formVal.apellidosPaciente.trim(),
      tipoDocumento: formVal.tipoDocumento,
      documentoPaciente: formVal.documentoPaciente.trim(),
      fechaNacimientoPaciente: formVal.fechaNacimientoPaciente || null,
      sexoPaciente: formVal.sexoPaciente || null,
      celularPaciente: formVal.celularPaciente ? formVal.celularPaciente.trim() : null,
      correoPaciente: formVal.correoPaciente ? formVal.correoPaciente.trim() : null,
      direccionPaciente: formVal.direccionPaciente ? formVal.direccionPaciente.trim() : null,
      contactoEmergenciaNombre: formVal.contactoEmergenciaNombre ? formVal.contactoEmergenciaNombre.trim() : null,
      contactoEmergenciaCelular: formVal.contactoEmergenciaCelular ? formVal.contactoEmergenciaCelular.trim() : null,
      apoderadoId: formVal.apoderadoId || null,
      antecedentes: this.listaAntecedentes.map((a) => ({
        tipoAntecedente: a.tipoAntecedente,
        descripcionAntecedente: a.descripcionAntecedente
      }))
    };

    this.guardando = true;

    if (this.modoEdicion && this.paciente?.idPaciente) {
      this.pacientesService.actualizar(this.paciente.idPaciente, payload).subscribe({
        next: () => {
          this.guardando = false;
          Swal.fire({
            icon: 'success',
            title: '¡Actualizado!',
            text: 'Los datos del paciente han sido actualizados con éxito.',
            timer: 1800,
            showConfirmButton: false
          });
          this.guardado.emit();
          this.cerrar();
        },
        error: (err) => {
          this.guardando = false;
          Swal.fire({
            icon: 'error',
            title: 'Error al actualizar',
            text: err.error?.mensaje || 'Ocurrió un error inesperado al actualizar el paciente.'
          });
        }
      });
    } else {
      this.pacientesService.crear(payload).subscribe({
        next: () => {
          this.guardando = false;
          Swal.fire({
            icon: 'success',
            title: '¡Registrado!',
            text: 'El paciente y sus antecedentes se registraron exitosamente.',
            timer: 1800,
            showConfirmButton: false
          });
          this.guardado.emit();
          this.cerrar();
        },
        error: (err) => {
          this.guardando = false;
          Swal.fire({
            icon: 'error',
            title: 'Error al registrar',
            text: err.error?.mensaje || 'Ocurrió un error al registrar el paciente.'
          });
        }
      });
    }
  }

  cerrar(): void {
    this.resetearFormulario();
    this.cerrado.emit();
  }

  resetearFormulario(): void {
    this.formPaciente.reset({
      tipoDocumento: 'DNI',
      sexoPaciente: 'Masculino',
      apoderadoId: null
    });
    this.listaAntecedentes = [];
    this.apoderadoSeleccionado = null;
    this.busquedaApoderado = '';
    this.esMenorDeEdad = false;
    this.edadCalculada = null;
    this.guardando = false;
    this.tabActiva = 'datos';
  }

  getColorBadgeAntecedente(tipo: TipoAntecedente): string {
    switch (tipo) {
      case 'Alergia':
        return 'badge-danger';
      case 'Enfermedad':
        return 'badge-warning';
      case 'Medicacion':
        return 'badge-info';
      case 'Cirugia':
        return 'badge-primary';
      default:
        return 'badge-secondary';
    }
  }
}
