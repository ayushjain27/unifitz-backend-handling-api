export const permissions: any = {
  EMPLOYEE: {
    DASHBOARD: {
      STATUS: 'ALL',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    ADMIN_ANALYTICS: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    OEM_ANALYTICS: {
      STATUS: 'OEM & EMPLOYEE',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    STORES: {
      STATUS: 'ALL',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    CUSTOMER: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    VEHICLES_OWNED: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    VEHICLES_BUY_SELL: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    ADMIN_PRODUCT_AND_SERVICES: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    PRELIST_PRODUCT_AND_SERVICES: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    B2B_PARTNER_PRODUCT: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    CATEGORY: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    PLUS_FEATURES_EVENT: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    PLUS_FEATURES_OFFERS: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    PLUS_FEATURES_BUSINESS_OPPORTUNITIES: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    PLUS_FEATURES_SCHOOL_OF_AUTO: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    OEM_OFFERS: {
      STATUS: 'OEM & EMPLOYEE',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    B2B_PARTNERS: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    REPORT: {
      STATUS: 'ALL',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    REPORT_NOTES: {
      STATUS: 'ALL',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    RATING_AND_REVIEWS: {
      STATUS: 'ALL',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    PERMISSION: {
      STATUS: 'ADMIN AND OEM',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    USER: {
      STATUS: 'ADMIN AND OEM',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    USER_PROFILE: {
      STATUS: 'OEM AND EMPLOYEE',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    PLUS_FEATURES: {
      STATUS: 'ADMIN AND EMPLOYEE',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    ADVERTISEMENTS: {
      STATUS: 'ADMIN AND EMPLOYEE',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    OEM_PRODUCTS: {
      STATUS: 'OEM & EMPLOYEE',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    VEHICLES: {
      STATUS: 'ADMIN AND EMPLOYEE',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    NEW_VEHICLES: {
      STATUS: 'ALL',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    }
  },
  OEM: {
    DASHBOARD: {
      STATUS: 'ALL',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    ADMIN_ANALYTICS: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    OEM_ANALYTICS: {
      STATUS: 'OEM & EMPLOYEE',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    STORES: {
      STATUS: 'ALL',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    CUSTOMER: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    VEHICLES_OWNED: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    VEHICLES_BUY_SELL: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    ADMIN_PRODUCT_AND_SERVICES: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    PRELIST_PRODUCT_AND_SERVICES: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    B2B_PARTNER_PRODUCT: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    CATEGORY: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    PLUS_FEATURES_EVENT: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    PLUS_FEATURES_OFFERS: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    PLUS_FEATURES_BUSINESS_OPPORTUNITIES: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    PLUS_FEATURES_SCHOOL_OF_AUTO: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    OEM_OFFERS: {
      STATUS: 'OEM & EMPLOYEE',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    B2B_PARTNERS: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    REPORT: {
      STATUS: 'ALL',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    REPORT_NOTES: {
      STATUS: 'ALL',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    RATING_AND_REVIEWS: {
      STATUS: 'ALL',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    PERMISSION: {
      STATUS: 'ADMIN AND OEM',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    USER: {
      STATUS: 'ADMIN AND OEM',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    USER_PROFILE: {
      STATUS: 'OEM AND EMPLOYEE',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    PLUS_FEATURES: {
      STATUS: 'ADMIN AND EMPLOYEE',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    ADVERTISEMENTS: {
      STATUS: 'ADMIN AND EMPLOYEE',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    OEM_PRODUCTS: {
      STATUS: 'OEM & EMPLOYEE',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    VEHICLES: {
      STATUS: 'ADMIN AND EMPLOYEE',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    NEW_VEHICLES: {
      STATUS: 'ALL',
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    }
  }
};
