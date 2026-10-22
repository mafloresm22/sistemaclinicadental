import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../../theme/shared/shared.module';
import { DoctoresService, Doctor, DoctorPayload } from '../../../services/doctores.service';
import { IconService } from '@ant-design/icons-angular';
import { EditOutline, UserAddOutline, InfoCircleOutline, CheckOutline, UserOutline } from '@ant-design/icons-angular/icons';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-modal-doctores',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedModule],
  templateUrl: './modal-doctores.component.html',
  styleUrls: ['./modal-doctores.component.scss']
})
export class ModalDoctoresComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private doctoresService = inject(DoctoresService);
  private iconService = inject(IconService);

  constructor() {
    this.iconService.addIcon(EditOutline, UserAddOutline, InfoCircleOutline, CheckOutline, UserOutline);
  }

  @Input() visible: boolean = false;
  @Input() doctor: Doctor | null = null;

  @Output() guardado = new EventEmitter<void>();
  @Output() cerrado = new EventEmitter<void>();

  guardando: boolean = false;
  modoEdicion: boolean = false;

  formDoctor: FormGroup = this.fb.group({
    nombreDoctor: ['', [Validators.required, Validators.maxLength(80)]],
    apellidosDoctor: ['', [Validators.required, Validators.maxLength(100)]],
    tipoDocumento: ['DNI', [Validators.required]],
    documentoDoctor: ['', [Validators.required, Validators.maxLength(20)]],
    nroColegiatura: ['', [Validators.maxLength(30)]],
    celularDoctor: ['', [Validators.maxLength(20)]],
    correoDoctor: ['', [Validators.email, Validators.maxLength(100)]]
  });

  campo(nombre: string) {
    return this.formDoctor.get(nombre);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.inicializarFormulario();
    }
  }

  private inicializarFormulario(): void {
    if (this.doctor) {
      this.modoEdicion = true;
      this.formDoctor.reset({
        nombreDoctor: this.doctor.nombreDoctor,
        apellidosDoctor: this.doctor.apellidosDoctor,
        tipoDocumento: this.doctor.tipoDocumento || 'DNI',
        documentoDoctor: this.doctor.documentoDoctor,
        nroColegiatura: this.doctor.nroColegiatura || '',
        celularDoctor: this.doctor.celularDoctor || '',
        correoDoctor: this.doctor.correoDoctor || ''
      });
    } else {
      this.modoEdicion = false;
      this.formDoctor.reset({
        nombreDoctor: '',
        apellidosDoctor: '',
        tipoDocumento: 'DNI',
        documentoDoctor: '',
        nroColegiatura: '',
        celularDoctor: '',
        correoDoctor: ''
      });
    }
  }

  cerrar(): void {
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
      correoDoctor: val.correoDoctor ? val.correoDoctor.trim() : null
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
