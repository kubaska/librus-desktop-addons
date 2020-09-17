import Overlay from './Utils/Overlay';
import TableClassGenerator from "./Utils/TableClassGenerator";
import Config from "./Utils/Config";
import {ESettings} from "./Utils/ConfigDefaults";
import Util from './Utils/Util';
import {isFirefox} from "./Utils/Browser";

enum LessonType {
    ob = 'ob',
    sp = 'sp',
    nb = 'nb',
    u  = 'u',
    zw = 'zw'
}

enum PrimaryLessonType {
    OB, NB
}

enum SemesterType {
    s1 = 1, s2 = 2, BOTH
}

interface Semesters {
    [key: string]: LessonSet,
    1: LessonSet,
    2: LessonSet
}

interface LessonSet {
    [key: number]: number,
    ob: number, sp: number, nb: number, u: number, zw: number
}

class Attendance {
    private data: { [key: string]: Semesters } = {};
    private pages: number;
    private currentSchoolYear = this.getSchoolYear();
    private winterHolidaysDate: Number;
    private overlay: Overlay = new Overlay();
    private config: Config = new Config();

    constructor() {
        this.config.load().then(() => {
            this.winterHolidaysDate = this.getWinterHolidaysDate();
            this.renderButton();
        });
    }

    private renderButton = () => {
        let target = document.querySelector('table.filters > tfoot > tr > td');

        let button = document.createElement('input');
        button.type = 'button';
        button.id = 'lda-button-load';
        button.className = 'ui-button ui-widget ui-state-default ui-corner-all';
        button.value = 'Załaduj procentową frekwencję';
        button.name = 'lda-button-load';
        button.style.border = '1px solid';
        button.addEventListener('click', this.getAttendance);

        // Support hot reloading.
        if (!target.children.namedItem('lda-button-load')) {
            target.appendChild(button);
        } else {
            console.log('[LDA] Replacing target button.');
            target.replaceChild(button, target.children.namedItem('lda-button-load'));
        }
    };

    private getPage = (page: number) => new Promise((resolve, reject) => {
        let request = new XMLHttpRequest();

        request.open('POST', 'https://synergia.librus.pl/zrealizowane_lekcje', true);
        request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        request.onreadystatechange = () => {
            if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                let content = (new DOMParser).parseFromString(request.response, "text/html");
                // Scrap page count from first page.
                if (page === 1) {
                    let pagination = content.querySelector('.pagination');
                    
                    if (pagination) {
                        this.pages = Math.ceil(parseInt(pagination.textContent.split(' ').splice(-1)[0]) / 15);
                    } else {
                        this.pages = 1;
                    }
                }

                const tableNo = Util.findInTable(
                    document.querySelectorAll('table[class="decorated"] > thead > tr > td'),
                    ['Data', 'Zajęcie Edukacyjne', 'Frekwencja']
                );

                content.querySelectorAll('table[class="decorated"] > tbody > tr').forEach(el => {
                    let subjectDate = el.querySelector(`td:nth-child(${tableNo[0] || 1})`);
                    let subjectName = el.querySelector(`td:nth-child(${tableNo[1] || 4}) > b`);
                    let subjectState = el.querySelector(`td:nth-child(${tableNo[2] || 6}) > p > a`);

                    if (subjectDate && subjectName && subjectState) {
                        let semester = this.winterHolidaysDate > Date.parse(subjectDate.textContent) ? SemesterType.s1 : SemesterType.s2;

                        this.addLesson(subjectName.textContent, (<any>LessonType)[subjectState.textContent], semester);
                    }
                });

                resolve(request);
            }
        };
        request.onerror = () => {
            console.error('[LDA] Request failed: ', request);
            // todo error handling
            reject(request);
        };

        request.send(`data1=${this.currentSchoolYear}-09-01&data2=${this.currentSchoolYear+1}-07-01&filtruj_id_przedmiotu=-1&page=${page}`);
    });

    private getAttendance = () => {
        document.getElementById('lda-button-load').remove();
        this.overlay.show();

        this.getPage(1).then(() => {
            let promises: Promise<void>[] = [];
            this.overlay.setSteps(this.pages).next();

            for (let page = 2; page <= this.pages; page++) {
                promises.push(this.getPage(page).then(() => { this.overlay.next() }));
            }

            // todo request throttling?
            Promise.all(promises).then(() => {
                // Display table with gathered data
                // Exclusive to Firefox, because Chrome thinks it's an error (?)
                if (isFirefox()) {
                    console.table(this.data);
                }

                this.render();
            })
        })
    };

    private render = () => {
        let container;
        const cssGenerator = new TableClassGenerator;

        if (!document.getElementById('lda-container')) {
            let containerElem = document.createElement('div');
            containerElem.id = 'lda-container';
            containerElem.className = 'container';
            Util.insertAfter(containerElem, document.querySelector('table.filters'));
            container = containerElem;
        } else {
            container = document.getElementById('lda-container');
        }

        container.innerHTML = `
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
            Legenda: (ob / sp / nb / u / zw)
            </td></tr></tfoot>
            </table>`;

        let table = document.getElementById('da-percentage');

        for (let subjectName in this.data) {
            let el = document.createElement('tr');
            let str = `<td>${subjectName}</td>`;

            [SemesterType.s1, SemesterType.s2, SemesterType.BOTH].forEach(semester => {
                let subjectPercent = this.getSubjectTotalPercent(subjectName, semester);
                let totalHours = this.getTotal(subjectName, semester);
                let color = '';

                str += '<td class="center">';

                // Do not count attendance, if there are no hours.
                if(totalHours === 0) {
                    str += '<strong>&mdash;</strong>';
                }
                else {
                    if(subjectPercent <= 50)
                        color = 'color: red';
                    else if (subjectPercent <= 60)
                        color = 'color: rgb(234,112,0)'; // orange

                    str += `<strong style="${color}">${subjectPercent}%</strong>`;
                }

                str += '&nbsp;';

                str += `(${this.getSubjectAsString(subjectName, semester)})`;

                // If attendance is below 50% and there are any hours in semester, show min. required hours to get to 50%.
                if (subjectPercent < 50 && totalHours !== 0) {
                    str += '&nbsp;';
                    str += `<span title="potrzebna ilość ob do 50%" style="color: red">
						(${this.getTotalNb(subjectName, semester) - this.getTotalOb(subjectName, semester)})
					</span>`;
                }

                str += '</td>';

            });
            el.className = cssGenerator.getNext();
            el.innerHTML = str;
            table.appendChild(el);
        }
    };

    /**
     * Add subject to dataset.
     *
     * @param {string}          lessonName  Subject name.
     * @param {LessonType}      type        Subject state.  'ob', 'sp', 'nb', 'u', 'zw'
     * @param {SemesterType}    semester    Semester.       's1', 's2'
     */
    private addLesson = (lessonName: string, type: LessonType, semester: SemesterType): void => {
        if (!this.data[lessonName]) {
            this.data[lessonName] = {
                [SemesterType.s1]: {ob: 0, sp: 0, nb: 0, u: 0, zw: 0},
                [SemesterType.s2]: {ob: 0, sp: 0, nb: 0, u: 0, zw: 0}
            }
        }

        this.data[lessonName][semester][type]++;
    };

    /**
     *
     *
     * @param {PrimaryLessonType} type
     */
    private getLessonTypes = (type: PrimaryLessonType) => {
        const countZw = this.config.get(ESettings.ATTENDANCE_COUNT_ZW_AS_OB);

        if (type === PrimaryLessonType.OB) {
            return countZw
                ? [LessonType.ob, LessonType.sp, LessonType.zw]
                : [LessonType.ob, LessonType.sp];
        } else {
            return countZw
                ? [LessonType.u, LessonType.nb]
                : [LessonType.u, LessonType.nb, LessonType.zw];
        }
    };

    /**
     * Returns total number of OB in selected semester.
     *
     * @param subjectName  e.g 'Matematyka'
     * @param semester     e.g SemesterType.s1
     */
    public getTotalOb = (subjectName: string, semester: SemesterType): number => {
        return this.getTotalPrimaryAttendance(subjectName, semester, PrimaryLessonType.OB);
    };

    /**
     * Returns total number of NB in selected semester.
     *
     * @param subjectName  e.g 'Matematyka'
     * @param semester     e.g SemesterType.s1
     */
    public getTotalNb = (subjectName: string, semester: SemesterType): number => {
        return this.getTotalPrimaryAttendance(subjectName, semester, PrimaryLessonType.NB);
    };

    /**
     * Returns total number of OB/NB in selected semester.
     *
     * @param subjectName  e.g 'Matematyka'
     * @param semester     e.g SemesterType.s1
     * @param lessonType   e.g PrimaryLessonType.OB
     */
    private getTotalPrimaryAttendance = (subjectName: string, semester: SemesterType, lessonType: PrimaryLessonType): number => {
        if (semester === SemesterType.BOTH) {
            return [SemesterType.s1, SemesterType.s2]
                .map(semester => {
                    return this.getLessonTypes(lessonType)
                        .map(type => { return this.data[subjectName][semester][type] })
                        .reduce((a: number, b: number) => a+b)
                })
                .reduce((a: number, b: number) => a+b);
        } else {
            return this.getLessonTypes(lessonType)
                .map(type => { return this.data[subjectName][semester][type] })
                .reduce((a: number, b: number) => a+b)
        }
    };

    /**
     * Returns total hours of specified subject.
     *
     * @param subjectName   e.g 'Matematyka'
     * @param semester      e.g SemesterType.s1
     */
    public getTotal = (subjectName: string, semester: SemesterType): number => {
        if (semester === SemesterType.BOTH) {
            return [SemesterType.s1, SemesterType.s2]
                .map(semester => {
                    return Object.values(this.data[subjectName][semester])
                        .reduce((a: number, b: number) => a+b)
                })
                .reduce((a: number, b: number) => a+b);
        }
        else return Object.values(this.data[subjectName][semester]).reduce((a: number, b: number) => a+b);
    };

    /**
     * Returns total % hours of specified subject.
     *
     * @param subjectName   e.g 'Matematyka'
     * @param semester      e.g SemesterType.s1
     */
    public getSubjectTotalPercent = (subjectName: string, semester: SemesterType): number => {
        if (semester === SemesterType.BOTH) {
            // todo Math.round zamiast Number?
            return Number((this.getTotalOb(subjectName, SemesterType.BOTH) * 100 / this.getTotal(subjectName, SemesterType.BOTH)).toFixed(2));
        }
        else return Number((this.getTotalOb(subjectName, semester) * 100 / this.getTotal(subjectName, semester)).toFixed(2));
    };

    /**
     * Returns total hours of specified subject in the following format: 'ob/sp/nb/u/zw'
     *
     * @param subjectName   e.g 'Matematyka'
     * @param semester      e.g SemesterType.s1
     */
    public getSubjectAsString = (subjectName: string, semester: SemesterType): string => {
        if (semester === SemesterType.BOTH) {
            let res: LessonSet = {ob: 0, sp: 0, nb: 0, u: 0, zw: 0};

            [SemesterType.s1, SemesterType.s2].forEach(semester => {
                Object.values(LessonType).forEach(lessonType => {
                    res[lessonType] += this.data[subjectName][semester][lessonType];
                })
            });

            return Object.values(res).join(' / ');
        }
        else return Object.values(this.data[subjectName][semester]).join(' / ');
    };

    /**
     * Returns the year in which the school year began.
     *
     * @returns {number}
     */
    private getSchoolYear(): number {
        let date = new Date();

        if (date.getMonth() < 7) {
            return date.getFullYear() - 1;
        } else {
            return date.getFullYear();
        }
    }

    /**
     * Returns winter holidays date from config in timestamp millis.
     *
     * @returns {number}
     */
    private getWinterHolidaysDate(): number {
        const day = this.config.get(ESettings.ATTENDANCE_HOLIDAY_DAY);
        const month = this.config.get(ESettings.ATTENDANCE_HOLIDAY_MONTH);
        const monthInt = parseInt(<string>month);

        if (isNaN(monthInt)) {
            console.error('[LDA] Winter holidays date conversion failed');
            return Date.parse(`${this.currentSchoolYear+1}-01-01`);
        }

        const year = monthInt > 8 ? this.currentSchoolYear : (this.currentSchoolYear + 1);

        let date = Date.parse(`${year}-${month}-${day}`);

        if (isNaN(date)) {
            console.error('[LDA] Invalid winter holidays date.');
            return Date.parse(`${this.currentSchoolYear+1}-01-01`);
        } else {
            return date;
        }
    }
}

new Attendance();