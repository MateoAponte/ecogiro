import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Get all dinamically the modules
function getModules(appPath, appName) {
  try {
    return readdirSync(appPath)
      .filter((dir) => statSync(join(appPath, dir)).isDirectory())
      .map((dir) => `${appName}/${dir}`);
  } catch {
    return [];
  }
}

// Possible scopes for commit messages
const COMMON_MODULES = [
  'ci',
  'test',
  'chore',
  'docs',
  'refactor',
  'fix',
  'feat',
  'db',
  'config',
];

// Apps Names
const FRONT_FOLDER = 'front';
const BACK_FOLDER = 'back';

// Get all modules for each kind of app
const FRONT_SCOPES = getModules(`./apps/${FRONT_FOLDER}/src/features`, FRONT_FOLDER);
const BACK_SCOPES = getModules(`./apps/${BACK_FOLDER}/src`, BACK_FOLDER);

// Get all possible combinations of modules
const COMMON_FRONT_SCOPES = COMMON_MODULES.map((mod) => `${FRONT_FOLDER}/${mod}`);
const COMMON_BACK_SCOPES = COMMON_MODULES.map((mod) => `${BACK_FOLDER}/${mod}`);

export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        BACK_FOLDER,
        FRONT_FOLDER,
        ...FRONT_SCOPES,
        ...BACK_SCOPES,
        ...COMMON_MODULES,
        ...COMMON_FRONT_SCOPES,
        ...COMMON_BACK_SCOPES,
      ],
    ],
    'scope-empty': [2, 'never'],
  },
};
