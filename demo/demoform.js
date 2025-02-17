/**
 * This file handles parsing/updating the form on the demo page.
 * 
 * @typedef {object} RevSDKDemoSettings
 * Holds the parameters necessary for calling the Rev SDK's embedVideo/embedWebcast functions
 * @property {string} baseUrl
 * @property {string} videoId
 * @property {string} webcastId
 * @property {import("../dist").VbrickEmbedConfig} config
 * 
 * @typedef {object} DemoForm
 * The fields in this page's form
 * @property {string} sourceUrl - A Rev URL to parse and extract relevant values into form
 * @property {string} baseUrl - URL/origin of Rev tenant
 * @property {string} videoId - ID of Video/VOD
 * @property {string} webcastId - ID of Webcast
 * @property {'vod' | 'webcast'} embedType - what kind of content is being embedded
 * @property {import("../dist").TokenType} tokenType - type of passed in token
 * @property {string} tokenValue - value of token
 * @property {'vbrick' | 'vbrick_rev'} tokenIssuer
 * @property {string} config - JSON string of additional config options.
 */

import { readParams, storeParams, tryParse, stringifyJson } from "./utils.js";




/**
 * Initializes the demo form
 * @param {DemoForm} formDefaults
 * @param {(config: RevSDKDemoSettings) => void} render function to call when form is submitted
 * @returns {() => RevSDKDemoSettings} function that returns the embed config
 */
export function init(formDefaults, render) {
	const form = document.querySelector('form');

	const formValues = readParams(formDefaults);
	writeFormData(form, formValues);

	// if sourceUrl is passed into query (rather than stored in cookies) then trigger update of form
	if(window.location.search.includes('sourceUrl')) {
		onSourceUrlChanged(form, formValues.sourceUrl);
	}

	// update dependent fields of the form depending on what was changed
	form.addEventListener('change', evt => {
		switch (evt.target.name) {
			case 'tokenType':
				onTokenTypeChanged(form);
				return;
			case 'sourceUrl':
				onSourceUrlChanged(form, form.elements.sourceUrl.value);
				break;
			case 'embedType':
				onEmbedTypeChanged(form);
				break;
		}
	});

	form.addEventListener('submit', (e) => {
		e.preventDefault();
		renderInternal();
	});

	// when reset is pressed clear out the form values AND clear out stored cookies
	form.addEventListener('reset', () => {
		writeFormData(form, formDefaults);
		storeParams(formDefaults);
	});

	// if form has valid values on page load then render
	if (formValues.baseUrl && (formValues.webcastId || formValues.videoId)) {
		setTimeout(renderInternal, 1000);
	}

	function renderInternal() {
		render(syncFormData());
	}

	/**
	 * translates the form into values used by the SDK (and stores in cookies)
	 * @returns {RevSDKDemoSettings}
	 */
	function syncFormData() {
		const data = readFormData(form);
		storeParams(data);
		return getConfig(data);
	}

	return syncFormData;
}

/**
 * Translates the form/stored data into the parameters expected by index.js
 * @param {DemoForm} formData
 * @returns {RevSDKDemoSettings}
 */
function getConfig(formData) {
	const {
		config,
		tokenValue,
		tokenType,
		tokenIssuer,
		sourceUrl,
		embedType,
		videoId,
		webcastId,
		baseUrl
	} = formData

	/** @type {RevSDKDemoSettings} */
	const data = {
		baseUrl,
		config: {
			// try to parse the "config" field as JSON. It can include any of the embed config options (hideControls, accentColor, etc)
			...tryParse(config),
			token: tokenValue && {
				type: tokenType,
				value: tokenValue,
				issuer: tokenIssuer
			}
		}
	};

	// read the form radio toggle to only return expected ID
	if (embedType === 'vod') {
		data.videoId = videoId;
	} else {
		data.webcastId = webcastId;
	}

	return data;
}

/** Form event handlers */

function onSourceUrlChanged(form, sourceUrl) {
	const settings = parseRevUrl(sourceUrl);
	if (!settings.videoId && !settings.webcastId) {
		return;
	}

	writeFormData(form, {
		sourceUrl,
		...settings,
	});
}
/**
 * update the "issuer" value depending on the selected token type
 */
export function onTokenTypeChanged(form) {
	onEmbedTypeChanged(form);

	const isJWT = form.elements.tokenType.value === 'JWT';
	form.elements.tokenIssuer.value = isJWT
		? 'vbrick_rev'
		: 'vbrick';
}
/**
 * update which type of ID is editable when the embed type is updated
 */
function onEmbedTypeChanged(form) {
	const isVOD = form.elements.embedType.value === 'vod';
	form.elements.webcastId.disabled = isVOD;
	form.elements.videoId.disabled = !isVOD;
}

/**
 * 
 * @param {HTMLFormElement} form 
 * @returns {DemoForm}
 */
export function readFormData(form) {
	return Array.from(form.elements)
		.filter(el => el.name && (el.type !== 'radio' || el.checked))
		.reduce((acc, el) => Object.assign(acc, { [el.name]: el.value }), {});
}
/**
 * 
 * @param {HTMLFormElement} form 
 * @param {DemoForm} values 
 */
export function writeFormData(form, values) {
	Object.entries(values).forEach(([k, value]) => {
		const el = form.elements[k];
		if (!el) {
			return;
		}
		if (el.type === 'radio') {
			el.checked = el.value === value;
		} else {
			el.value = value || '';
		}
	});
	onTokenTypeChanged(form);
}

/**
 * Parse a Rev URL
 * attempt to parse a URL (or <iframe src=...> embed code) referencing a Rev webcast or vod)
 * @param {string} url
 * @returns {Partial<DemoForm>}
 */
export function parseRevUrl(url) {
	url = url.trim();
	// attempt to read src parameter if embed code is pasted in
	if (url.startsWith('<')) {
		url = url.match(/src="([^"]+)"/)?.[1];
	}

	let urlObj;
	try {
		urlObj = new URL(url);
	} catch (err) {
		return {
			config: '{}'
		};
	}

	const {
		searchParams,
		pathname,
		hash,
		origin: baseUrl
	} = urlObj;

	/** @type {Partial<DemoForm>} */
	const result = {
		webcastId: '',
		videoId: '',
		baseUrl,
		config: '{}'
	};

	// matches an id in the url path
	const guidInPath = (/[0-9a-f-]{36}/i.exec(pathname) || [])[0];

	if (searchParams.has('id')) {
		result.videoId = searchParams.get('id');
	} else if (pathname.includes('sharevideo')) {
		result.videoId = guidInPath;
	} else if (pathname.includes('embed/webcast')) {
		// embed code url
		result.webcastId = guidInPath;
	} else if (pathname.includes('public/events')) {
		result.webcastId = guidInPath;
	}
	else if (hash) {
		const contentMatch = /\/(?<area>videos|events)\/(?<id>[0-9a-f-]{36})/.exec(hash);
		if (contentMatch) {
			const { id, area } = contentMatch.groups;

			const key = area === 'events'
				? 'webcastId'
				: 'videoId';

			result[key] = id;
		}
	} else {
		// just base URL passed
	}

	// add additional config options passed
	const queryConfigMap = {
		accent: 'accentColor',
		autoplay: 'autoplay',
		forceClosedCaptions: 'forcedCaptions',
		loopVideo: 'playInLoop',
		noCc: 'hideCaptions',
		noCenterButtons: 'hideOverlayControls',
		noChapters: 'hideChapters',
		noFullscreen: 'hideFullscreen',
		noPlayBar: 'hidePlayControls',
		noSettings: 'hideSettings',
		placeholder: 'popOut',
		startAt: 'startAt'
	};
	const config = Array.from(searchParams.entries()).reduce((config, [key, value]) => {
		const configKey = queryConfigMap[key];
		if (configKey) {
			config[configKey] = value === '' ? true : value;
		}
		return config;
	}, {});

	result.config = stringifyJson(config, true);
	result.embedType = result.videoId ? 'vod' : 'webcast';

	if(searchParams.get('token')) {
		result.tokenValue = searchParams.get('token');
		if(result.webcastId) {
			result.tokenType = 'JWT';
			result.tokenIssuer = 'vbrick_rev';
		}
	}

	return result;
}

