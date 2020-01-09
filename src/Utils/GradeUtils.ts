export interface GradeInfo {
    grade: string,
    gradeValue: number|null,
    weight: number|null,
    countToAverage: boolean,
    isModified: boolean,
    isCustom: boolean
}

export default class GradeUtils {
    static plusValue = 0.25;
    static minusValue = 0.25;

    static getGradeValue = (grade: string, modifier: string) => {
        let value = parseInt(grade);

        if (isNaN(value)) return null;

        if (modifier === '+') value += GradeUtils.plusValue;
        if (modifier === '-') value -= GradeUtils.minusValue;

        // Just to be sure
        if (value < 0) value = 0;

        return value;
    };

    static parseGrade = (element: HTMLAnchorElement): GradeInfo => {
        let grade = element.getAttribute('data-lda-original-grade') || element.textContent;
        let _gradeValue = element.textContent.match(/([1-6])([+-]?)/);
        let _weight = element.title.match(/Waga: (\d+)/);
        let _countToAverage = element.title.match(/Licz do średniej:\s*(tak|nie)/);

        let gradeValue = _gradeValue ? GradeUtils.getGradeValue(_gradeValue[1], _gradeValue[2]) : null;
        let weight = (_weight && _weight[1] && parseInt(_weight[1])) ? parseInt(_weight[1]) : null;
        // If we do not match anything, we wanna set false, not null.
        let countToAverage = (_countToAverage && _countToAverage[1] === 'tak') ? true : false;

        return {
            grade, gradeValue, weight, countToAverage, isModified: false, isCustom: false
        }
    };

    static getGradeMeta = (elem: HTMLAnchorElement, fromOriginalValues = false): GradeInfo => {
        let originalPrefix = fromOriginalValues ? 'data-lda-original-' : 'data-lda-';

        let grade = elem.getAttribute(`${originalPrefix}grade`);
        let weight = parseInt(elem.getAttribute(`${originalPrefix}weight`)) || null;
        let countToAverage = !!parseInt(elem.getAttribute(`${originalPrefix}count-to-average`));
        let gradeValue = parseFloat(elem.getAttribute(`${originalPrefix}grade-value`)) || null;

        let isModified = fromOriginalValues ? false : !!parseInt(elem.getAttribute('data-lda-is-modified'));
        let isCustom = !!parseInt(elem.getAttribute('data-lda-is-custom'));

        return {
            grade, gradeValue, weight, countToAverage, isModified, isCustom
        }
    };

    /**
     * Set grade metadata after user edited it.
     *
     * @param element
     * @param grade
     */
    static setGradeProperties = (element: HTMLAnchorElement, grade: GradeInfo) => {
        element.setAttribute('data-lda-grade', grade.grade);
        // @ts-ignore
        element.setAttribute('data-lda-grade-value', grade.gradeValue || '');
        // @ts-ignore
        element.setAttribute('data-lda-weight', grade.weight || '');
        // @ts-ignore
        element.setAttribute('data-lda-count-to-average', +grade.countToAverage);
        // @ts-ignore
        element.setAttribute('data-lda-is-modified', +grade.isModified);
        // @ts-ignore
        element.setAttribute('data-lda-is-custom', +grade.isCustom);
    };

    /**
     * Save original grade values so that we can rollback to it when needed.
     * Supposed to run only once.
     *
     * @param element
     * @param grade
     */
    static setGradeRollbackProperties = (element: HTMLAnchorElement, grade: GradeInfo) => {
        // @ts-ignore
        element.setAttribute('data-lda-original-grade', grade.grade);
        // @ts-ignore
        element.setAttribute('data-lda-original-grade-value', +grade.gradeValue);
        // @ts-ignore
        element.setAttribute('data-lda-original-weight', grade.weight);
        // @ts-ignore
        element.setAttribute('data-lda-original-count-to-average', +grade.countToAverage);
    };

    /**
     * Reset grade element attributes to its original values,
     * but additionally reset grade text.
     *
     * @param element
     */
    static renewGrade = (element: HTMLAnchorElement) => {
        let grade = GradeUtils.getGradeMeta(element, true);

        element.innerText = grade.grade;

        GradeUtils.setGradeProperties(element, grade);
    };

    static calculateAverage = (grades: Array<GradeInfo>) => {
        let totalGradeValue = 0, totalGradeWeight = 0;

        grades.forEach(grade => {
            if (grade.countToAverage) {
                totalGradeValue += grade.gradeValue * grade.weight;
                totalGradeWeight += grade.weight;
            }
        });

        let average = totalGradeValue / totalGradeWeight;

        return isNaN(average) ? '&ndash;' : average.toFixed(2);
    };

    static createCell = (text: string, className: string = 'center') => {
        let cell = document.createElement('td');
        cell.innerHTML = text;
        cell.className = className;

        return cell;
    };

    static getAverageColumn = (avgFirstSem: number|string, avgSecondSem: number|string, avgYear: number|string) => {
        return `
            <div class="lda__sem-col">
                <div><span>I:&nbsp;</span><span>${avgFirstSem}</span></div>
                <div><span>II:&nbsp;</span><span>${avgSecondSem}</span></div>
                <div><span>R:&nbsp;</span><span>${avgYear}</span></div>
            </div>
        `;
    };

    static createGradeAddBtn = () => {
        let element = document.createElement('span');
        element.className = 'lda__grade-add';
        element.textContent = '+';

        return element;
    };

    static createFakeGradeElement = () => {
        let a = document.createElement('a');
        a.textContent = '5';

        GradeUtils.setGradeProperties(
            a,
            {
                grade: '5',
                gradeValue: 5,
                weight: 1,
                countToAverage: true,
                isModified: false,
                isCustom: true
            }
        );

        let span = document.createElement('span');
        span.className = 'grade-box lda__grade-custom';
        span.appendChild(a);

        return span;
    }
}