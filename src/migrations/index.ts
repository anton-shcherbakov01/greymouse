import * as migration_20260806_190559_initial from './20260806_190559_initial';
import * as migration_20260807_110137_accent_and_logo from './20260807_110137_accent_and_logo';
import * as migration_20260808_030600_product_demo from './20260808_030600_product_demo'
import * as migration_20260809_200000_drop_service_stage from './20260809_200000_drop_service_stage'
import * as migration_20260809_201000_demo_audience from './20260809_201000_demo_audience';

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
  {
    up: migration_20260808_030600_product_demo.up,
    down: migration_20260808_030600_product_demo.down,
    name: '20260808_030600_product_demo',
  },
  {
    up: migration_20260809_200000_drop_service_stage.up,
    down: migration_20260809_200000_drop_service_stage.down,
    name: '20260809_200000_drop_service_stage',
  },
  {
    up: migration_20260809_201000_demo_audience.up,
    down: migration_20260809_201000_demo_audience.down,
    name: '20260809_201000_demo_audience',
  },
];
