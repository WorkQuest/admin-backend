'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('QuestBlockReasons', 'isLast')
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('QuestBlockReasons', 'isLast', {
      type: Sequelize.DataTypes.BOOLEAN,
    })
  }
};
