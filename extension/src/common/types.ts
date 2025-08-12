export type Scope = 'WINDOW' | 'ALL_WINDOWS'

export interface UserDTO {
  email: string
  photoUrl?: string
}

export interface TabDTO {
  id: string
  title: string
  url: string
  tabIndex: number
  windowIndex: number
  createdAt: string
}

export interface SessionDTO {
  id: string
  name: string
  isStarred: boolean
  isWindowSession: boolean
  createdAt: string
  updatedAt: string
  tabs?: TabDTO[]
}

export interface CreateSessionPayload {
  name: string
  isWindowSession: boolean
  tabs: Array<Pick<TabDTO,'title'|'url'|'tabIndex'|'windowIndex'>>
}

export interface CreateTabPayload {
  title?: string
  url: string
  tabIndex: number
  windowIndex: number
}
