import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../../theme/shared/shared.module';
import { TratamientosService, Tratamiento, TratamientoPayload } from '../../../services/tratamientos.service';
import { IconService } from '@ant-design/icons-angular';
import { EditOutline, PlusCircleOutline, CheckOutline, MedicineBoxOutline } from '@ant-design/icons-angular/icons';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-modal-tratamientos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedModule],
  templateUrl: './modal-tratamientos.component.html',
  styleUrls: ['./modal-tratamientos.component.scss']
})
export class ModalTratamientosComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private tratamientosService = inject(TratamientosService);
  private iconService = inject(IconService);

  constructor() {
    this.iconService.addIcon(EditOutline, PlusCircleOutline, CheckOutline, MedicineBoxOutline);
  }

  @Input() visible: boolean = false;
  @Input() tratamiento: Tratamiento | null = null;

  @Output() guardado = new EventEmitter<void>();
  @Output() cerrado = new EventEmitter<void>();

  guardando: boolean = false;
  modoEdicion: boolean = false;

  formTratamiento: FormGroup = this.fb.group({
    nombreTratamiento: ['', [Validators.required, Validators.maxLength(120)]],
    descripcionTratamiento: ['', [Validators.maxLength(255)]],
    duracionEstimadaMin: [null, [Validators.min(1), Validators.pattern(/^\d+$/)]],
    costoBase: [null, [Validators.required, Validators.min(0)]]
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.inicializarFormulario();
    }
  }

  private inicializarFormulario(): void {
    if (this.tratamiento) {
      this.modoEdicion = true;
      this.formTratamiento.reset({
        nombreTratamiento: this.tratamiento.nombreTratamiento,
        descripcionTratamiento: this.tratamiento.descripcionTratamiento || '',
        duracionEstimadaMin: this.tratamiento.duracionEstimadaMin ?? null,
        costoBase: this.tratamiento.costoBase
      });
    } else {
      this.modoEdicion = false;
      this.formTratamiento.reset({
        nombreTratamiento: '',
        descripcionTratamiento: '',
        duracionEstimadaMin: null,
        costoBase: null
      });
    }
  }

  cerrar(): void {
    this.formTratamiento.reset();
    this.cerrado.emit();
  }

  guardar(): void {
    if (this.formTratamiento.invalid) {
      this.formTratamiento.markAllAsTouched();
      return;
    }

    const raw = this.formTratamiento.value;
    const payload: TratamientoPayload = {
      nombreTratamiento: raw.nombreTratamiento.trim(),
      descripcionTratamiento: raw.descripcionTratamiento?.trim() || null,
      duracionEstimadaMin: raw.duracionEstimadaMin ? Number(raw.duracionEstimadaMin) : null,
      costoBase: Number(raw.costoBase)
    };

    this.guardando = true;

    if (this.modoEdicion && this.tratamiento) {
      this.tratamientosService.actualizar(this.tratamiento.idTratamiento, payload).subscribe({
        next: (resp) => {
          this.guardando = false;
          this.mostrarToast('success', resp.mensaje || 'Tratamiento actualizado con éxito');
          this.guardado.emit();
          this.cerrar();
        },
        error: (err) => {
          this.guardando = false;
          Swal.fire({
            icon: 'error',
            title: 'Atención',
            text: err.error?.mensaje || 'Error al actualizar el tratamiento',
            confirmButtonColor: '#3b82f6'
          });
        }
      });
    } else {
      this.tratamientosService.crear(payload).subscribe({
        next: (resp) => {
          this.guardando = false;
          this.mostrarToast('success', resp.mensaje || 'Tratamiento creado con éxito');
          this.guardado.emit();
          this.cerrar();
        },
        error: (err) => {
          this.guardando = false;
          Swal.fire({
            icon: 'error',
            title: 'Atención',
            text: err.error?.mensaje || 'Error al registrar el tratamiento',
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
