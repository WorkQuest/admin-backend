'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Sessions', 'userId',{
      type: Sequelize.DataTypes.STRING,
      references: {
        model:{
          tableName: 'Admins',
          schema: 'public',
        },
        key: 'id',
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Sessions', 'userId');
  }
};