/**
 * Bangladesh administrative geography.
 *
 * Coordinates are district centroids (approximate, ~10 km accuracy) used to
 * place consented locations on the admin map. They are never precise device
 * coordinates and are only rendered for customers who granted consent.
 */
export type DistrictInfo = {
  name: string;
  division: string;
  lat: number;
  lng: number;
};

export const DIVISIONS = [
  "Dhaka",
  "Chattogram",
  "Rajshahi",
  "Khulna",
  "Barishal",
  "Sylhet",
  "Rangpur",
  "Mymensingh",
] as const;

export type Division = (typeof DIVISIONS)[number];

export const DISTRICTS: DistrictInfo[] = [
  // Dhaka
  { name: "Dhaka", division: "Dhaka", lat: 23.81, lng: 90.41 },
  { name: "Faridpur", division: "Dhaka", lat: 23.6, lng: 89.83 },
  { name: "Gazipur", division: "Dhaka", lat: 23.99, lng: 90.42 },
  { name: "Gopalganj", division: "Dhaka", lat: 23.01, lng: 89.17 },
  { name: "Kishoreganj", division: "Dhaka", lat: 24.1, lng: 90.77 },
  { name: "Madaripur", division: "Dhaka", lat: 23.16, lng: 90.18 },
  { name: "Manikganj", division: "Dhaka", lat: 23.84, lng: 90.01 },
  { name: "Munshiganj", division: "Dhaka", lat: 24.55, lng: 90.4 },
  { name: "Narayanganj", division: "Dhaka", lat: 23.62, lng: 90.71 },
  { name: "Narsingdi", division: "Dhaka", lat: 23.93, lng: 90.7 },
  { name: "Rajbari", division: "Dhaka", lat: 23.56, lng: 89.64 },
  { name: "Shariatpur", division: "Dhaka", lat: 23.98, lng: 90.3 },
  { name: "Tangail", division: "Dhaka", lat: 23.92, lng: 89.92 },
  // Chattogram
  { name: "Bandarban", division: "Chattogram", lat: 22.2, lng: 92.22 },
  { name: "Brahmanbaria", division: "Chattogram", lat: 23.96, lng: 91.11 },
  { name: "Chandpur", division: "Chattogram", lat: 23.45, lng: 90.51 },
  { name: "Chattogram", division: "Chattogram", lat: 22.36, lng: 91.83 },
  { name: "Cumilla", division: "Chattogram", lat: 23.46, lng: 91.18 },
  { name: "Cox's Bazar", division: "Chattogram", lat: 21.43, lng: 92.0 },
  { name: "Feni", division: "Chattogram", lat: 23.02, lng: 91.4 },
  { name: "Khagrachhari", division: "Chattogram", lat: 23.35, lng: 91.6 },
  { name: "Lakshmipur", division: "Chattogram", lat: 22.95, lng: 91.11 },
  { name: "Noakhali", division: "Chattogram", lat: 24.8, lng: 91.1 },
  { name: "Rangamati", division: "Chattogram", lat: 22.63, lng: 92.2 },
  // Rajshahi
  { name: "Bogura", division: "Rajshahi", lat: 24.85, lng: 89.37 },
  { name: "Chapainawabganj", division: "Rajshahi", lat: 24.52, lng: 89.3 },
  { name: "Joypurhat", division: "Rajshahi", lat: 25.04, lng: 89.09 },
  { name: "Naogaon", division: "Rajshahi", lat: 24.79, lng: 89.28 },
  { name: "Natore", division: "Rajshahi", lat: 24.42, lng: 89.0 },
  { name: "Pabna", division: "Rajshahi", lat: 24.0, lng: 89.24 },
  { name: "Rajshahi", division: "Rajshahi", lat: 24.37, lng: 88.6 },
  { name: "Sirajganj", division: "Rajshahi", lat: 25.45, lng: 89.71 },
  // Khulna
  { name: "Bagerhat", division: "Khulna", lat: 22.82, lng: 89.55 },
  { name: "Chuadanga", division: "Khulna", lat: 23.62, lng: 88.6 },
  { name: "Jashore", division: "Khulna", lat: 23.17, lng: 89.21 },
  { name: "Jhenaidah", division: "Khulna", lat: 23.54, lng: 89.1 },
  { name: "Khulna", division: "Khulna", lat: 22.85, lng: 89.54 },
  { name: "Kushtia", division: "Khulna", lat: 23.9, lng: 89.12 },
  { name: "Magura", division: "Khulna", lat: 23.49, lng: 89.42 },
  { name: "Meherpur", division: "Khulna", lat: 23.81, lng: 88.63 },
  { name: "Narail", division: "Khulna", lat: 23.65, lng: 89.42 },
  { name: "Satkhira", division: "Khulna", lat: 22.72, lng: 89.07 },
  // Barishal
  { name: "Barguna", division: "Barishal", lat: 22.09, lng: 90.11 },
  { name: "Barishal", division: "Barishal", lat: 22.7, lng: 90.37 },
  { name: "Bhola", division: "Barishal", lat: 22.68, lng: 90.65 },
  { name: "Jhalokathi", division: "Barishal", lat: 22.64, lng: 90.17 },
  { name: "Patuakhali", division: "Barishal", lat: 22.36, lng: 90.33 },
  { name: "Pirojpur", division: "Barishal", lat: 22.84, lng: 90.29 },
  // Sylhet
  { name: "Habiganj", division: "Sylhet", lat: 24.38, lng: 91.42 },
  { name: "Moulvibazar", division: "Sylhet", lat: 24.48, lng: 91.77 },
  { name: "Sunamganj", division: "Sylhet", lat: 25.07, lng: 91.4 },
  { name: "Sylhet", division: "Sylhet", lat: 24.9, lng: 91.87 },
  // Rangpur
  { name: "Dinajpur", division: "Rangpur", lat: 25.63, lng: 88.64 },
  { name: "Gaibandha", division: "Rangpur", lat: 25.32, lng: 89.35 },
  { name: "Kurigram", division: "Rangpur", lat: 25.81, lng: 89.87 },
  { name: "Lalmonirhat", division: "Rangpur", lat: 26.03, lng: 89.93 },
  { name: "Nilphamari", division: "Rangpur", lat: 26.07, lng: 88.82 },
  { name: "Panchagarh", division: "Rangpur", lat: 26.33, lng: 88.55 },
  { name: "Rangpur", division: "Rangpur", lat: 25.74, lng: 89.25 },
  { name: "Thakurgaon", division: "Rangpur", lat: 26.03, lng: 88.47 },
  // Mymensingh
  { name: "Jamalpur", division: "Mymensingh", lat: 24.94, lng: 89.94 },
  { name: "Mymensingh", division: "Mymensingh", lat: 24.75, lng: 90.4 },
  { name: "Netrokona", division: "Mymensingh", lat: 24.87, lng: 90.73 },
  { name: "Sherpur", division: "Mymensingh", lat: 25.03, lng: 90.21 },
];

const DISTRICT_BY_NAME = new Map(
  DISTRICTS.map((district) => [district.name.toLowerCase(), district]),
);

export function findDistrict(name?: string | null) {
  if (!name) return null;
  return DISTRICT_BY_NAME.get(name.trim().toLowerCase()) ?? null;
}

export function districtsOfDivision(division: string) {
  return DISTRICTS.filter((district) => district.division === division);
}

/** Projects lat/lng onto a 1000x900 SVG canvas covering Bangladesh. */
export function projectToSvg(lat: number, lng: number) {
  const minLat = 20.5;
  const maxLat = 26.8;
  const minLng = 87.9;
  const maxLng = 92.9;
  const x = ((lng - minLng) / (maxLng - minLng)) * 1000;
  const y = ((maxLat - lat) / (maxLat - minLat)) * 900;
  return { x: Math.round(x), y: Math.round(y) };
}
