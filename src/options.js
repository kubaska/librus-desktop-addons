const holidayDay = document.getElementById('lda-holiday-day');
const holidayMonth = document.getElementById('lda-holiday-month');

function restoreOptions() {
    browser.storage.sync.get(['holidayDay', 'holidayMonth']).then((data) => {
        holidayDay.value = data.holidayDay || "01";
        holidayMonth.value = data.holidayMonth || "01";
    });
}

function saveOptions() {
    browser.storage.sync.set({
        holidayDay: holidayDay.value,
        holidayMonth: holidayMonth.value
    });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
holidayDay.addEventListener('change', saveOptions);
holidayMonth.addEventListener('change', saveOptions);