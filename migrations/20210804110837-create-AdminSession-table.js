
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('AdminSessions', {
      id: {
        type: Sequelize.DataTypes.STRING,
        primaryKey: true
      },
      userId: {
        type: Sequelize.DataTypes.STRING,
        references: {
          model:{
            tableName: 'Users',
            schema: 'public',
          },
          key: 'id',
        }
      },
      adminId: {
        type: Sequelize.DataTypes.STRING,
        references: {
          model:{
            tableName: 'Admins',
            schema: 'public',
          },
          key: 'id',
        }
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable('AdminSessions');
  }
};
