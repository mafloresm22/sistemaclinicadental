// angular import
import { Component, output, inject, input } from '@angular/core';
import { RouterModule } from '@angular/router';

// project import
import { SharedModule } from '../../../../shared/shared.module';
import { AuthService } from '../../../../../services/auth.service';
import Swal from 'sweetalert2';

// icon
import { IconService } from '@ant-design/icons-angular';
import {
  BellOutline,
  LogoutOutline,
  EditOutline,
  UserOutline,
  GithubOutline
} from '@ant-design/icons-angular/icons';

@Component({
  selector: 'app-nav-right',
  imports: [SharedModule, RouterModule],
  templateUrl: './nav-right.component.html',
  styleUrls: ['./nav-right.component.scss']
})
export class NavRightComponent {
  private iconService = inject(IconService);
  private authService = inject(AuthService);

  usuario$ = this.authService.usuarioActual$;

  logout(): void {
    Swal.fire({
      title: '¿Cerrar sesión?',
      text: '¿Estás seguro de que deseas salir del sistema?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.authService.logout();
      }
    });
  }

  onProfileItemClick(task: { icon: string; title: string }): void {
    if (task.icon === 'logout') {
      this.logout();
    }
  }

  // public props
  styleSelectorToggle = input<boolean>();

  readonly Customize = output();
  windowWidth: number;
  screenFull: boolean = true;
  direction: string = 'ltr';

  // constructor
  constructor() {
    this.windowWidth = window.innerWidth;
    this.iconService.addIcon(
      ...[
        LogoutOutline,
        EditOutline,
        UserOutline,
        BellOutline,
        GithubOutline,
      ]
    );
  }

  profile = [
    {
      icon: 'edit',
      title: 'Editar Perfil'
    },
    {
      icon: 'user',
      title: 'Ver Perfil'
    },
    {
      icon: 'logout',
      title: 'Cerrar Sesión'
    }
  ];
}
