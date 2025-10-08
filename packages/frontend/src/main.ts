import {HomeScreen} from "./screen/home";

globalThis.m = require('mithril');

m.route(document.body, "/", {
  [HomeScreen.routePath]: HomeScreen,
});
