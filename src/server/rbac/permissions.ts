export const Resources = {
  ORGANIZATION: "organization",
  MEMBERS: "members",
  ROLES: "roles",
  SETTINGS: "settings",
} as const;

export const Actions = {
  CREATE: "create",
  READ: "read",
  UPDATE: "update",
  DELETE: "delete",
  MANAGE: "manage",
  INVITE: "invite",
  REMOVE: "remove",
  ASSIGN: "assign",
} as const;

export const Permissions = {
  organization: {
    read: "organization:read",
    update: "organization:update",
    manage: "organization:manage",
  },
  members: {
    read: "members:read",
    invite: "members:invite",
    remove: "members:remove",
    manage: "members:manage",
  },
  roles: {
    read: "roles:read",
    assign: "roles:assign",
    manage: "roles:manage",
  },
  settings: {
    read: "settings:read",
    update: "settings:update",
  },
} as const;

export type PermissionString =
  | "organization:read"
  | "organization:update"
  | "organization:manage"
  | "members:read"
  | "members:invite"
  | "members:remove"
  | "members:manage"
  | "roles:read"
  | "roles:assign"
  | "roles:manage"
  | "settings:read"
  | "settings:update";

export const ALL_PERMISSIONS: PermissionString[] = [
  Permissions.organization.read,
  Permissions.organization.update,
  Permissions.organization.manage,
  Permissions.members.read,
  Permissions.members.invite,
  Permissions.members.remove,
  Permissions.members.manage,
  Permissions.roles.read,
  Permissions.roles.assign,
  Permissions.roles.manage,
  Permissions.settings.read,
  Permissions.settings.update,
];

export interface RoleDefinition {
  name: string;
  slug: string;
  description: string;
  permissions: PermissionString[];
}

export const DEFAULT_ROLES: RoleDefinition[] = [
  {
    name: "Owner",
    slug: "owner",
    description: "Full access to all organization resources and settings",
    permissions: [...ALL_PERMISSIONS],
  },
  {
    name: "Administrator",
    slug: "admin",
    description: "Full access to manage resources but cannot delete the organization",
    permissions: [
      Permissions.organization.read,
      Permissions.organization.update,
      Permissions.members.read,
      Permissions.members.invite,
      Permissions.members.remove,
      Permissions.members.manage,
      Permissions.roles.read,
      Permissions.roles.assign,
      Permissions.settings.read,
      Permissions.settings.update,
    ],
  },
  {
    name: "Manager",
    slug: "manager",
    description: "Can manage members and view organization settings",
    permissions: [
      Permissions.organization.read,
      Permissions.members.read,
      Permissions.members.invite,
      Permissions.roles.read,
      Permissions.settings.read,
    ],
  },
  {
    name: "Engineer",
    slug: "engineer",
    description: "Can access core engineering features and settings",
    permissions: [
      Permissions.organization.read,
      Permissions.members.read,
      Permissions.roles.read,
      Permissions.settings.read,
      Permissions.settings.update,
    ],
  },
  {
    name: "Viewer",
    slug: "viewer",
    description: "Read-only access to organization resources",
    permissions: [
      Permissions.organization.read,
      Permissions.members.read,
      Permissions.roles.read,
      Permissions.settings.read,
    ],
  },
];
