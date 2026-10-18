import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../../theme/shared/shared.module';
import { InfraestructuraService, Sede, SedePayload } from '../../../services/infraestructura.service';
import { IconService } from '@ant-design/icons-angular';
import { EditOutline, PlusCircleOutline, CheckOutline } from '@ant-design/icons-angular/icons';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-modal-sedes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedModule],
  templateUrl: './modal-sedes.component.html',
  styleUrls: ['./modal-sedes.component.scss']
})
export class ModalSedesComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private infraService = inject(InfraestructuraService);
  private iconService = inject(IconService);

  constructor() {
    this.iconService.addIcon(EditOutline, PlusCircleOutline, CheckOutline);
  }

  @Input() visible: boolean = false;
  @Input() sede: Sede | null = null;

  @Output() guardado = new EventEmitter<void>();
  @Output() cerrado = new EventEmitter<void>();

  guardando: boolean = false;
  modoEdicion: boolean = false;

  formSede: FormGroup = this.fb.group({
    nombreSede: ['', [Validators.required, Validators.maxLength(100)]],
    direccionSede: ['', [Validators.maxLength(200)]],
    telefonoSede: ['', [Validators.maxLength(20)]]
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.inicializarFormulario();
    }
  }

  private inicializarFormulario(): void {
    if (this.sede) {
      this.modoEdicion = true;
      this.formSede.reset({
        nombreSede: this.sede.nombreSede,
        direccionSede: this.sede.direccionSede || '',
        telefonoSede: this.sede.telefonoSede || ''
      });
    } else {
      this.modoEdicion = false;
      this.formSede.reset({
        nombreSede: '',
        direccionSede: '',
        telefonoSede: ''
      });
    }
  }

  cerrar(): void {
    this.formSede.reset();
    this.cerrado.emit();
  }

  guardar(): void {
    if (this.formSede.invalid) {
      this.formSede.markAllAsTouched();
      return;
    }

    const direccionVal = this.formSede.value.direccionSede?.trim();
    const telefonoVal = this.formSede.value.telefonoSede?.trim();

    const payload: SedePayload = {
      nombreSede: this.formSede.value.nombreSede.trim(),
      direccionSede: direccionVal ? direccionVal : 'Ninguno',
      telefonoSede: telefonoVal ? telefonoVal : 'Ninguno',
      estadoSede: this.modoEdicion && this.sede ? this.sede.estadoSede : 'Activo'
    };

    this.guardando = true;

    if (this.modoEdicion && this.sede) {
      this.infraService.actualizarSede(this.sede.idSede, payload).subscribe({
        next: (resp) => {
          this.guardando = false;
          this.mostrarToast('success', resp.mensaje || 'Sede actualizada con éxito');
          this.guardado.emit();
          this.cerrar();
        },
        error: (err) => {
          this.guardando = false;
          Swal.fire({
            icon: 'error',
            title: 'Atención',
            text: err.error?.mensaje || 'Error al actualizar la sede',
            confirmButtonColor: '#3b82f6'
          });
        }
      });
    } else {
      this.infraService.crearSede(payload).subscribe({
        next: (resp) => {
          this.guardando = false;
          this.mostrarToast('success', resp.mensaje || 'Sede creada con éxito');
          this.guardado.emit();
          this.cerrar();
        },
        error: (err) => {
          this.guardando = false;
          Swal.fire({
            icon: 'error',
            title: 'Atención',
            text: err.error?.mensaje || 'Error al registrar la sede',
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

    Toast.fire({ icon, title });
  }
}
