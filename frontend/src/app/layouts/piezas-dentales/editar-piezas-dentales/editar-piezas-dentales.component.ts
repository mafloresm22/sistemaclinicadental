import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../theme/shared/shared.module';
import { PiezasDentalesService, PiezaDental } from '../../../services/piezas-dentales.service';
import { ModalEditarPiezaComponent } from '../modal-editar-pieza/modal-editar-pieza.component';
import { IconService } from '@ant-design/icons-angular';
import {
  AppstoreOutline,
  SearchOutline,
  CloseCircleOutline,
  EditOutline,
  InfoCircleOutline,
  FilterOutline,
  SyncOutline,
  InboxOutline,
  CheckOutline,
  CloseOutline,
  TableOutline
} from '@ant-design/icons-angular/icons';

export interface InfoClinicaPieza {
  tipo: 'Incisivo' | 'Canino' | 'Premolar' | 'Molar';
  colorClass: string;
  badgeClass: string;
  funcion: string;
  imagen: string;
}

@Component({
  selector: 'app-editar-piezas-dentales',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, ModalEditarPiezaComponent],
  templateUrl: './editar-piezas-dentales.component.html',
  styleUrls: ['./editar-piezas-dentales.component.scss']
})
export class EditarPiezasDentalesComponent implements OnInit {
  private piezasService = inject(PiezasDentalesService);
  private iconService = inject(IconService);

  constructor() {
    this.iconService.addIcon(
      AppstoreOutline,
      SearchOutline,
      CloseCircleOutline,
      EditOutline,
      InfoCircleOutline,
      FilterOutline,
      SyncOutline,
      InboxOutline,
      CheckOutline,
      CloseOutline,
      TableOutline
    );
  }

  // Estado de datos
  piezas: PiezaDental[] = [];
  cargando: boolean = false;

  // Filtros
  terminoBusqueda: string = '';
  filtroDenticion: string = ''; // '' | 'adulto' | 'infantil'
  filtroArcada: string = ''; // '' | 'Superior' | 'Inferior'
  filtroCuadrante: string = ''; // '' | '1'..'8'
  filtroGrupo: string = ''; // '' | 'Incisivo' | 'Canino' | 'Premolar' | 'Molar'

  // Paginación
  paginaActual: number = 1;
  tamanioPagina: number = 10;
  tamaniosPagina: number[] = [10, 20, 52];

  // Modal de edición
  modalEdicionVisible: boolean = false;
  piezaParaEditar: PiezaDental | null = null;

  ngOnInit(): void {
    this.cargarPiezas();
  }

  cargarPiezas(): void {
    this.cargando = true;
    this.piezasService.listar().subscribe({
      next: (resp) => {
        this.piezas = resp.datos || [];
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar piezas dentales:', err);
        this.cargando = false;
      }
    });
  }

  // Métricas
  get totalPiezas(): number {
    return this.piezas.length;
  }

  get totalPermanentes(): number {
    return this.piezas.filter((p) => p.cuadrante <= 4).length;
  }

  get totalDeciduas(): number {
    return this.piezas.filter((p) => p.cuadrante >= 5).length;
  }

  // Determinar tipo anatómico
  getTipoPieza(idPieza: number): 'Incisivo' | 'Canino' | 'Premolar' | 'Molar' {
    const unidad = idPieza % 10;
    if (unidad === 1 || unidad === 2) return 'Incisivo';
    if (unidad === 3) return 'Canino';
    if (unidad === 4 || unidad === 5) {
      const cuad = Math.floor(idPieza / 10);
      return cuad <= 4 ? 'Premolar' : 'Molar';
    }
    return 'Molar';
  }

  getInfoClinica(pieza: PiezaDental): InfoClinicaPieza {
    const tipo = this.getTipoPieza(pieza.idPieza);
    const sufijo = pieza.arcada === 'Superior' ? 'sup' : 'inf';

    let colorClass = 'text-primary';
    let badgeClass = 'badge-incisivo';
    let funcion = 'Corte de alimentos y estética';
    let imagen = `assets/images/teeth/incisivo-${sufijo}.svg`;

    switch (tipo) {
      case 'Canino':
        colorClass = 'text-warning';
        badgeClass = 'badge-canino';
        funcion = 'Desgarro de alimentos';
        imagen = `assets/images/teeth/canino-${sufijo}.svg`;
        break;
      case 'Premolar':
        colorClass = 'text-success';
        badgeClass = 'badge-premolar';
        funcion = 'Trituración intermedia';
        imagen = `assets/images/teeth/premolar-${sufijo}.svg`;
        break;
      case 'Molar':
        colorClass = 'text-purple';
        badgeClass = 'badge-molar';
        funcion = 'Molienda principal de alimentos';
        imagen = `assets/images/teeth/molar-${sufijo}.svg`;
        break;
    }

    return { tipo, colorClass, badgeClass, funcion, imagen };
  }

  // Listado filtrado
  get piezasFiltradas(): PiezaDental[] {
    return this.piezas.filter((p) => {
      // Filtro dentición
      if (this.filtroDenticion === 'adulto' && p.cuadrante > 4) return false;
      if (this.filtroDenticion === 'infantil' && p.cuadrante <= 4) return false;

      // Filtro grupo anatómico
      if (this.filtroGrupo && this.getTipoPieza(p.idPieza) !== this.filtroGrupo) {
        return false;
      }

      // Filtro arcada
      if (this.filtroArcada && p.arcada !== this.filtroArcada) {
        return false;
      }

      // Filtro cuadrante
      if (this.filtroCuadrante && p.cuadrante.toString() !== this.filtroCuadrante) {
        return false;
      }

      // Término de búsqueda (FDI o nombre)
      if (this.terminoBusqueda) {
        const termino = this.terminoBusqueda.toLowerCase().trim();
        const coincideNombre = p.nombrePieza.toLowerCase().includes(termino);
        const coincideId = p.idPieza.toString().includes(termino);
        if (!coincideNombre && !coincideId) return false;
      }

      return true;
    });
  }

  // Paginación
  get totalRegistros(): number {
    return this.piezasFiltradas.length;
  }

  get totalPaginas(): number {
    return Math.ceil(this.totalRegistros / this.tamanioPagina) || 1;
  }

  get indiceInicio(): number {
    if (this.totalRegistros === 0) return 0;
    return (this.paginaActual - 1) * this.tamanioPagina + 1;
  }

  get indiceFin(): number {
    return Math.min(this.paginaActual * this.tamanioPagina, this.totalRegistros);
  }

  get piezasPaginadas(): PiezaDental[] {
    const inicio = (this.paginaActual - 1) * this.tamanioPagina;
    return this.piezasFiltradas.slice(inicio, inicio + this.tamanioPagina);
  }

  get paginasVisibles(): (number | string)[] {
    const total = this.totalPaginas;
    const actual = this.paginaActual;
    const paginas: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) paginas.push(i);
    } else {
      paginas.push(1);
      if (actual > 3) paginas.push('...');
      const inicio = Math.max(2, actual - 1);
      const fin = Math.min(total - 1, actual + 1);
      for (let i = inicio; i <= fin; i++) paginas.push(i);
      if (actual < total - 2) paginas.push('...');
      paginas.push(total);
    }
    return paginas;
  }

  irAPagina(pag: number | string): void {
    if (typeof pag !== 'number') return;
    if (pag >= 1 && pag <= this.totalPaginas) {
      this.paginaActual = pag;
    }
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) {
      this.paginaActual--;
    }
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) {
      this.paginaActual++;
    }
  }

  cambiarTamanioPagina(nuevoTamanio: number): void {
    this.tamanioPagina = Number(nuevoTamanio);
    this.paginaActual = 1;
  }

  limpiarFiltros(): void {
    this.terminoBusqueda = '';
    this.filtroDenticion = '';
    this.filtroArcada = '';
    this.filtroCuadrante = '';
    this.filtroGrupo = '';
    this.paginaActual = 1;
  }

  // Edición
  abrirModalEditar(pieza: PiezaDental): void {
    this.piezaParaEditar = { ...pieza };
    this.modalEdicionVisible = true;
  }

  cerrarModalEdicion(): void {
    this.modalEdicionVisible = false;
    this.piezaParaEditar = null;
  }

  onPiezaGuardada(piezaActualizada: PiezaDental): void {
    const idx = this.piezas.findIndex((p) => p.idPieza === piezaActualizada.idPieza);
    if (idx !== -1) {
      this.piezas[idx] = { ...piezaActualizada };
    }
  }
}
