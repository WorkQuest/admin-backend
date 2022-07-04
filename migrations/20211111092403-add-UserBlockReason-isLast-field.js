'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('UserBlockReasons', 'isLast', {
      type: Sequelize.DataTypes.BOOLEAN,
    })
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('UserBlockReasons', 'isLast')
  }
};
