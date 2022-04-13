import { VbrickSDKConfig } from '../VbrickSDK';

export interface VbrickEmbedConfig extends VbrickSDKConfig {

	/**
	 * An optional class to be set on embeds.
	 */
	className?: string;

	/**
	 * Optional width to be set on embeds. Default is "100%"
	 */
	width?: string;

	/**
	 * Optional height to be set on embeds. Default is "100%"
	 */
	height?: string;

	/**
	 * Optional, For embedded webcasts, hides the video. Default is false.
	 */
	hideVideo?: boolean;


	/**
	 * Plays the video in a popup window. If false(default) the video plays directly in the embed element.
	 * Only implemented for VOD Embeds
	 */
	popOut?: boolean;

	autoplay?: boolean;
	playInLoop?: boolean;
	hideChapters?: boolean;
	hideOverlayControls?: boolean;
	hidePlayControls?: boolean;
	hideCaptions?: boolean;
	forcedCaptions?: boolean;
	hideSettings?: boolean;
	hideFullscreen?: boolean;


	/**
	 * Starts the video at specified timestamp. must be in the format ##m##s. For example 00m30s.
	 */
	startAt?: string;

	/**
	 * Branding Settings. Logo image URL
	 */
	logoUrl?: string;

	/**
	 * Branding Settings. Accent color to use in the player, in HTML #rrggbb format
	 */
	accentColor?: string;
}
