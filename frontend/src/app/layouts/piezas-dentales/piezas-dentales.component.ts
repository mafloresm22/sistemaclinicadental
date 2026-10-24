import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../theme/shared/shared.module';
import { PiezasDentalesService, PiezaDental } from '../../services/piezas-dentales.service';
import { IconService } from '@ant-design/icons-angular';
import {
  AppstoreOutline,
  SearchOutline,
  CloseCircleOutline,
  InfoCircleOutline,
  CheckOutline,
  CloseOutline,
  EyeOutline,
  FilterOutline,
  SyncOutline,
  SmileOutline,
  InboxOutline,
  ArrowLeftOutline,
  ArrowRightOutline,
  CaretUpOutline,
  CaretDownOutline,
  AimOutline,
  ClusterOutline,
  GoldOutline,
  HistoryOutline
} from '@ant-design/icons-angular/icons';

export interface InfoClinicaPieza {
  tipo: 'Incisivo' | 'Canino' | 'Premolar' | 'Molar';
  colorClass: string;
  badgeClass: string;
  funcion: string;
  raices: string;
  cuspides: string;
  erupcion: string;
  imagen: string;
}

@Component({
  selector: 'app-piezas-dentales',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule],
  templateUrl: './piezas-dentales.component.html',
  styleUrls: ['./piezas-dentales.component.scss']
})
export class PiezasDentalesComponent implements OnInit {
  private piezasService = inject(PiezasDentalesService);
  private iconService = inject(IconService);

  constructor() {
    this.iconService.addIcon(
      AppstoreOutline,
      SearchOutline,
      CloseCircleOutline,
      InfoCircleOutline,
      CheckOutline,
      CloseOutline,
      EyeOutline,
      FilterOutline,
      SyncOutline,
      SmileOutline,
      InboxOutline,
      ArrowLeftOutline,
      ArrowRightOutline,
      CaretUpOutline,
      CaretDownOutline,
      AimOutline,
      ClusterOutline,
      GoldOutline,
      HistoryOutline
    );
  }

  // Estado de datos
  piezas: PiezaDental[] = [];
  cargando: boolean = false;

  // Filtros y modos de visualización
  vistaActual: 'boca' | 'cuadrantes' = 'boca';
  tipoDenticion: 'adulto' | 'infantil' = 'adulto';
  filtroGrupoActivo: string = ''; // 'Incisivo' | 'Canino' | 'Premolar' | 'Molar' | ''

  // Pieza seleccionada para ficha técnica clínica
  piezaSeleccionada: PiezaDental | null = null;

  ngOnInit(): void {
    this.cargarPiezas();
  }

  cargarPiezas(): void {
    this.cargando = true;
    this.piezasService.listar().subscribe({
      next: (resp) => {
        this.piezas = resp.datos || [];
        this.cargando = false;
        // Seleccionar por defecto el primer molar superior derecho (#16) si existe
        if (!this.piezaSeleccionada && this.piezas.length > 0) {
          const predeterminada = this.piezas.find((p) => p.idPieza === 16) || this.piezas[0];
          this.piezaSeleccionada = predeterminada;
        }
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

  // Colecciones por cuadrantes (orden anatómico odontológico estricto)
  // Arcada Superior: Q1 (18..11 derecha de paciente) | Q2 (21..28 izquierda de paciente)
  get piezasQ1(): PiezaDental[] {
    return this.piezas.filter((p) => p.cuadrante === 1).sort((a, b) => b.idPieza - a.idPieza);
  }

  get piezasQ2(): PiezaDental[] {
    return this.piezas.filter((p) => p.cuadrante === 2).sort((a, b) => a.idPieza - b.idPieza);
  }

  // Arcada Inferior: Q4 (48..41 derecha de paciente) | Q3 (31..38 izquierda de paciente)
  get piezasQ4(): PiezaDental[] {
    return this.piezas.filter((p) => p.cuadrante === 4).sort((a, b) => b.idPieza - a.idPieza);
  }

  get piezasQ3(): PiezaDental[] {
    return this.piezas.filter((p) => p.cuadrante === 3).sort((a, b) => a.idPieza - b.idPieza);
  }

  // Dentición Temporal (Deciduos / Infantil)
  get piezasQ5(): PiezaDental[] {
    return this.piezas.filter((p) => p.cuadrante === 5).sort((a, b) => b.idPieza - a.idPieza);
  }

  get piezasQ6(): PiezaDental[] {
    return this.piezas.filter((p) => p.cuadrante === 6).sort((a, b) => a.idPieza - b.idPieza);
  }

  get piezasQ8(): PiezaDental[] {
    return this.piezas.filter((p) => p.cuadrante === 8).sort((a, b) => b.idPieza - a.idPieza);
  }

  get piezasQ7(): PiezaDental[] {
    return this.piezas.filter((p) => p.cuadrante === 7).sort((a, b) => a.idPieza - b.idPieza);
  }

  // Cuadrantes activos según dentición seleccionada
  get cuadranteSupDer(): PiezaDental[] {
    return this.tipoDenticion === 'adulto' ? this.piezasQ1 : this.piezasQ5;
  }

  get cuadranteSupIzq(): PiezaDental[] {
    return this.tipoDenticion === 'adulto' ? this.piezasQ2 : this.piezasQ6;
  }

  get cuadranteInfDer(): PiezaDental[] {
    return this.tipoDenticion === 'adulto' ? this.piezasQ4 : this.piezasQ8;
  }

  get cuadranteInfIzq(): PiezaDental[] {
    return this.tipoDenticion === 'adulto' ? this.piezasQ3 : this.piezasQ7;
  }

  // Funciones anatómicas y clínicas de utilidad
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
    const esDecidua = pieza.cuadrante >= 5;

    let colorClass = 'text-primary';
    let badgeClass = 'badge-incisivo';
    let funcion = 'Corte de alimentos, soporte peribucal y estética de la sonrisa.';
    let raices = '1 raíz cónica recta y estilizada.';
    let cuspides = 'Borde incisal cortante horizontal.';
    let erupcion = esDecidua ? '6 a 12 meses de edad' : '6 a 8 años de edad';
    let imagen = `assets/images/teeth/incisivo-${sufijo}.svg`;

    switch (tipo) {
      case 'Canino':
        colorClass = 'text-warning';
        badgeClass = 'badge-canino';
        funcion = 'Desgarro de alimentos duros y guía de desoclusión canina protectora.';
        raices = '1 raíz única potente (la raíz más larga y anclada de la boca).';
        cuspides = '1 cúspide prominente cónica con vertientes mesial y distal.';
        erupcion = esDecidua ? '16 a 20 meses de edad' : '11 a 12 años de edad';
        imagen = `assets/images/teeth/canino-${sufijo}.svg`;
        break;

      case 'Premolar':
        colorClass = 'text-success';
        badgeClass = 'badge-premolar';
        funcion = 'Trituración y fragmentación intermedia de alimentos antes de la molienda.';
        raices = pieza.idPieza === 14 || pieza.idPieza === 24
          ? '2 raíces bifurcadas (vestibular y palatina).'
          : '1 raíz cónica ligeramente aplanada.';
        cuspides = '2 cúspides funcionales (cúspide vestibular y cúspide lingual).';
        erupcion = '10 a 12 años de edad (reemplazan a los molares temporales)';
        imagen = `assets/images/teeth/premolar-${sufijo}.svg`;
        break;

      case 'Molar':
        colorClass = 'text-purple';
        badgeClass = 'badge-molar';
        funcion = 'Trituración fina y molienda principal de la masticación.';
        raices = pieza.arcada === 'Superior'
          ? '3 raíces anatómicas divergentes (2 vestibulares y 1 palatina ancha).'
          : '2 raíces robustas (1 raíz mesial con doble conducto y 1 distal).';
        cuspides = '4 a 5 cúspides oclusales con surco principal y fosas anatómicas.';
        erupcion = esDecidua
          ? '13 a 24 meses de edad'
          : (pieza.idPieza % 10 === 6 ? '6 años (1er molar)' : pieza.idPieza % 10 === 7 ? '12 años (2do molar)' : '18 a 25 años (Muela del juicio)');
        imagen = `assets/images/teeth/molar-${sufijo}.svg`;
        break;
    }

    return { tipo, colorClass, badgeClass, funcion, raices, cuspides, erupcion, imagen };
  }

  // Manejo de interacción
  seleccionarPieza(pieza: PiezaDental): void {
    this.piezaSeleccionada = pieza;
  }

  toggleFiltroGrupo(grupo: string): void {
    if (this.filtroGrupoActivo === grupo) {
      this.filtroGrupoActivo = '';
    } else {
      this.filtroGrupoActivo = grupo;
    }
  }

  esPiezaAtenuada(pieza: PiezaDental): boolean {
    if (!this.filtroGrupoActivo) return false;
    return this.getTipoPieza(pieza.idPieza) !== this.filtroGrupoActivo;
  }
}
