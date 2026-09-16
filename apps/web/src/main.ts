import { registerLocaleData } from '@angular/common';
import localeAr from '@angular/common/locales/ar';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

registerLocaleData(localeAr, 'ar');

bootstrapApplication(App, appConfig).catch((err: unknown) => {
  console.error(err);
});
