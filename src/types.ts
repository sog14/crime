export interface FIRData {
  id?: string;
  firNo: string;
  firDate: string;
  complainant: string;
  address: string;
  accused: string;
  policeStation: string;
  sections: string;
  district: string;
  incidentDate: string;
  placeOfOccurrenceGR: string; // "lat,lng"
  // Derived fields
  category: CrimeCategory;
  year: number;
  month: string;
  dayOfWeek: string;
  hour: number;
  isNight: boolean;
  lat: number;
  lng: number;
}

export type CrimeCategory = 
  | 'Murder' 
  | 'Culpable Homicide'
  | 'Robbery' 
  | 'Dacoity' 
  | 'Extortion'
  | 'Ransom' 
  | 'Theft' 
  | 'Assault' 
  | 'Fraud' 
  | 'Other';

export const CRIME_CATEGORIES: CrimeCategory[] = [
  'Murder',
  'Culpable Homicide',
  'Robbery',
  'Dacoity',
  'Extortion',
  'Ransom',
  'Theft',
  'Assault',
  'Fraud',
  'Other'
];

export interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}
