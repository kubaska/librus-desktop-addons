import '../manifest.json5';

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

                case InputType.SELECT:
                case InputType.INPUT_NUMBER:
                    element.value = data[name];
                    break;
            }
        }

        updateMonthDays();
    });
}

function updateMonthDays() {
    const month = <HTMLSelectElement>document.getElementById('lda-holiday-month');

    switch (month.value) {
        case "12":
        case "01":
            document.querySelectorAll('#lda-holiday-day option[data-hide]').forEach(el => el.classList.remove('d-none'));
            break;
        case "02":
            const day = <HTMLSelectElement>document.getElementById('lda-holiday-day');
            ['29', '30', '31'].some(invalidDay => {
                if (day.value === invalidDay) day.value = '28';
            });

            document.querySelectorAll('#lda-holiday-day option[data-hide]').forEach(el => el.classList.add('d-none'));
    }
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

    document.getElementById('lda-holiday-month').addEventListener('change', () => {
        updateMonthDays();
        saveOptions();
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
