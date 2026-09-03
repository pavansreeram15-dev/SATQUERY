export interface AISVessel {
  mmsi: string;
  imo?: string | null;
  name: string;
  callsign?: string | null;
  latitude: number;
  longitude: number;
  speed_knots: number;
  course: number;
  heading: number;
  navigation_status: string;
  ship_type: 'Cargo' | 'Tanker' | 'Passenger' | 'Fishing' | 'Tug' | 'Military' | 'Pleasure' | 'Other' | string;
  destination?: string | null;
  timestamp: string;
  source: string;
  last_update_seconds_ago: number;
}

export interface AISFilterState {
  selectedTypes: string[]; // ['Cargo', 'Tanker', ...] or [] for All
  speedRange: 'ALL' | '0-5' | '5-10' | '10-20' | '20+';
  navStatus: string; // 'ALL', 'Under Way', 'At Anchor', 'Moored', 'Restricted'
  searchQuery: string;
}

export interface AISCorrelationMatch {
  matched: boolean;
  status_label: string; // 'Possible AIS-Satellite Match' | 'No nearby AIS match'
  distance_km?: number | null;
  time_diff_minutes?: number | null;
  satellite_detection?: Record<string, any> | null;
  matched_vessel?: AISVessel | null;
  explanation: string;
}

export interface AISStatusResponse {
  status: 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'NO_DATA' | 'ERROR' | 'DISCONNECTED';
  vessel_count: int;
  last_update?: string | null;
  active_bbox?: number[] | null;
  source: string;
  message?: string | null;
}
