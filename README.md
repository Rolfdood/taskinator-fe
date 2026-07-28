# Taskinator Frontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.0.8.

## Development server

To start a local development server, run:

```bash
npm start
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. API calls to `/api` are proxied to `http://localhost:8080` for local backend development.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Deploying to Vercel

1. Push this repository to GitHub.
2. In Vercel, create a new project from the repository.
3. Use these project settings:
   - Framework Preset: Angular
   - Build Command: `npm run build`
   - Output Directory: `dist/taskinator-fe/browser`
   - Install Command: `npm install`
4. Deploy the project.
5. After deployment, open `/login` and `/register` directly to confirm SPA routing works.

The frontend calls the backend through `/api/v1`. Vercel rewrites `/api/*` to `https://taskinator-production-040f.up.railway.app/api/*`, so no Supabase keys or Railway secrets are stored in the browser bundle. If the backend validates request origins, allow the Vercel production domain or your custom domain.
