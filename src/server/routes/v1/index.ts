import auth from './auth'
import admin from './admin';
import users from "./users";
import quests from "./quests";
import profile from "./profile";
import disputes from "./disputes";
import storageService from "./storageService";
import skillFilters from "./skillFilters";
import statistic from "./statistic";
import proposal from "./proposal";
import reports from "./reports";

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
  ...proposal,
  ...reports
];
