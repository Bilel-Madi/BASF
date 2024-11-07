// src/app.d.ts

import type { User, Session } from '@prisma/client';

declare global {
  namespace App {
    interface Locals {
      user: User | null;
      session: Session | null;
    }

    interface PageData {
      user: User | null;
      session: Session | null;
      // Add other data types as needed
    }

    // Other interfaces...
  }
}

export {};
