import {HomeScreen} from "./screen/home";
import {LoginScreen} from "./screen/login";

globalThis.m = require('mithril');

m.route(document.body, "/", {
  [HomeScreen.routePath]: HomeScreen,
  [LoginScreen.routePath]: LoginScreen,
});
