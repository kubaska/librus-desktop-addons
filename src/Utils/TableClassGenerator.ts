export default class TableClassGenerator {
    private readonly instance: Generator;

    constructor() {
        this.instance = this.generator();
    }

    public getInstance = () => {
        return this.instance;
    };

    /**
     * Generator that returns css class that Librus uses to style tables.
     * Outputs 'line0' and 'line1' alternately.
     *
     * @returns {string}
     */
    public getNext = () => {
        return this.instance.next().value;
    };

    private generator = function* () {
        let i = false;

        while(true){
            i = !i;
            yield `line${+i}`;
        }
    }
}