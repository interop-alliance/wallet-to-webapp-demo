import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');

global.window = dom.window;
global.document = dom.window.document;

// Stub Materialize toast used by code
global.M = { toast: () => {} };

// Stub hljs for highlight
global.hljs = { highlightElement: () => {} };
