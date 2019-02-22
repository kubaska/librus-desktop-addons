'use strict';

import Utils from './utils';

const TABLE_CONTAINER = `
<table class="decorated">
<thead>
<tr>
<td>Przedmiot</td>
<td>Semestr 1</td>
<td>Semestr 2</td>
<td>Rok</td>
</tr>
</thead>
<tbody id="da-percentage">
</tbody>
<tfoot><tr><td colspan="7">
Legenda: (ob / sp / u / nb / zw)
</td></tr></tfoot>
</table>`;

if (!document.getElementById('lda-container')) {
	let containerElem = document.createElement('div');
	containerElem.id = 'lda-container';
	containerElem.className = 'container';
	Utils.insertAfter(containerElem, document.querySelector('table.filters'));
}

// Variables
const schoolYear = getSchoolYear();
const container = document.getElementById('lda-container');
const classGenerator = generateTableHtmlClass();
let lessons = 0;
let pages = 0;
let query = `data1=${schoolYear}-09-01&data2=${schoolYear+1}-07-01&filtruj_id_przedmiotu=-1&page=`;
let promises = [];
let subjects = {};
let holidayDate = null;

// Methods
function getLessons(page) {
	return new Promise((resolve, reject) => {
		let request = new XMLHttpRequest();
		
		request.open('POST', 'https://synergia.librus.pl/zrealizowane_lekcje', true);
		request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		request.onreadystatechange = function() {
			if(this.readyState == XMLHttpRequest.DONE && this.status == 200) {
				let content = (new DOMParser).parseFromString(request.response, "text/html");

				// Scrap page count from first page.
				if (page === 1) {
					lessons = parseInt(content.querySelector('.pagination').textContent.split(' ').splice(-1));
					pages = Math.ceil(lessons / 15);
				}

				content.querySelectorAll('table[class="decorated"] > tbody > tr').forEach(el => {
					let subjectDate = Date.parse(el.querySelector('td:nth-child(1)').textContent);
					let subjectName = el.querySelector('td:nth-child(4) > b').textContent;
					let subjectState = el.querySelector('td:nth-child(6) > p > a').textContent;

					let semester = holidayDate > subjectDate ? 's1' : 's2';

					//
					if (subjectName && subjectState) {
						addSubject(subjectName, subjectState, semester);
					}
				});

				resolve();
			}
		};
		request.onerror = () => { reject(request); };

		request.send(query + page);
	});
}

/**
 * Generator that returns class that Librus use to style tables.
 * Outputs 'line0' and 'line1' alternately.
 *
 * @returns {string}
 */
function* generateTableHtmlClass() {
	let i = false;

	while(true){
		i = !i;
		yield `line${+i}`;
	}
}

/**
 * Returns the year in which the school year began.
 *
 * @returns {number}
 */
function getSchoolYear() {
    let date = new Date();

    if (date.getMonth() < 6) {
        return date.getFullYear() - 1;
    } else {
        return date.getFullYear();
    }
}

/**
 * Recalculate absence percent in dataset.
 */
function calculatePercent() {
	for (let subject in subjects) {
		['s1', 's2', 'yr'].forEach(semester => {
			let pr = parseFloat(
				(subjects[subject][semester].ob + subjects[subject][semester].sp + subjects[subject][semester].zw) * 100 / subjects[subject][semester].total
			);

			if (!isNaN(pr))
				subjects[subject][semester].percent = pr.toFixed(2);
		});
	}
}

/**
 * Add subject to dataset.
 *
 * @param name     Subject name.
 * @param value    Subject state.  'ob', 'sp', 'nb', 'u', 'zw'
 * @param semester Semester.       's1', 's2'
 */
function addSubject(name, value, semester) {
	if (!value) return;

	if (!subjects[name]) {
		subjects[name] = {
			s1: {total: 0, ob: 0, sp: 0, nb: 0, u: 0, zw: 0, percent: 0.00},
			s2: {total: 0, ob: 0, sp: 0, nb: 0, u: 0, zw: 0, percent: 0.00},
			yr: {total: 0, ob: 0, sp: 0, nb: 0, u: 0, zw: 0, percent: 0.00}
		};
	}

	subjects[name].yr.total++;
	subjects[name].yr[value]++;

	subjects[name][semester].total++;
	subjects[name][semester][value]++;
}

/**
 * Load all pages simultaneously and display data.
 */
function loadAndDisplay() {
	Utils.showOverlay();

	// Load first page and scrap
	getLessons(1).then(() => {
		for (let page = 2; page <= pages; page++) {
			promises.push(getLessons(page));
		}

		Promise.all(promises).then(() => {
			calculatePercent();
			console.table(subjects);

			Utils.hideOverlay();
			container.innerHTML = TABLE_CONTAINER;
			let table = document.getElementById('da-percentage');

            for (let subject in subjects) {
				table.appendChild(createTableRow(subject, subjects[subject]));
            }

			document.getElementById('lda-button-load').remove();
		});
	});
}

/**
 * Apply styles to subject name.
 *
 * @param semester
 * @returns {string}
 */
function generateSubjectCol(semester) {
	if(semester.total === 0) {
		return `<strong>-</strong>`;
	} else {
		let pr = parseFloat(semester.percent);
		let color = '';

		if(pr <= 50)
			color = 'style="color: red"';
		else if (pr <= 60)
			color = 'style="color: rgb(234,112,0)"';

		return `<strong ${color}>${semester.percent}%</strong>`;
	}
}

/**
 * Create table row with subject data.
 *
 * @param subjectName
 * @param subject
 * @returns {HTMLElement}
 */
function createTableRow(subjectName, subject) {
	let el = document.createElement('tr');
    let str = `<td>${subjectName}</td>`;

	['s1', 's2', 'yr'].forEach(semester => {
		str += `<td class="center">
					${generateSubjectCol(subject[semester])}&nbsp;
					(${subject[semester].ob} / ${subject[semester].sp} / ${subject[semester].nb} / ${subject[semester].u} / ${subject[semester].zw})
				</td>`;
    });

	// noinspection JSValidateTypes
	el.className = classGenerator.next().value;
    el.innerHTML = str;
	
	return el;
}

/**
 * Load extension module
 */
function loadModule() {
	let target = document.querySelector('table.filters > tfoot > tr > td');

	let button = document.createElement('input');
	button.type = 'button';
	button.id = 'lda-button-load';
	button.className = 'ui-button ui-widget ui-state-default ui-corner-all';
	button.value = 'Załaduj procentową frekwencję';
	button.name = 'lda-button-load';
	button.style.border = '1px solid';
	button.addEventListener('click', loadAndDisplay);

	// Support hot reloading.
	if (!target.children['lda-button-load']) {
		target.appendChild(button);
	} else {
		console.log('[LDA] Replacing target button.');
		target.replaceChild(button, target.children['lda-button-load']);
	}
}

/**
 * Fetch ext. options and load module.
 */
browser.storage.sync.get(['holidayDay', 'holidayMonth']).then(data => {
	if(data && data.holidayDay && data.holidayMonth) {
		let holidayYear = parseInt(data.holidayMonth) > 8 ? schoolYear : (schoolYear + 1);

		holidayDate = Date.parse(`${holidayYear}-${data.holidayMonth}-${data.holidayDay}`);
	} else {
		holidayDate = Date.parse(`${schoolYear+1}-01-01`);
	}

	loadModule();
});