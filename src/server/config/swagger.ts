import config from './config';

export default {
  pathPrefixSize: 2,
  basePath: '/api/',
  host: `${config.server.host}:${config.server.port}`,
  grouping: 'tags',
  info: {
    title: 'API Documentation',
    version: '',
    description:
      'API Documentation\n\nYou can use https://mdenushev.github.io/nes-cli/ to test ws connections',
  },
  securityDefinitions: {
    Bearer: {
      type: 'apiKey',
      name: 'Authorization',
      in: 'header',
      'x-keyPrefix': 'Bearer ',
    },
  },
  security: [
    {
      Bearer: [],
    }
  ],
  jsonPath: '/documentation.json',
  documentationPath: '/documentation',
  debug: true,
};
