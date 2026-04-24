export interface QueryOrgUnitsParam {
  account: string
  password: string
  code: string
}

export interface ListSelectOrgunit {
  tid: string
  tname: string
  ouid: string
  ouname: string
  status: number
  uid: string
  uname: string
  nname: string
  dname: string
  rids: string[]
  rnames: string[]
  pids: string[]
}

export interface AccountAuthParam {
  account: string
  password: string
  code: string
  tid: string
  uid: string
  ouid: string
  rids: string[]
  pids: string[]
}
