export const SUBSCRIPTION_TIERS = {
  FREE: {
    maxProjects: 2,
    maxZones: 5,
    maxDevices: 10
  },
  BASIC: {
    maxProjects: 5,
    maxZones: 15,
    maxDevices: 30
  },
  PRO: {
    maxProjects: 10,
    maxZones: 50,
    maxDevices: 100
  },
  ENTERPRISE: {
    maxProjects: 999999, // Unlimited
    maxZones: 999999,    // Unlimited
    maxDevices: 999999   // Unlimited
  }
} as const; 