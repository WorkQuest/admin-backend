import auth from './auth'
import admin from './admin';
import quests from "./quests";
import users from "./users";
import disputes from "./disputes";
import profile from "./profile";
import storageService from "./storageService";
import skillFilters from "./skillFilters";
import statistic from "./statistic";

export default [
  ...auth,
  ...admin,
  ...quests,
  ...disputes,
  ...users,
  ...profile,
  ...storageService,
  ...skillFilters,
  ...statistic,
];
