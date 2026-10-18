import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../services/auth.service';
import { IconDirective, IconService } from '@ant-design/icons-angular';
import Swal from 'sweetalert2';
import {
  CalendarOutline,
  MedicineBoxOutline,
  TeamOutline,
  CreditCardOutline,
  BarChartOutline,
  EyeOutline,
  EyeInvisibleOutline
} from '@ant-design/icons-angular/icons';

@Component({
  selector: 'app-auth-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, IconDirective],
  templateUrl: './auth-login.component.html',
  styleUrl: './auth-login.component.scss'
})
export class AuthLoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private iconService = inject(IconService);

  constructor() {
    this.iconService.addIcon(
      CalendarOutline,
      MedicineBoxOutline,
      TeamOutline,
      CreditCardOutline,
      BarChartOutline,
      EyeOutline,
      EyeInvisibleOutline
    );
  }

  readonly caracteristicas = [
    { icon: 'calendar', texto: 'Gestión de citas y agenda médica' },
    { icon: 'medicine-box', texto: 'Odontograma digital FDI' },
    { icon: 'team', texto: 'Historial clínico de pacientes' },
    { icon: 'credit-card', texto: 'Cobros, pagos y comprobantes' },
    { icon: 'bar-chart', texto: 'Reportes y estadísticas' }
  ];

  loginForm: FormGroup = this.fb.group({
    nombreUsuario: ['', [Validators.required]],
    password: ['', [Validators.required]],
    rememberMe: [false]
  });

  cargando: boolean = false;
  mensajeError: string = '';
  mostrarPassword: boolean = false;

  togglePassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.cargando = true;
    this.mensajeError = '';

    const { nombreUsuario, password } = this.loginForm.value;

    this.authService.login({ nombreUsuario, password }).subscribe({
      next: (res) => {
        this.cargando = false;
        if (res.success) {
          const nombreUsuario = res.usuario?.nombreUsuario;

          Swal.fire({
            icon: 'success',
            title: '¡Bienvenido al Sistema!',
            text: `Hola, ${nombreUsuario}`,
            showConfirmButton: false,
            timer: 1600,
            timerProgressBar: true
          }).then(() => {
            this.router.navigate(['/dashboard/inicio']);
          });
        }
      },
      error: (err) => {
        this.cargando = false;
        if (err.error && err.error.mensaje) {
          this.mensajeError = err.error.mensaje;
        } else if (err.status === 0) {
          this.mensajeError = 'No se pudo conectar con el servidor';
        } else {
          this.mensajeError = 'Credenciales incorrectas o error al iniciar sesión';
        }
      }
    });
  }
}