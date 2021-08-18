import auth from './auth'
import admin from './admin';
import quests from "./quests";
import users from "./users";
import disputes from "./disputes";


export default [
  ...auth,
  ...admin,
  ...quests,
  ...disputes,
  ...users,
];
