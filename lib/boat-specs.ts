export type ZoneColor = 'cabin' | 'common' | 'utility' | 'head';

export type ZoneConfig = {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: ZoneColor;
};

export type BoatSpec = {
  specs: { label: string; value: string }[];
  zones: ZoneConfig[];
};

export type ConfigVariant = {
  id: string;
  label: string;
  cabins: number;
};

export const BAVARIA_C50_CONFIGS: ConfigVariant[] = [
  { id: 'A1-B1-C1-D1-E2', label: '3-Cabin (A1-B1-C1-D1-E2)', cabins: 3 },
  { id: 'A1-B1-C1-D3-E2', label: '3-Cabin (A1-B1-C1-D3-E2)', cabins: 3 },
  { id: 'A1-B1-C1-D2-E2', label: '4-Cabin (A1-B1-C1-D2-E2)', cabins: 4 },
  { id: 'A1-B2-C1-D1-E2', label: '4-Cabin (A1-B2-C1-D1-E2)', cabins: 4 },
  { id: 'A1-B2-C1-D3-E2', label: '4-Cabin (A1-B2-C1-D3-E2)', cabins: 4 },
  { id: 'A2-B1-C1-D1-E2', label: '4-Cabin (A2-B1-C1-D1-E2)', cabins: 4 },
  { id: 'A2-B2-C1-D3-E2', label: '4-Cabin (A2-B2-C1-D3-E2)', cabins: 4 },
  { id: 'A2-B1-C1-D3-E2', label: '4-Cabin (A2-B1-C1-D3-E2)', cabins: 4 },
  { id: 'A1-B2-C1-D2-E2', label: '5-Cabin (A1-B2-C1-D2-E2)', cabins: 5 },
  { id: 'A2-B2-C1-D1-E2', label: '5-Cabin (A2-B2-C1-D1-E2)', cabins: 5 },
  { id: 'A2-B2-C1-D2-E2', label: '6-Cabin (A2-B2-C1-D2-E2)', cabins: 6 },
];

export const BOAT_SPECS: Record<string, BoatSpec> = {
  'Bavaria C50': {
    specs: [
      { label: 'Length (LOA)', value: '15.97 m'   },
      { label: 'Beam',         value: '4.72 m'    },
      { label: 'Draft',        value: '1.95 m'    },
      { label: 'Displacement', value: '12,500 kg' },
      { label: 'Sail Area',    value: '~130 m²'   },
    ],
    zones: [
      { id: 'fwd-cabin', label: 'Forward Cabin', x: 100, y: 50,  width: 100, height: 80, color: 'cabin'   },
      { id: 'head-p',    label: 'Head',          x: 48,  y: 145, width: 88,  height: 62, color: 'head'    },
      { id: 'storage',   label: 'Storage',       x: 164, y: 145, width: 88,  height: 62, color: 'utility' },
      { id: 'saloon',    label: 'Saloon',        x: 44,  y: 220, width: 212, height: 88, color: 'common'  },
      { id: 'galley',    label: 'Galley',        x: 44,  y: 318, width: 100, height: 65, color: 'utility' },
      { id: 'nav',       label: 'Nav Station',   x: 156, y: 318, width: 100, height: 65, color: 'utility' },
      { id: 'aft-port',  label: 'Aft Cabin',     x: 44,  y: 393, width: 100, height: 82, color: 'cabin'   },
      { id: 'aft-stbd',  label: 'Aft Cabin',     x: 156, y: 393, width: 100, height: 82, color: 'cabin'   },
    ],
  },
};
