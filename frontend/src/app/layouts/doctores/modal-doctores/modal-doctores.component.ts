import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { SharedModule } from '../../../theme/shared/shared.module';
import { DoctoresService, Doctor, DoctorPayload } from '../../../services/doctores.service';
import { EspecialidadesService, Especialidad } from '../../../services/especialidades.service';
import { IconService } from '@ant-design/icons-angular';
import { EditOutline, UserAddOutline, InfoCircleOutline, CheckOutline, UserOutline, MedicineBoxOutline } from '@ant-design/icons-angular/icons';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-modal-doctores',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedModule],
  templateUrl: './modal-doctores.component.html',
  styleUrls: ['./modal-doctores.component.scss']
})
export class ModalDoctoresComponent implements OnInit, OnChanges {
  private fb = inject(FormBuilder);
  private doctoresService = inject(DoctoresService);
  private especialidadesService = inject(EspecialidadesService);
  private iconService = inject(IconService);

  constructor() {
    this.iconService.addIcon(EditOutline, UserAddOutline, InfoCircleOutline, CheckOutline, UserOutline, MedicineBoxOutline);
  }

  @Input() visible: boolean = false;
  @Input() doctor: Doctor | null = null;

  @Output() guardado = new EventEmitter<void>();
  @Output() cerrado = new EventEmitter<void>();

  guardando: boolean = false;
  modoEdicion: boolean = false;

  listaEspecialidades: Especialidad[] = [];
  cargandoEspecialidades: boolean = false;
  especialidadesSeleccionadas: number[] = [];

  formDoctor: FormGroup = this.fb.group({
    nombreDoctor: ['', [Validators.required, Validators.maxLength(80)]],
    apellidosDoctor: ['', [Validators.required, Validators.maxLength(100)]],
    tipoDocumento: ['DNI', [Validators.required]],
    documentoDoctor: ['', [Validators.required, Validators.maxLength(20)]],
    nroColegiatura: ['', [Validators.maxLength(30)]],
    celularDoctor: ['', [Validators.maxLength(20)]],
    correoDoctor: ['', [Validators.email, Validators.maxLength(100)]],
    especialidades: [[] as number[], [this.validarAlMenosUnaEspecialidad]]
  });

  private validarAlMenosUnaEspecialidad(control: AbstractControl) {
    const val = control.value;
    return Array.isArray(val) && val.length > 0 ? null : { required: true };
  }

  campo(nombre: string) {
    return this.formDoctor.get(nombre);
  }

  ngOnInit(): void {
    this.cargarEspecialidades();
  }

  cargarEspecialidades(): void {
    if (this.listaEspecialidades.length > 0) return;
    this.cargandoEspecialidades = true;
    this.especialidadesService.listar().subscribe({
      next: (resp) => {
        this.listaEspecialidades = resp.datos || [];
        this.cargandoEspecialidades = false;
      },
      error: () => {
        this.cargandoEspecialidades = false;
      }
    });
  }

  isEspecialidadSeleccionada(id: number): boolean {
    return this.especialidadesSeleccionadas.includes(id);
  }

  toggleEspecialidad(id: number): void {
    const index = this.especialidadesSeleccionadas.indexOf(id);
    if (index > -1) {
      this.especialidadesSeleccionadas.splice(index, 1);
    } else {
      this.especialidadesSeleccionadas.push(id);
    }
    this.formDoctor.patchValue({ especialidades: [...this.especialidadesSeleccionadas] });
    this.formDoctor.get('especialidades')?.markAsTouched();
  }

  seleccionarTodas(): void {
    this.especialidadesSeleccionadas = this.listaEspecialidades.map((e) => e.idEspecialidad);
    this.formDoctor.patchValue({ especialidades: [...this.especialidadesSeleccionadas] });
    this.formDoctor.get('especialidades')?.markAsTouched();
  }

  deseleccionarTodas(): void {
    this.especialidadesSeleccionadas = [];
    this.formDoctor.patchValue({ especialidades: [] });
    this.formDoctor.get('especialidades')?.markAsTouched();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.cargarEspecialidades();
      this.inicializarFormulario();
    }
  }

  private inicializarFormulario(): void {
    if (this.doctor) {
      this.modoEdicion = true;
      let ids: number[] = [];
      if (this.doctor.idEspecialidades) {
        ids = this.doctor.idEspecialidades
          .toString()
          .split(',')
          .map((s) => Number(s.trim()))
          .filter((n) => !isNaN(n) && n > 0);
      }
      this.especialidadesSeleccionadas = ids;

      this.formDoctor.reset({
        nombreDoctor: this.doctor.nombreDoctor,
        apellidosDoctor: this.doctor.apellidosDoctor,
        tipoDocumento: this.doctor.tipoDocumento || 'DNI',
        documentoDoctor: this.doctor.documentoDoctor,
        nroColegiatura: this.doctor.nroColegiatura || '',
        celularDoctor: this.doctor.celularDoctor || '',
        correoDoctor: this.doctor.correoDoctor || '',
        especialidades: ids
      });

      if (ids.length === 0 && this.doctor.idDoctor) {
        this.doctoresService.obtenerPorId(this.doctor.idDoctor).subscribe({
          next: (resp) => {
            if (resp.datos?.idEspecialidades) {
              const idsCargados = resp.datos.idEspecialidades
                .toString()
                .split(',')
                .map((s) => Number(s.trim()))
                .filter((n) => !isNaN(n) && n > 0);
              this.especialidadesSeleccionadas = idsCargados;
              this.formDoctor.patchValue({ especialidades: idsCargados });
            }
          }
        });
      }
    } else {
      this.modoEdicion = false;
      this.especialidadesSeleccionadas = [];
      this.formDoctor.reset({
        nombreDoctor: '',
        apellidosDoctor: '',
        tipoDocumento: 'DNI',
        documentoDoctor: '',
        nroColegiatura: '',
        celularDoctor: '',
        correoDoctor: '',
        especialidades: []
      });
    }
  }

  cerrar(): void {
    this.especialidadesSeleccionadas = [];
    this.formDoctor.reset();
    this.cerrado.emit();
  }

  guardar(): void {
    if (this.formDoctor.invalid) {
      this.formDoctor.markAllAsTouched();
      return;
    }

    const val = this.formDoctor.value;
    const payload: DoctorPayload = {
      nombreDoctor: val.nombreDoctor.trim(),
      apellidosDoctor: val.apellidosDoctor.trim(),
      tipoDocumento: val.tipoDocumento,
      documentoDoctor: val.documentoDoctor.trim(),
      nroColegiatura: val.nroColegiatura ? val.nroColegiatura.trim() : null,
      celularDoctor: val.celularDoctor ? val.celularDoctor.trim() : null,
      correoDoctor: val.correoDoctor ? val.correoDoctor.trim() : null,
      especialidades: this.especialidadesSeleccionadas
    };

    this.guardando = true;

    if (this.modoEdicion && this.doctor) {
      // Actualizar doctor existente
      this.doctoresService.actualizar(this.doctor.idDoctor, payload).subscribe({
        next: (resp) => {
          this.guardando = false;
          this.mostrarToast('success', resp.mensaje || 'Doctor actualizado con éxito');
          this.guardado.emit();
          this.cerrar();
        },
        error: (err) => {
          this.guardando = false;
          Swal.fire({
            icon: 'error',
            title: 'Atención',
            text: err.error?.mensaje || 'Error al actualizar el doctor',
            confirmButtonColor: '#2563eb'
          });
        }
      });
    } else {
      // Crear nuevo doctor (estado es automático 'Activo' en backend)
      this.doctoresService.crear(payload).subscribe({
        next: (resp) => {
          this.guardando = false;
          this.mostrarToast('success', resp.mensaje || 'Doctor registrado con éxito');
          this.guardado.emit();
          this.cerrar();
        },
        error: (err) => {
          this.guardando = false;
          Swal.fire({
            icon: 'error',
            title: 'Atención',
            text: err.error?.mensaje || 'Error al registrar el doctor',
            confirmButtonColor: '#2563eb'
          });
        }
      });
    }
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
