import '../manifest.json.src';

import { ISettings, defaultSettings } from './Utils/ConfigDefaults';
import { browser } from 'webextension-polyfill-ts';

enum InputType {
    SELECT,
    CHECKBOX
}

function restoreOptions() {
    browser.storage.sync.get(defaultSettings).then((data: ISettings) => {
        for (const name in data) {
            let element: HTMLInputElement = document.querySelector(`[data-internal="${name}"]`);

            switch (checkFormFieldType(element)) {
                case InputType.CHECKBOX:
                    element.checked = !!data[name];
                    break;
                case InputType.SELECT:
                    element.value = data[name];
                    break;
            }
        }
    });
}

// todo saved alert
function saveOptions() {
    let options: ISettings = getFormSettings();

    browser.storage.sync.set(options);
}

function createListeners() {
    document.querySelectorAll('[data-internal]').forEach(elem => {
        elem.addEventListener('change', saveOptions);
    });
}

function getFormSettings() {
    let settings: ISettings = defaultSettings;

    document.querySelectorAll('[data-internal]').forEach((elem: HTMLInputElement) => {
        switch (checkFormFieldType(elem)) {
            case InputType.CHECKBOX:
                settings[elem.dataset['internal']] = elem.checked;
                break;
            case InputType.SELECT:
                settings[elem.dataset['internal']] = elem.value;
                break;
        }
    });

    return settings;
}

function checkFormFieldType(elem: HTMLInputElement) {
    if (elem.tagName === 'INPUT') {
        if (elem.type === 'checkbox') {
            return InputType.CHECKBOX;
        }
    }
    else if (elem.tagName === 'SELECT') {
        return InputType.SELECT;
    }
}

restoreOptions();
createListeners();