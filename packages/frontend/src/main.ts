import {HomeScreen} from "./screen/home";

globalThis.m = require('mithril');

m.route(document.body, "/", {
  [HomeScreen.routePath]: HomeScreen,
});

console.log('hello world !');
document.writeln('dinges');
