import { browser } from 'webextension-polyfill-ts';
import {ISettings, defaultSettings, ESettings} from "./ConfigDefaults";

export default class Config {
    private settings: ISettings = defaultSettings;

    public load = async () => {
        await browser.storage.sync.get(defaultSettings)
            .then((data: ISettings) => {
                this.settings = data;
            });

        return this.settings;
    };

    public get = (name: ESettings) => {
        return this.settings[name];
    };

    public getAll = () => {
        return this.settings;
    };
}