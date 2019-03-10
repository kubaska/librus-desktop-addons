const holidayDay = document.getElementById('lda-holiday-day');
const holidayMonth = document.getElementById('lda-holiday-month');
const countZw = document.getElementById('lda-count-zw');

function restoreOptions() {
    browser.storage.sync.get(['holidayDay', 'holidayMonth', 'countZw']).then(data => {
        holidayDay.value = data.holidayDay || '01';
        holidayMonth.value = data.holidayMonth || '01';
        countZw.checked = !!data.countZw;
    });
}

function saveOptions() {
    browser.storage.sync.set({
        holidayDay: holidayDay.value,
        holidayMonth: holidayMonth.value,
        countZw: !!countZw.checked
    });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
holidayDay.addEventListener('change', saveOptions);
holidayMonth.addEventListener('change', saveOptions);
countZw.addEventListener('change', saveOptions);