'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Sessions', 'adminId');
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Sessions', 'adminId', {
      type: Sequelize.DataTypes.STRING,
      references: {
        model:{
          tableName: 'Admins',
          schema: 'public',
        },
        key: 'id',
      }
    })
  }
};
