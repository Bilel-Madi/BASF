export const SUBSCRIPTION_TIERS = {
  FREE: {
    maxProjects: 1,
    maxZones: 5,
    maxDevices: 2
  },
  BASIC: {
    maxProjects: 2,
    maxZones: 15,
    maxDevices: 10
  },
  PRO: {
    maxProjects: 3,
    maxZones: 15,
    maxDevices:15
  },
  ENTERPRISE: {
    maxProjects: 999999, // Unlimited
    maxZones: 999999,    // Unlimited
    maxDevices: 999999   // Unlimited
  }
} as const; 