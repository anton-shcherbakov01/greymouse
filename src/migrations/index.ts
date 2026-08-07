import * as migration_20260806_190559_initial from './20260806_190559_initial';
import * as migration_20260807_110137_accent_and_logo from './20260807_110137_accent_and_logo';

export const migrations = [
  {
    up: migration_20260806_190559_initial.up,
    down: migration_20260806_190559_initial.down,
    name: '20260806_190559_initial',
  },
  {
    up: migration_20260807_110137_accent_and_logo.up,
    down: migration_20260807_110137_accent_and_logo.down,
    name: '20260807_110137_accent_and_logo'
  },
];
