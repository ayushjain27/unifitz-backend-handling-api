import { ACL } from '../enum/rbac.enum';

/* eslint-disable */
export const RBAC_MAP: any = {
  admin: [ACL.STORE_CREATE],
  store_owner: [ACL.STORE_CREATE],
  user: [ACL.STORE_GET]
};
