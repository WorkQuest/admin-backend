import auth from './auth'
import admin from './admin';
import quests from "./quests";
import users from "./users";
import disputes from "./disputes";
import profile from "./profile";
import language from "./language";

export default [
  ...auth,
  ...admin,
  ...quests,
  ...disputes,
  ...users,
  ...profile,
  ...language,
];
