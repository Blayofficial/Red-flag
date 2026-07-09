exports.up = (pgm) => {
  pgm.createExtension('pgcrypto', { ifNotExists: true }); // gen_random_uuid()
  pgm.createExtension('cube', { ifNotExists: true }); // required by earthdistance
  pgm.createExtension('earthdistance', { ifNotExists: true }); // nearest-station queries
};

exports.down = (pgm) => {
  pgm.dropExtension('earthdistance', { ifExists: true });
  pgm.dropExtension('cube', { ifExists: true });
  pgm.dropExtension('pgcrypto', { ifExists: true });
};
