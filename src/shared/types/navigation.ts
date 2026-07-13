export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface SidebarItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
  isActive?: boolean;
}

export interface PageMeta {
  title: string;
  description: string;
  breadcrumbs: BreadcrumbItem[];
}
