import './modal.css';
import GradeUtils, { GradeInfo } from "./GradeUtils";

interface Hooks {
    modal: HTMLDivElement,
    select: HTMLSelectElement,
    weight: HTMLInputElement,
    counted: HTMLInputElement,
    info: HTMLAnchorElement,
    btnOk: HTMLButtonElement,
    btnDelete: HTMLButtonElement
}

export default class GradeModal {
    private hooks: Hooks;
    private editFn: Function = () => {};
    private rollbackFn: Function = () => {};

    constructor() {
        if (document.querySelector('.lda__grade-modal')) {
            document.body.removeChild(document.querySelector('.lda__grade-modal'));
        }

        this.create();
    }

    private create = () => {
        let modal = document.createElement('div');
        modal.className = 'lda__grade-modal';
        modal.innerHTML = `
<div class="lda__grade-modal-content">
<div class="lda__grade-modal-header">
    <span class="lda__grade-modal-btn-close">&times;</span>
    <h2 style="margin: 0.5rem">Edycja oceny</h2>
  </div>
  <div class="lda__grade-modal-body">
  <div class="lda__row">
    <p>Ocena:</p>
    <select style="width: 50px" id="lda__grade-select">
        <option disabled selected hidden></option>
        <option value="0">0</option>
        <option value="1-">1-</option>
        <option value="1">1</option>
        <option value="1+">1+</option>
        <option value="2-">2-</option>
        <option value="2">2</option>
        <option value="2+">2+</option>
        <option value="3-">3-</option>
        <option value="3">3</option>
        <option value="3+">3+</option>
        <option value="4-">4-</option>
        <option value="4">4</option>
        <option value="4+">4+</option>
        <option value="5-">5-</option>
        <option value="5">5</option>
        <option value="5+">5+</option>
        <option value="6-">6-</option>
        <option value="6">6</option>
        <option value="6+">6+</option>
    </select>
    </div>
    
    <div class="lda__row">
        <p>Waga:</p>
        <input type="number" id="lda__grade-weight" class="lda__input-number" min="1" max="99"/>
    </div>

    <div class="lda__row">
        <p>Licz do średniej:</p>&nbsp;
        <input type="checkbox" id="lda__grade-counted"/>
    </div>
    
    <a href="#" target="_blank" id="lda__grade-info">Informacje o ocenie</a>
  </div>
  <div class="lda__grade-modal-footer">
    <button class="lda__modal-btn lda__modal-btn-success" id="lda__grade-confirm">Zmień</button>
    <button class="lda__modal-btn lda__modal-btn-danger" id="lda__grade-delete">Usuń</button>
  </div>
</div>`;

        document.body.appendChild(modal);

        this.hooks = {
            modal,
            select: document.getElementById('lda__grade-select') as HTMLSelectElement,
            weight: document.getElementById('lda__grade-weight') as HTMLInputElement,
            counted: document.getElementById('lda__grade-counted') as HTMLInputElement,
            info: document.getElementById('lda__grade-info') as HTMLAnchorElement,
            btnOk: document.getElementById('lda__grade-confirm') as HTMLButtonElement,
            btnDelete: document.getElementById('lda__grade-delete') as HTMLButtonElement
        };

        // Set close action for button
        modal.children[0].children[0].children[0].addEventListener('click', () => { this.hide() });
    };

    public setData = (element: HTMLAnchorElement) => {
        let grade = GradeUtils.getGradeMeta(element);

        // If selected grade is countable, select it
        // if not, then set empty placeholder option.
        const gradeMatch = this.hooks.select.querySelector(`option[value="${grade.grade}"]`);
        if (gradeMatch) {
            (<HTMLOptionElement> gradeMatch).selected = true;
        } else {
            (<HTMLOptionElement> this.hooks.select.querySelector(`option:disabled`)).selected = true;
        }

        // Cast to string; cannot use .toString, because weight sometimes is null.
        this.hooks.weight.value = `${grade.weight}`;
        this.hooks.counted.checked = grade.countToAverage;
        this.hooks.info.href = element.href;

        this.hooks.btnDelete.style.display = (!grade.isModified && !grade.isCustom) ? 'none' : 'block';

        if (grade.isCustom) {
            this.hooks.btnDelete.textContent = 'Usuń';
            this.hooks.info.hidden = true;
        } else {
            this.hooks.btnDelete.textContent = 'Cofnij';
            this.hooks.info.hidden = false;
        }

        this.hooks.btnOk.onclick = () => { this.btnOk(element) };
        this.hooks.btnDelete.onclick = () => { this.btnRollbackOrDelete(element) };

        return this;
    };

    private btnOk = (element: HTMLAnchorElement) => {
        let original = GradeUtils.getGradeMeta(element);

        let grade = this.hooks.select.value;
        let gradeValue = GradeUtils.getGradeValue(grade[0], grade[1]);
        let weight = +this.hooks.weight.value;
        let countToAverage = this.hooks.counted.checked;

        if (!grade || !weight) {
            return;
        }

        // In case someone tries to do naughty things.
        if (weight > 99) weight = 99;
        if (weight < 1) weight = 1;

        let gradeInfo: GradeInfo = {
            grade,
            gradeValue,
            weight,
            countToAverage,
            isModified: !original.isCustom,
            isCustom: original.isCustom
        };

        if (!element.parentElement.classList.contains('lda__grade-edited') && !gradeInfo.isCustom) {
            element.parentElement.classList.add('lda__grade-edited');
        }

        this.editFn(element, gradeInfo);

        this.hide();
    };

    private btnRollbackOrDelete = (element: HTMLAnchorElement) => {
        if (element.parentElement.classList.contains('lda__grade-edited')) {
            element.parentElement.classList.remove('lda__grade-edited');
        }

        GradeUtils.renewGrade(element);

        this.rollbackFn(element);

        this.hide();
    };

    public setEditCallback = (fn: Function) => {
        this.editFn = fn;
    };

    public setRollbackCallback = (fn: Function) => {
        this.rollbackFn = fn;
    };

    public show = () => {
        this.hooks.modal.style.display = 'block';
    };

    public hide = () => {
        this.hooks.modal.style.display = 'none';
    };
}