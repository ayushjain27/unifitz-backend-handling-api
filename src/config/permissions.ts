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
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    OEM_ANALYTICS: {
      STATUS: 'OEM & EMPLOYEE',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    STORES: {
      STATUS: 'ALL',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    STORE_LEAD_GENERATION: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    VIDEOUPLOAD: {
      STATUS: 'ALL',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    SPARE_POST_REQUIREMENT: {
      STATUS: 'ALL',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    CUSTOMER: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    VEHICLES_OWNED: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    VEHICLES_BUY_SELL: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    ADMIN_PRODUCT_AND_SERVICES: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    PRELIST_PRODUCT_AND_SERVICES: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    B2B_PARTNER_PRODUCT: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    CATEGORY: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    PLUS_FEATURES_EVENT: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    PLUS_FEATURES_OFFERS: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    PLUS_FEATURES_BUSINESS_OPPORTUNITIES: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    PLUS_FEATURES_SCHOOL_OF_AUTO: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    OEM_OFFERS: {
      STATUS: 'OEM & EMPLOYEE',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    B2B_PARTNERS: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    REPORT: {
      STATUS: 'ALL',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    REPORT_NOTES: {
      STATUS: 'ALL',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    RATING_AND_REVIEWS: {
      STATUS: 'ALL',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    PERMISSION: {
      STATUS: 'ADMIN AND OEM',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    USER: {
      STATUS: 'ADMIN AND OEM',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    USER_PROFILE: {
      STATUS: 'OEM AND EMPLOYEE',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    PLUS_FEATURES: {
      STATUS: 'ADMIN AND EMPLOYEE',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    ADVERTISEMENTS: {
      STATUS: 'ADMIN AND EMPLOYEE',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    OEM_PRODUCTS: {
      STATUS: 'OEM & EMPLOYEE',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    VEHICLES: {
      STATUS: 'ADMIN AND EMPLOYEE',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    NEW_VEHICLES: {
      STATUS: 'ALL',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    ORDERS: {
      STATUS: 'ALL',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
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
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    OEM_ANALYTICS: {
      STATUS: 'OEM & EMPLOYEE',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    STORES: {
      STATUS: 'ALL',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    STORE_LEAD_GENERATION: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    SPARE_POST_REQUIREMENT: {
      STATUS: 'ALL',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    VIDEOUPLOAD: {
      STATUS: 'ALL',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    CUSTOMER: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    VEHICLES_OWNED: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    VEHICLES_BUY_SELL: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    ADMIN_PRODUCT_AND_SERVICES: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    PRELIST_PRODUCT_AND_SERVICES: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    B2B_PARTNER_PRODUCT: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    CATEGORY: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    PLUS_FEATURES_EVENT: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    PLUS_FEATURES_OFFERS: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    PLUS_FEATURES_BUSINESS_OPPORTUNITIES: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    PLUS_FEATURES_SCHOOL_OF_AUTO: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    OEM_OFFERS: {
      STATUS: 'OEM & EMPLOYEE',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    B2B_PARTNERS: {
      STATUS: 'ADMIN & EMPLOYEE',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    REPORT: {
      STATUS: 'ALL',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    REPORT_NOTES: {
      STATUS: 'ALL',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    RATING_AND_REVIEWS: {
      STATUS: 'ALL',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    PERMISSION: {
      STATUS: 'ADMIN AND OEM',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    USER: {
      STATUS: 'ADMIN AND OEM',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    USER_PROFILE: {
      STATUS: 'OEM AND EMPLOYEE',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    PLUS_FEATURES: {
      STATUS: 'ADMIN AND EMPLOYEE',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    ADVERTISEMENTS: {
      STATUS: 'ADMIN AND EMPLOYEE',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    OEM_PRODUCTS: {
      STATUS: 'OEM & EMPLOYEE',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    VEHICLES: {
      STATUS: 'ADMIN AND EMPLOYEE',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    NEW_VEHICLES: {
      STATUS: 'ALL',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    ORDERS: {
      STATUS: 'ALL',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    B2B_DISTRIBUTORS: {
      STATUS: 'OEM & EMPLOYEE',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    }
  },
  PARTNER_EMPLOYEE: {
    DASHBOARD: {
      CREATE: true,
      READ: true,
      UPDATE: true,
      DELETE: true
    },
    ANALYTICS: {
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    BUY_SELL: {
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    PRODUCT_AND_SERVICES: {
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    SPARE_POST_REQUIREMENT: {
      STATUS: 'ALL',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    EVENTS: {
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    OFFERS: {
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    BUSINESS_OPPORTUNITIES: {
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    AUTO_NEWS: {
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    RATING_AND_REVIEWS: {
      STATUS: 'ALL',
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    BUY_SPARES: {
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    JOB_CARD: {
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    },
    ENQUIRY_MANAGEMENT: {
      CREATE: false,
      READ: false,
      UPDATE: false,
      DELETE: false
    }
  }
};
