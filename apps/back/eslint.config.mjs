// @ts-check
import { baseExtends } from '../../eslint.config.mjs';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintNestJs from '@darraghor/eslint-plugin-nestjs-typed';

export default tseslint.config(
  {
    extends: [...baseExtends, eslintNestJs.configs.flatRecommended],
    ignores: ['config/**/*'],
  },
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Back estricto
      '@typescript-eslint/explicit-function-return-type': 'error',
      'no-console': 'error',
    },
  },
  {
    files: ['**/*.guard.ts'],
    rules: {
      '@darraghor/nestjs-typed/injectable-should-be-provided': 'off',
    },
  },
  {
    files: ['**/*.controller.ts'],
    rules: {
      '@darraghor/nestjs-typed/api-method-should-specify-api-response': 'off',
    },
  },
);
