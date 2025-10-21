module.exports = {
    root: true,
    env: {
        browser: true,
        node: true,
        es2021: true,
    },
    parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
    },
    plugins: ['prettier'],
    extends: ['eslint:recommended', 'plugin:prettier/recommended'],
    rules: {
        'prettier/prettier': 'error',

        'no-console': 'warn',
        'no-debugger': 'warn',
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
        eqeqeq: ['error', 'always'],
        curly: ['error', 'all'],
    },

    overrides: [
        {
            files: ['*.ts', '*.tsx'],
            parser: '@typescript-eslint/parser',
            parserOptions: {
                project: './tsconfig.json',
                tsconfigRootDir: __dirname,
                ecmaFeatures: { jsx: true },
            },
            plugins: ['@typescript-eslint'],
            extends: ['plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
            rules: {
                'no-unused-vars': 'off',
                '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
                '@typescript-eslint/explicit-function-return-type': 'off',
            },
        },

        {
            files: ['*.cjs'],
            env: { node: true },
        },

        {
            files: ['*.mjs'],
            env: { node: true, es2021: true },
        },
    ],

    settings: {
        react: {
            version: 'detect',
        },
    },
};