import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../../theme/shared/shared.module';
import { PiezasDentalesService, PiezaDental } from '../../../services/piezas-dentales.service';
import { IconService } from '@ant-design/icons-angular';
import { EditOutline, CheckOutline, CloseOutline, InfoCircleOutline } from '@ant-design/icons-angular/icons';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-modal-editar-pieza',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedModule],
  templateUrl: './modal-editar-pieza.component.html',
  styleUrls: ['./modal-editar-pieza.component.scss']
})
export class ModalEditarPiezaComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private piezasService = inject(PiezasDentalesService);
  private iconService = inject(IconService);

  constructor() {
    this.iconService.addIcon(EditOutline, CheckOutline, CloseOutline, InfoCircleOutline);
  }

  @Input() visible: boolean = false;
  @Input() pieza: PiezaDental | null = null;

  @Output() guardado = new EventEmitter<PiezaDental>();
  @Output() cerrado = new EventEmitter<void>();

  guardando: boolean = false;

  formPieza: FormGroup = this.fb.group({
    nombrePieza: ['', [Validators.required, Validators.maxLength(60)]]
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible && this.pieza) {
      this.formPieza.reset({
        nombrePieza: this.pieza.nombrePieza
      });
    }
  }

  campo(nombre: string) {
    return this.formPieza.get(nombre);
  }

  cerrar(): void {
    this.cerrado.emit();
  }

  guardar(): void {
    if (!this.pieza || this.formPieza.invalid || this.guardando) {
      this.formPieza.markAllAsTouched();
      return;
    }

    const nuevoNombre = this.formPieza.value.nombrePieza.trim();
    if (nuevoNombre === this.pieza.nombrePieza) {
      this.cerrar();
      return;
    }

    this.guardando = true;

    this.piezasService.actualizar(this.pieza.idPieza, nuevoNombre).subscribe({
      next: (resp) => {
        this.guardando = false;
        Swal.fire({
          icon: 'success',
          title: 'Pieza Dental Actualizada',
          text: `La pieza FDI #${resp.datos.idPieza} se actualizó correctamente.`,
          timer: 2000,
          showConfirmButton: false
        });
        this.guardado.emit(resp.datos);
        this.cerrar();
      },
      error: (err) => {
        this.guardando = false;
        const msg = err.error?.mensaje || 'No se pudo actualizar el nombre de la pieza dental.';
        Swal.fire({
          icon: 'error',
          title: 'Error al actualizar',
          text: msg
        });
      }
    });
  }
}
