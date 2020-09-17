import './Utils/grades.css';
import Config from './Utils/Config';
import GradeModal from './Utils/GradeModal';
import GradeUtils, {GradeInfo} from './Utils/GradeUtils';
import {ESettings} from "./Utils/ConfigDefaults";

enum SemesterType {
    s1 = 1, s2 = 2, BOTH
}

enum Position {
    FIRST_SEM_GRADES,
    SECOND_SEM_GRADES
}

interface IPosition {
    [Position.FIRST_SEM_GRADES]: number,
    [Position.SECOND_SEM_GRADES]: number
}

interface IGradesForSubject {
    [SemesterType.s1]: Array<GradeInfo>,
    [SemesterType.s2]: Array<GradeInfo>
}

class Grades {
    private gradeRows = document.querySelectorAll('table:not([id]).decorated.stretch:not([style]) > tbody > tr[class^="line"]:not([id])');
    private gradeColumnPosition: IPosition;
    private config: Config = new Config();
    private modal: GradeModal = new GradeModal;

    private debugMode = false;

    constructor() {
        this.config.load().then(() => {
            if (!this.config.get(ESettings.GRADES_DISABLED)) {
                // @ts-ignore
                GradeUtils.plusValue = parseFloat(this.config.get(ESettings.GRADES_VALUES_PLUS));
                // @ts-ignore
                GradeUtils.minusValue = parseFloat(this.config.get(ESettings.GRADES_VALUES_MINUS));

                this.getCellPos();

                this.prepareGradeElements();

                this.modal.setEditCallback(this.editGrade);
                this.modal.setRollbackCallback(this.rollbackOrDeleteGrade);

                this.render();
            }
        });
    }

    /**
     * When we first load page with grades, we must extract grade properties from string
     * to easily accessible data properties.
     */
    private prepareGradeElements = () => {
        this.gradeRows.forEach(subject => {
            this.getSemesterColPos().forEach(semester => {
                subject.children[semester].querySelectorAll('.grade-box > a').forEach((element: HTMLAnchorElement) => {
                    let grade = GradeUtils.parseGrade(element);

                    GradeUtils.setGradeProperties(element, grade);

                    // Set additional attributes with original grade values
                    // so that we can rollback to it later.
                    GradeUtils.setGradeRollbackProperties(element, grade);

                    this.bindModal(element);
                });

                // Create grade add button.
                let fake = GradeUtils.createGradeAddBtn();
                subject.children[semester].appendChild(fake);
                this.bindFakeGradeAddBehaviour(fake);
            });
        });
    };


    private getCellPos = () => {
        const table: NodeListOf<HTMLTableDataCellElement> = document.querySelectorAll('table:not([id]).decorated.stretch:not([style]) > thead tr:nth-child(2) > td');

        if (table.length === 0) {
            // todo pretty error
            throw new Error('[LDA] Table design changed, exiting.');
        }

        const tableHeader: NodeListOf<HTMLTableHeaderCellElement|HTMLTableDataCellElement> = document.querySelectorAll('table:not([id]).decorated.stretch:not([style]) > thead > tr:nth-child(1) > td, th');
        let tableOffset = 0;
        tableHeader.forEach(element => {
            if (element.rowSpan && element.rowSpan !== 1) {
                tableOffset += element.colSpan || 1;
            }
        });

        let haystack = [
            { helper: Position.FIRST_SEM_GRADES, text: 'Oceny bieżące', title: /Oceny.*bieżące/ },
            { helper: Position.SECOND_SEM_GRADES, text: 'Oceny bieżące', title: /Oceny.*bieżące/ }
        ];

        // Set default values.
        let columnPositions: IPosition = {
            [Position.FIRST_SEM_GRADES]: null,
            [Position.SECOND_SEM_GRADES]: null,
        };

        // We start with previously found offset.
        let counter = tableOffset;

        table.forEach(element => {
            haystack.some((needle, index) => {
                if (element.textContent.trim().match(needle.text) || element.title.trim().match(needle.title)) {
                    columnPositions[needle.helper] = counter;

                    // Remove matched needle so that it doesnt get matched anymore.
                    haystack.splice(index, 1);

                    return true;
                }
            });

            counter += element.colSpan || 1;
        });

        console.log('[LDA] Found grade columns:', columnPositions);

        if (!columnPositions[Position.FIRST_SEM_GRADES] || !columnPositions[Position.SECOND_SEM_GRADES]) {
            // todo pretty error
            throw new Error('[LDA] Column with grades could not be found, exiting.');
        }

        this.gradeColumnPosition = columnPositions;
    };

    private bindModal = (gradeElem: HTMLAnchorElement) => {
        gradeElem.parentElement.addEventListener('click', (e) => {
            e.preventDefault();
            this.modal.setData(gradeElem).show();
        })
    };

    private bindFakeGradeAddBehaviour = (element: HTMLSpanElement) => {
        element.addEventListener('click', (e) => {
            let fake = GradeUtils.createFakeGradeElement();
            element.parentElement.insertBefore(fake, element.parentElement.querySelector('.lda__grade-add'));

            this.bindModal(<HTMLAnchorElement>fake.children[0]);

            this.renderAverageForSubject(<HTMLTableRowElement>element.parentElement.parentElement);
        })
    };

    private getSemesterColPos = () => {
        return [
            this.gradeColumnPosition[Position.FIRST_SEM_GRADES],
            this.gradeColumnPosition[Position.SECOND_SEM_GRADES]
        ];
    };

    /**
     * Main function that renders our average for the user.
     */
    private render = () => {
        // We do not want to render new column on every hot reload in development, so we just exit.
        // Very convenient!
        if (this.debugMode) {
            let exists = false;
            this.gradeRows.forEach(element => {
                if (element.children[element.children.length - 1].classList.contains('lda__cell-bold')) {
                    exists = true;
                }
            });
            if (exists) return;
        }

        // Add column describing total grade average.
        const header = document.querySelectorAll('table:not([id]).decorated.stretch:not([style]) > thead > tr');
        if (header.length === 2) {
            header[0].appendChild(GradeUtils.createCell('<span>Łącznie</span>', 'colspan center'));
            header[1].appendChild(GradeUtils.createCell('Średnia', 'no-border-top'));
        }

        // Stretch student behaviour row to fit newly added column.
        const behaviourRow = document.querySelector('table:not([id]).decorated.stretch:not([style]) > tbody > .bolded');
        if (behaviourRow) {
            (<HTMLTableDataCellElement> behaviourRow.children[behaviourRow.children.length-1]).colSpan += 1;
        }

        // Stretch footer (student behaviour details) to fit newly added column.
        const footer = document.querySelector('table:not([id]).decorated.stretch:not([style]) > tfoot > tr > td');
        if (footer) {
            (<HTMLTableDataCellElement> footer).colSpan += 1;
        }

        // Create and style new column.
        this.gradeRows.forEach((element: HTMLTableRowElement, index) => {
            let className = 'center lda__cell-bold';

            if (index === 0) className += ' lda__cell-bold-top';
            if (index === this.gradeRows.length - 1) className += ' lda__cell-bold-bottom';

            // Calculate and insert grade average styled cell.
            const average = this.calculateAverageForSubject(element);

            element.appendChild(
                GradeUtils.createCell(
                    GradeUtils.getAverageColumn(
                        average[SemesterType.s1], average[SemesterType.s2], average[SemesterType.BOTH]
                    ),
                    className
                )
            );
        });
    };

    private getGradesInRow = (element: HTMLTableRowElement) => {
        let grades: IGradesForSubject = {
            [SemesterType.s1]: [],
            [SemesterType.s2]: []
        };

        this.getSemesterColPos().forEach((semesterRow, index) => {
            element.children[semesterRow].querySelectorAll('.grade-box > a').forEach((grade: HTMLAnchorElement) => {
                grades[index ? SemesterType.s2 : SemesterType.s1].push(GradeUtils.getGradeMeta(grade));
            })
        });

        return grades;
    };

    /**
     * Takes grade element and tries to search parent elements for subject row.
     *
     * @param element
     */
    private unwrapGrade = (element: HTMLAnchorElement): HTMLTableRowElement => {
        let elem = <HTMLElement>element;

        for (let i = 0; i <= 7; i++) {
            elem = elem.parentElement;
            if (elem.nodeName.toLowerCase() === 'tr') {
                return <HTMLTableRowElement>elem;
            }
        }

        throw new Error('[LDA] Could not find grade row.');
    };

    /**
     * Callback from modal.
     *
     * @param element
     * @param grade
     */
    private editGrade = (element: HTMLAnchorElement, grade: GradeInfo) => {
        GradeUtils.setGradeProperties(element, grade);

        element.innerText = grade.grade;

        this.renderAverageForSubject(this.unwrapGrade(element));
    };

    /**
     * Callback from modal.
     *
     * @param element
     */
    private rollbackOrDeleteGrade = (element: HTMLAnchorElement) => {
        let grade = GradeUtils.getGradeMeta(element, true);

        if (grade.isCustom) {
            let rowRef = this.unwrapGrade(element);

            element.parentElement.remove();

            this.renderAverageForSubject(rowRef);
        } else {
            // Rollback
            this.renderAverageForSubject(this.unwrapGrade(element));
        }
    };

    /**
     * Calculate average for selected subject row.
     *
     * @param element
     */
    private calculateAverageForSubject = (element: HTMLTableRowElement) => {
        const grades = this.getGradesInRow(element);

        const firstSemAverage = GradeUtils.calculateAverage(grades[SemesterType.s1]);
        const secondSemAverage = GradeUtils.calculateAverage(grades[SemesterType.s2]);
        const yearAverage = GradeUtils.calculateAverage([...grades[SemesterType.s1], ...grades[SemesterType.s2]]);

        return {
            [SemesterType.s1]: firstSemAverage,
            [SemesterType.s2]: secondSemAverage,
            [SemesterType.BOTH]: yearAverage
        };
    };

    /**
     * Render average for selected subject row.
     *
     * @param element
     */
    private renderAverageForSubject = (element: HTMLTableRowElement) => {
        const average = this.calculateAverageForSubject(element);

        element.children[element.children.length - 1].innerHTML = GradeUtils.getAverageColumn(
            average[SemesterType.s1], average[SemesterType.s2], average[SemesterType.BOTH]
        );
    }
}

new Grades();