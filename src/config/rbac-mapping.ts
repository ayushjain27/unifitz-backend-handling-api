import { ACL } from '../enum/rbac.enum';

/* eslint-disable */
export const RBAC_MAP: any = {
  admin: [ACL.STORE_CREATE, ACL.STORE_GET_ALL, ACL.STORE_GET_SINGLE],
  store_owner: [ACL.STORE_CREATE, ACL.STORE_GET_OWNER, ACL.STORE_GET_SINGLE],
  user: [ACL.STORE_GET_ALL, ACL.STORE_REVIEW_CREATE, ACL.STORE_GET_SINGLE]
};
