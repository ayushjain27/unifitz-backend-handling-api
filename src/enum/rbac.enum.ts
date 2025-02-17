export enum ACL {
  STORE_CREATE = 'store:write',
  STORE_GET_ALL = 'store:read_all',
  STORE_GET_OWNER = 'store:read_owner',
  STORE_GET_SINGLE = 'store:read_single',
  STORE_REVIEW_CREATE = 'store_review:create',
  STORE_UPDATE_STATUS = 'store:update_status',
  CUSTOMER_CREATE = 'customer:create',
  FILE_UPLOAD = 'file:upload',
  NOTIFICATION_SEND = 'notification:send_owner',
  CUSTOMER_GET_ALL = 'customer:get_all',
  ADVERTISEMENT_CREATE = 'advertisement:write',
  ADVERTISEMENT_GET_CUSTOMER = 'advertisement:customer',
  ADD_VEHICLE = 'vehicle:create',
  ADMIN_USER_CREATE = 'Admin:Create',
  GET_VEHICLE = 'vehicle:all'
}
