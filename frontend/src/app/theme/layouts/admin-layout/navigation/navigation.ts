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
        icon: 'heart'
      }
    ]
  }
];
