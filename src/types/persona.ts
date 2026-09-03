export type UserPersona = 'ISRO_ANALYST' | 'NDRF_OFFICER' | 'PUBLIC_RESEARCHER';

export interface PersonaPermissions {
  canDetectInfrastructure: boolean;
  canAccessSAR: boolean;
  canViewEmergencyLayers: boolean;
  canRunChangeDetection: boolean;
  canRunSpectral: boolean;
  canExportOperationalReports: boolean;
  canExportGeoTIFF: boolean;
  maxExportLevel: 'PUBLIC' | 'OPERATIONAL';
}

export interface PersonaConfig {
  id: UserPersona;
  name: string;
  shortName: string;
  icon: string;
  badgeColor: string;
  accentColor: string;
  description: string;
  permissions: PersonaPermissions;
  preferredLayers: string[];
  quickPrompts: string[];
  capabilities: string[];
}
