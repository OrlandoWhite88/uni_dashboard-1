export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path?: string;
  onClick?: () => void;
  isActive?: boolean;
}

export interface NavigationSection {
  id: string;
  title: string;
  items: NavigationItem[];
}

export interface Organization {
  id: string;
  name: string;
  icon?: string;
}

export interface NavigationSidebarProps {
  className?: string;
  organizationName?: string;
  organizations?: Organization[];
  onOrganizationChange?: (organization: Organization) => void;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  sections?: NavigationSection[];
}
