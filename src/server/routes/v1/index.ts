import auth from './auth'
import admin from './admin';
import users from "./users";
import quests from "./quests";
import profile from "./profile";
import disputes from "./disputes";
import storageService from "./storageService";
import platformStatistics from "./platformStatistics";
import skillFilters from "./skillFilters";
import statistic from "./statistic";
import proposal from "./proposal";
import reports from "./reports";
import support from "./support";
import chat from "./chat";

export default [
  ...auth,
  ...admin,
  ...quests,
  ...disputes,
  ...users,
  ...profile,
  ...storageService,
  ...platformStatistics,
  ...skillFilters,
  ...statistic,
  ...proposal,
  ...reports,
  ...support,
  ...chat
];
