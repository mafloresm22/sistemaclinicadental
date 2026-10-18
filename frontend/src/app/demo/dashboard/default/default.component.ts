// angular import
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

// icons
import { IconService, IconDirective } from '@ant-design/icons-angular';
import { FallOutline, GiftOutline, MessageOutline, RiseOutline, SettingOutline } from '@ant-design/icons-angular/icons';
import { CardComponent } from '../../../theme/shared/components/card/card.component';

@Component({
  selector: 'app-default',
  imports: [
    CommonModule,
    CardComponent,
    IconDirective,
  ],
  templateUrl: './default.component.html',
  styleUrls: ['./default.component.scss']
})
export class DefaultComponent {
  private iconService = inject(IconService);

  // constructor
  constructor() {
    this.iconService.addIcon(...[RiseOutline, FallOutline, SettingOutline, GiftOutline, MessageOutline]);
  }

  AnalyticEcommerce = [
    {
      title: 'Citas de Hoy',
      amount: '18',
      background: 'bg-light-primary',
      border: 'border-primary',
      icon: 'rise',
      percentage: '12%',
      color: 'text-primary',
      number: '5 completadas'
    },
    {
      title: 'Pacientes Registrados',
      amount: '342',
      background: 'bg-light-primary',
      border: 'border-primary',
      icon: 'rise',
      percentage: '8.5%',
      color: 'text-primary',
      number: '14 nuevos este mes'
    },
    {
      title: 'Tratamientos Activos',
      amount: '45',
      background: 'bg-light-warning',
      border: 'border-warning',
      icon: 'fall',
      percentage: '4.2%',
      color: 'text-warning',
      number: '8 por finalizar'
    },
    {
      title: 'Ingresos del Mes',
      amount: 'S/. 18,450',
      background: 'bg-light-primary',
      border: 'border-primary',
      icon: 'rise',
      percentage: '14.8%',
      color: 'text-primary',
      number: 'Meta mensual: 85%'
    }
  ];
}
