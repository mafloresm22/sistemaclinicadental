import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../../theme/shared/shared.module';
import { EspecialidadesService, Especialidad } from '../../../services/especialidades.service';
import { IconService } from '@ant-design/icons-angular';
import { EditOutline, PlusCircleOutline, CheckOutline } from '@ant-design/icons-angular/icons';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-modal-especialidad',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedModule],
  templateUrl: './modal-especialidad.component.html',
  styleUrls: ['./modal-especialidad.component.scss']
})
export class ModalEspecialidadComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private especialidadesService = inject(EspecialidadesService);
  private iconService = inject(IconService);

  constructor() {
    this.iconService.addIcon(EditOutline, PlusCircleOutline, CheckOutline);
  }

  @Input() visible: boolean = false;
  @Input() especialidad: Especialidad | null = null;

  @Output() guardado = new EventEmitter<void>();
  @Output() cerrado = new EventEmitter<void>();

  guardando: boolean = false;
  modoEdicion: boolean = false;

  formEspecialidad: FormGroup = this.fb.group({
    nombreEspecialidad: ['', [Validators.required, Validators.maxLength(100)]],
    descripcionEspecialidad: ['', [Validators.maxLength(200)]]
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.inicializarFormulario();
    }
  }

  private inicializarFormulario(): void {
    if (this.especialidad) {
      this.modoEdicion = true;
      this.formEspecialidad.reset({
        nombreEspecialidad: this.especialidad.nombreEspecialidad,
        descripcionEspecialidad: this.especialidad.descripcionEspecialidad || ''
      });
    } else {
      this.modoEdicion = false;
      this.formEspecialidad.reset({
        nombreEspecialidad: '',
        descripcionEspecialidad: ''
      });
    }
  }

  cerrar(): void {
    this.formEspecialidad.reset();
    this.cerrado.emit();
  }

  guardar(): void {
    if (this.formEspecialidad.invalid) {
      this.formEspecialidad.markAllAsTouched();
      return;
    }

    const payload = {
      nombreEspecialidad: this.formEspecialidad.value.nombreEspecialidad.trim(),
      descripcionEspecialidad: this.formEspecialidad.value.descripcionEspecialidad?.trim() || 'Ninguno'
    };

    this.guardando = true;

    if (this.modoEdicion && this.especialidad) {
      // Actualizar especialidad existente
      this.especialidadesService.actualizar(this.especialidad.idEspecialidad, payload).subscribe({
        next: (resp) => {
          this.guardando = false;
          this.mostrarToast('success', resp.mensaje || 'Especialidad actualizada con éxito');
          this.guardado.emit();
          this.cerrar();
        },
        error: (err) => {
          this.guardando = false;
          Swal.fire({
            icon: 'error',
            title: 'Atención',
            text: err.error?.mensaje || 'Error al actualizar la especialidad',
            confirmButtonColor: '#3b82f6'
          });
        }
      });
    } else {
      // Crear nueva especialidad
      this.especialidadesService.crear(payload).subscribe({
        next: (resp) => {
          this.guardando = false;
          this.mostrarToast('success', resp.mensaje || 'Especialidad creada con éxito');
          this.guardado.emit();
          this.cerrar();
        },
        error: (err) => {
          this.guardando = false;
          Swal.fire({
            icon: 'error',
            title: 'Atención',
            text: err.error?.mensaje || 'Error al registrar la especialidad',
            confirmButtonColor: '#3b82f6'
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
