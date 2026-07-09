exports.up = (pgm) => {
  pgm.createTable('stations', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    name: { type: 'text', notNull: true },
    normalized_name: { type: 'text', notNull: true },
    naptan_id: { type: 'text', unique: true },
    latitude: { type: 'double precision', notNull: true },
    longitude: { type: 'double precision', notNull: true },
    operator: { type: 'text' },
    // tube | overground | dlr | elizabeth-line | national-rail | tram
    transport_mode: { type: 'text', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createIndex('stations', 'normalized_name');
  pgm.createIndex('stations', 'transport_mode');

  // Nearest-station lookups via cube/earthdistance (see extensions migration).
  pgm.sql(`
    CREATE INDEX stations_geo_idx ON stations
    USING gist (ll_to_earth(latitude, longitude))
  `);

  pgm.createTable('lines', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    name: { type: 'text', notNull: true, unique: true },
    mode: { type: 'text', notNull: true },
  });

  pgm.createTable('station_lines', {
    station_id: {
      type: 'uuid',
      notNull: true,
      references: 'stations',
      onDelete: 'CASCADE',
    },
    line_id: {
      type: 'uuid',
      notNull: true,
      references: 'lines',
      onDelete: 'CASCADE',
    },
  });
  pgm.addConstraint('station_lines', 'station_lines_pkey', {
    primaryKey: ['station_id', 'line_id'],
  });

  pgm.createTable('station_entrances', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    station_id: {
      type: 'uuid',
      notNull: true,
      references: 'stations',
      onDelete: 'CASCADE',
    },
    description: { type: 'text' },
    latitude: { type: 'double precision' },
    longitude: { type: 'double precision' },
    is_gated: { type: 'boolean' },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('station_entrances');
  pgm.dropTable('station_lines');
  pgm.dropTable('lines');
  pgm.dropTable('stations');
};
