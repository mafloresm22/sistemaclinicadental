import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../../theme/shared/shared.module';
import { InfraestructuraService, Consultorio, ConsultorioPayload, Sede } from '../../../services/infraestructura.service';
import { IconService } from '@ant-design/icons-angular';
import { EditOutline, PlusCircleOutline, CheckOutline, AlertOutline } from '@ant-design/icons-angular/icons';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-modal-consultorio',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedModule],
  templateUrl: './modal-consultorio.component.html',
  styleUrls: ['./modal-consultorio.component.scss']
})
export class ModalConsultorioComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private infraService = inject(InfraestructuraService);
  private iconService = inject(IconService);

  constructor() {
    this.iconService.addIcon(EditOutline, PlusCircleOutline, CheckOutline, AlertOutline);
  }

  @Input() visible: boolean = false;
  @Input() consultorio: Consultorio | null = null;
  @Input() sedesDisponibles: Sede[] = [];
  @Input() sedePreseleccionadaId: number | null = null;

  @Output() guardado = new EventEmitter<void>();
  @Output() cerrado = new EventEmitter<void>();
  @Output() solicitarCrearSede = new EventEmitter<void>();

  guardando: boolean = false;
  modoEdicion: boolean = false;

  formConsultorio: FormGroup = this.fb.group({
    nombreConsultorio: ['', [Validators.required, Validators.maxLength(80)]],
    sedeId: [null, [Validators.required]]
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.inicializarFormulario();
    }
  }

  private inicializarFormulario(): void {
    if (this.consultorio) {
      this.modoEdicion = true;
      this.formConsultorio.reset({
        nombreConsultorio: this.consultorio.nombreConsultorio,
        sedeId: this.consultorio.sedeId
      });
    } else {
      this.modoEdicion = false;
      const idInicial = this.sedePreseleccionadaId || (this.sedesDisponibles.length > 0 ? this.sedesDisponibles[0].idSede : null);
      this.formConsultorio.reset({
        nombreConsultorio: '',
        sedeId: idInicial
      });
    }
  }

  cerrar(): void {
    this.formConsultorio.reset();
    this.cerrado.emit();
  }

  irACrearSede(): void {
    this.cerrar();
    this.solicitarCrearSede.emit();
  }

  guardar(): void {
    if (this.formConsultorio.invalid) {
      this.formConsultorio.markAllAsTouched();
      return;
    }

    const payload: ConsultorioPayload = {
      nombreConsultorio: this.formConsultorio.value.nombreConsultorio.trim(),
      sedeId: Number(this.formConsultorio.value.sedeId),
      estadoConsultorio: this.modoEdicion && this.consultorio ? this.consultorio.estadoConsultorio : 'Activo'
    };

    this.guardando = true;

    if (this.modoEdicion && this.consultorio) {
      this.infraService.actualizarConsultorio(this.consultorio.idConsultorio, payload).subscribe({
        next: (resp) => {
          this.guardando = false;
          this.mostrarToast('success', resp.mensaje || 'Consultorio actualizado con éxito');
          this.guardado.emit();
          this.cerrar();
        },
        error: (err) => {
          this.guardando = false;
          Swal.fire({
            icon: 'error',
            title: 'Atención',
            text: err.error?.mensaje || 'Error al actualizar el consultorio',
            confirmButtonColor: '#3b82f6'
          });
        }
      });
    } else {
      this.infraService.crearConsultorio(payload).subscribe({
        next: (resp) => {
          this.guardando = false;
          this.mostrarToast('success', resp.mensaje || 'Consultorio creado con éxito');
          this.guardado.emit();
          this.cerrar();
        },
        error: (err) => {
          this.guardando = false;
          Swal.fire({
            icon: 'error',
            title: 'Atención',
            text: err.error?.mensaje || 'Error al registrar el consultorio',
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
