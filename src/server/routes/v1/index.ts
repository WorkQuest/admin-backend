import auth from './auth'
import settings from './admin';
import questsInfo from "./questsInfo";

export default [
  ...auth,
  ...settings,
  ...questsInfo,
];
