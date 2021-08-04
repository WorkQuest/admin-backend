'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('AdminSessions', 'userId');
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('AdminSessions', 'userId',{
      type: Sequelize.DataTypes.STRING,
      references: {
        model:{
          tableName: 'Users',
          schema: 'public',
        },
        key: 'id',
      }
    });
  }
};
