export interface OrgSettings {
  timezone: string;
  currency: string;
  [key: string]: unknown;
}

export interface Organization {
  id: string;
  name: string;
  plan?: string;
  settings: OrgSettings;
  [key: string]: unknown;
}

export type Org = Omit<Organization, 'settings'> & {
  settings?: Partial<OrgSettings>;
};
