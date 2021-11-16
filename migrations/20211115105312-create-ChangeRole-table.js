
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('ChangeRoles', {
      id: {
        type: Sequelize.DataTypes.STRING,
        primaryKey: true
      },
      userId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        references: {
          model:{
            tableName: 'Users',
            schema: 'public',
          },
          key: 'id',
        }
      },
      previousAdditionalInfo: {
        type: Sequelize.DataTypes.JSONB,
        defaultValue: {},
      },
      previousRole: {
        type: Sequelize.DataTypes.STRING,
        defaultValue: null,
      },
      changeRoleAt: {
        type: Sequelize.DataTypes.DATE
      },
      createdAt: {
        type: Sequelize.DataTypes.DATE
      },
      updatedAt: {
        type: Sequelize.DataTypes.DATE
      }
    });
  },
  
  down: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable('ChangeRoles');
  }
};
