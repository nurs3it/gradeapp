import { apiClient } from './client'

export interface Permission {
  id: string
  code: string
  name: string
  description: string
  resource: string
  action: string
}

export interface RolePermissionsResponse {
  role: string
  permission_codes: string[]
}

export const permissionsApi = {
  list: () =>
    apiClient
      .get<Permission[] | { results: Permission[] }>('/permissions/', { params: { page_size: 200 } })
      .then((r) => (Array.isArray(r.data) ? r.data : (r.data as { results?: Permission[] }).results ?? [])),

  getRolePermissions: (role: string) =>
    apiClient.get<RolePermissionsResponse>(`/roles/${role}/permissions/`).then((r) => r.data),

  setRolePermissions: (role: string, permission_codes: string[]) =>
    apiClient.put<RolePermissionsResponse>(`/roles/${role}/permissions/`, { permission_codes }).then((r) => r.data),
}
