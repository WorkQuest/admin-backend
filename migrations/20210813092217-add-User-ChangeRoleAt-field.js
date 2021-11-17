'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Users', 'changeRoleAt', {
      type: Sequelize.DataTypes.DATE,
    })
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Users', 'changeRoleAt')
  }
};
