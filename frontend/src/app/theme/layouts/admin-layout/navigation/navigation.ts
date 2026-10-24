export interface NavigationItem {
  id: string;
  title: string;
  type: 'item' | 'collapse' | 'group';
  translate?: string;
  icon?: string;
  hidden?: boolean;
  url?: string;
  classes?: string;
  groupClasses?: string;
  exactMatch?: boolean;
  external?: boolean;
  target?: boolean;
  breadcrumbs?: boolean;
  children?: NavigationItem[];
  link?: string;
  description?: string;
  path?: string;
}

export const NavigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'inicio',
        title: 'Inicio',
        type: 'item',
        classes: 'nav-item',
        url: '/dashboard/inicio',
        icon: 'home',
        breadcrumbs: false
      }
    ]
  },
  {
    id: 'catalogo',
    title: 'Catalogo',
    type: 'group',
    icon: 'home',
    children: [
      {
        id: 'especialidad',
        title: 'Especialidades',
        type: 'item',
        classes: 'nav-item',
        url: '/especialidades',
        icon: 'build'
      },
      {
        id: 'infraestructura',
        title: 'Infraestructura',
        type: 'item',
        classes: 'nav-item',
        url: '/infraestructura',
        icon: 'home'
      },
      {
        id: 'tratamientos',
        title: 'Tratamientos',
        type: 'item',
        classes: 'nav-item',
        url: '/tratamientos',
        icon: 'heart'
      }
    ]
  },
  {
    id: 'gestion',
    title: 'Gestión',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'pacientes',
        title: 'Pacientes',
        type: 'item',
        classes: 'nav-item',
        url: '/pacientes',
        icon: 'solution'
      },
      {
        id: 'citas',
        title: 'Citas',
        type: 'item',
        classes: 'nav-item',
        url: '/citas',
        icon: 'calendar'
      },
      {
        id: 'doctores',
        title: 'Doctores',
        type: 'item',
        classes: 'nav-item',
        url: '/doctores',
        icon: 'user-add'
      }
    ]
  },
  {
    id: 'odontologia',
    title: 'Odontología',
    type: 'group',
    icon: 'smile',
    children: [
      {
        id: 'odontogramas',
        title: 'Odontogramas',
        type: 'item',
        classes: 'nav-item',
        url: '/odontogramas',
        icon: 'audit'
      },
      {
        id: 'piezas-dentales',
        title: 'Piezas Dentales',
        type: 'collapse',
        icon: 'appstore',
        children: [
          {
            id: 'listado-piezas',
            title: 'Listado de Piezas',
            type: 'item',
            classes: 'nav-item',
            url: '/piezas-dentales'
          },
          {
            id: 'encias',
            title: 'Encías',
            type: 'item',
            classes: 'nav-item',
            url: '/piezas-dentales/encias'
          }
        ]
      }
    ]
  }
];
