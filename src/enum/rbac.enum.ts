export enum ACL {
  STORE_CREATE = 'store:write',
  STORE_GET_ALL = 'store:read_all',
  STORE_GET_OWNER = 'store:read_owner',
  STORE_GET_SINGLE = 'store:read_single',
  STORE_REVIEW_CREATE = 'store_review:create',
  STORE_UPDATE_STATUS = 'store:update_status',
  CUSTOMER_CREATE = 'customer:create',
  FILE_UPLOAD = 'file:upload'
}
