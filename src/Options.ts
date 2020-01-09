import '../manifest.json.src';

import { ISettings, defaultSettings } from './Utils/ConfigDefaults';
import { browser } from 'webextension-polyfill-ts';

enum InputType {
    CHECKBOX,
    INPUT_NUMBER,
    SELECT
}

function restoreOptions() {
    browser.storage.sync.get(defaultSettings).then((data: ISettings) => {
        for (const name in data) {
            let element: HTMLInputElement = document.querySelector(`[data-internal="${name}"]`);

            switch (checkFormFieldType(element)) {
                case InputType.CHECKBOX:
                    element.checked = !!data[name];
                    break;

                case InputType.INPUT_NUMBER:
                    element.value = data[name];
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

            case InputType.INPUT_NUMBER:
                // If setting is not valid, do not save it and leave it default.
                if (!elem.checkValidity()) {
                    break;
                }

                settings[elem.dataset['internal']] = elem.value;
                break;

            case InputType.SELECT:
                settings[elem.dataset['internal']] = elem.value;
                break;
        }
    });

    return settings;
}

function checkFormFieldType(elem: HTMLInputElement) {
    if (elem.tagName.toLowerCase() === 'input') {
        if (elem.type.toLowerCase() === 'number') {
            return InputType.INPUT_NUMBER;
        }
        if (elem.type.toLowerCase() === 'checkbox') {
            return InputType.CHECKBOX;
        }
    }
    else if (elem.tagName.toLowerCase() === 'select') {
        return InputType.SELECT;
    }
}

restoreOptions();
createListeners();