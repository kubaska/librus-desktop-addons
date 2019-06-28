import './overlay.css';

export default class Overlay {
    private overlayHook: HTMLElement;
    private stepsMade: number = 0;
    private totalSteps: number = null;
    private finished: boolean = false;

    constructor(isHidden: boolean = true, totalSteps: number = null, private autoComplete: boolean = true) {
        // Hot reloaded, dont create new instance - instead hook existing.
        if (document.querySelector('.lda__overlay-container')) {
            this.overlayHook = document.querySelector('.lda__overlay-container');
        }
        else {
            this.create(isHidden);
        }

        if (totalSteps) this.setSteps(totalSteps);
    }

    private getBar = () => {
        return <HTMLElement>this.overlayHook.children[1].children[0].children[0];
    };

    private getText = () => {
        return <HTMLElement>this.overlayHook.children[1].children[0].children[1];
    };

    private create = (isHidden: boolean = true) => {
        let container = document.createElement('div');
        container.className = 'lda__overlay-container';
        container.innerHTML = `
            <div class="lda__overlay-logo"></div>
            <div class="lda__overlay-progress-bar-container">
                <div class="lda__overlay-progress-bar">
                    <div class="lda__overlay-bar"></div>
                    <span class="lda__overlay-counter">Wczytuję...</span>
                </div>
            </div>
        `;

        if (isHidden) container.style.display = 'none';

        document.body.appendChild(container);
        this.overlayHook = container;
    };
    
    public setSteps = (steps: number) => {
        this.totalSteps = steps;

        // Overlay already exists, reconfigure.
        if (this.stepsMade) {
            this.getBar().style.width = `${(this.stepsMade / this.totalSteps * 100).toFixed(2)}%`;
            this.getText().textContent = `${this.stepsMade} / ${this.totalSteps}`;
        }

        return this;
    };

    /**
     * Advance overlay progress.
     */
    public next = () => {
        // No effect if overlay finished or we do not know step count.
        if (!this.totalSteps || this.finished) return;

        if ((this.stepsMade + 1 === this.totalSteps) && this.autoComplete) this.finish();

        this.stepsMade++;
        this.getBar().style.width = `${(this.stepsMade / this.totalSteps * 100).toFixed(2)}%`;
        this.getText().textContent = `${this.stepsMade} / ${this.totalSteps}`;

        return this;
    };

    /**
     * Show overlay.
     */
    public show = () => {
        this.overlayHook.style.display = 'flex';

        return this;
    };

    /**
     * Hide overlay.
     */
    public hide = () => {
        this.overlayHook.style.display = 'none';

        return this;
    };

    /**
     * Reset overlay progress.
     */
    public reset = () => {
        this.stepsMade = 0;
        this.getBar().style.width = '0%';
        this.getText().textContent = `0 / ${this.totalSteps}`;
        this.finished = false;

        return this;
    };

    public finish = () => {
        this.finished = true;
        this.hide();
    }
}