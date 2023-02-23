import fs from 'fs';
import puppeteer from 'puppeteer';
import { procedure } from '../dataManager.js';
export * as bugfixing from './bugfixing.js';
export * as fileSystem from './fileSystem.js';
export * as looping from './looping.js';
export * as unifyWording from './unifyWording.js';
export * as dataSet from './dataSet.js';

export function timer() {
	return new Promise((resolve, reject) => {
		setTimeout((res) => resolve(), 500);
	});
}
