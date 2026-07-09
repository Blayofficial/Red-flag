exports.up = (pgm) => {
  pgm.createType('barrier_status', ['OPEN_ACCESS', 'GATED', 'MIXED', 'UNKNOWN']);

  pgm.createTable('barrier_info', {
    station_id: {
      type: 'uuid',
      primaryKey: true,
      references: 'stations',
      onDelete: 'CASCADE',
    },
    status: { type: 'barrier_status', notNull: true, default: 'UNKNOWN' },
    confidence_score: {
      type: 'numeric(3,2)',
      notNull: true,
      check: 'confidence_score >= 0 AND confidence_score <= 1',
    },
    // [{ type: 'foi' | 'osm' | 'official_docs' | 'general_knowledge' | 'manual', ref: string, note?: string }]
    sources: { type: 'jsonb', notNull: true, default: '[]' },
    notes: { type: 'text' },
    needs_manual_review: { type: 'boolean', notNull: true, default: true },
    last_verified_date: { type: 'date' },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createIndex('barrier_info', 'status');
  pgm.createIndex('barrier_info', 'needs_manual_review');
};

exports.down = (pgm) => {
  pgm.dropTable('barrier_info');
  pgm.dropType('barrier_status');
};
