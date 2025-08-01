import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import your translation files
import enLogin from "./locales/en/login.json";
import enRegistration from "./locales/en/registration.json";
import enRecording from "./locales/en/recording.json";
import enPatientForm from "./locales/en/patientForm.json";
import enDashboard from "./locales/en/dashboard.json";
import enHeader from "./locales/en/header.json";
import enHome from "./locales/en/home.json";
import enAdmin from "./locales/en/admin.json";
import enProcessing from "./locales/en/processing.json";
// Do the same for Hebrew, Arabic, Russian
import heLogin from "./locales/he/login.json";
import heRegistration from "./locales/he/registration.json";
import heRecording from "./locales/he/recording.json";
import hePatientForm from "./locales/he/patientForm.json";
import heDashboard from "./locales/he/dashboard.json";
import heHeader from "./locales/he/header.json";
import heHome from "./locales/he/home.json";
import heAdmin from "./locales/he/admin.json";
import heProcessing from "./locales/he/processing.json";

import arLogin from "./locales/ar/login.json";
import arRegistration from "./locales/ar/registration.json";
import arRecording from "./locales/ar/recording.json";
import arPatientForm from "./locales/ar/patientForm.json";
import arDashboard from "./locales/ar/dashboard.json";
import arHeader from "./locales/ar/header.json";
import arHome from "./locales/ar/home.json";
import arAdmin from "./locales/ar/admin.json";
import arProcessing from "./locales/ar/processing.json";


import ruLogin from "./locales/ru/login.json";
import ruRegistration from "./locales/ru/registration.json";
import ruRecording from "./locales/ru/recording.json";
import ruPatientForm from "./locales/ru/patientForm.json";
import ruDashboard from "./locales/ru/dashboard.json";
import ruHeader from "./locales/ru/header.json";
import ruHome from "./locales/ru/home.json";
import ruAdmin from "./locales/ru/admin.json";
import ruProcessing from "./locales/ru/processing.json";
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        login: enLogin,
        registration: enRegistration,
        recording: enRecording,
        patientForm: enPatientForm,
        dashboard: enDashboard,
        header: enHeader,
        home: enHome,
        admin: enAdmin,
        processing: enProcessing
      },
      he: {
        login: heLogin,
        registration: heRegistration,
        recording: heRecording,
        patientForm: hePatientForm,
        dashboard: heDashboard,
        header: heHeader,
        home: heHome,
        admin: heAdmin,
        processing: heProcessing
      },
      ar: {
        login: arLogin,
        registration: arRegistration,
        recording: arRecording,
        patientForm: arPatientForm,
        dashboard: arDashboard,
        header: arHeader,
        home: arHome,
        admin: arAdmin,
        processing: arProcessing
      },
      ru: {
        login: ruLogin,
        registration: ruRegistration,
        recording: ruRecording,
        patientForm: ruPatientForm,
        dashboard: ruDashboard,
        header: ruHeader,
        home: ruHome,
        admin: ruAdmin,
        processing: ruProcessing
      }
    },
    fallbackLng: "en",
    ns: ["login", "registration", "recording", "patientForm", "dashboard", "header", "home", "admin", "processing"],
    defaultNS: "login",
    interpolation: { escapeValue: false }
  });

export default i18n;
