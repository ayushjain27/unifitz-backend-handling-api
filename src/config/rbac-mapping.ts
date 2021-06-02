import { ACL } from '../enum/rbac.enum';

/* eslint-disable */
export const RBAC_MAP: any = {
  admin: [ACL.STORE_CREATE, ACL.STORE_GET],
  store_owner: [ACL.STORE_GET, ACL.STORE_CREATE, ACL.STORE_GET_OWNER],
  user: [ACL.STORE_GET, ACL.STORE_REVIEW_CREATE]
};
