import { IVbrickVideoConfig, IVbrickWebcast, IVbrickWebcastConfig } from './IVbrickApi';
/**
 * Assign default configuration values that will be applied to future api calls.
 * @param configuration A configuration object.
 *
 * @example
 * Presetting a rev URL:
 * ```
 * vbrickEmbed.defaults({ baseUrl: 'https://rev1.site.com' })
 * ```
 */
export declare function defaults(configuration: Partial<IVbrickWebcastConfig>): void;
/**
 * Embeds a webcast on the page
 * @param element  Either a CSS selector string or HTML Element where the embed content will be rendered
 * @param webcastId
 * @param config A configuration object
 * @returns An {@linkcode IVbrickWebcastConfig} object
 *
 * @example
 * Embedding a webcast:
 * ```
 * //In HTML:  <div id="webcast-embed"></div>
 *
 * const webcastId = '0d252797-6db7-44dc-aced-25a6843d529c';
 * revSdk.embedWebcast('#webcast-embed', webcastId, {
 *     showVideo: true,
 *     token
 * });
 * ```
 *
 */
export declare function embedWebcast(element: HTMLElement | string, webcastId: string, config?: IVbrickWebcastConfig): IVbrickWebcast;
export declare function embedVideo(element: HTMLElement | string, webcastId: string, config: IVbrickVideoConfig): void;
