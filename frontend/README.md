# React + TypeScript + Vite

This template offers a minimal configuration for making React work with Vite, including HMR and some Oxlint configurations.

For now, there are only two official plugins

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

React Compiler is disabled in this template due to performance issues. In order to enable it please refer to [documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are building a production app, it is recommended to extend your Oxlint configuration with type-aware linting rules. This can be done using the `oxlint-tsgolint` plugin and updating `.oxlintrc.json` file:


```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
