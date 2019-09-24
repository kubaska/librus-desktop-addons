export default class Util {
    static insertAfter = (newNode: HTMLElement, referenceNode: HTMLElement) => {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    };

    static createCell = (text: string, className: string = 'center') => {
        let cell = document.createElement('td');
        cell.innerHTML = text;
        cell.className = className;

        return cell;
    };

    static findInTable = (tds: NodeListOf<HTMLTableDataCellElement>, needles: string | string[]) => {
        let _needles: string[] = [];
        let result: number[] = [];
        let pos = 1;

        // Unify
        if (needles instanceof Array) {
            needles.forEach(el => { result.push(null); });
            _needles = needles;
        } else {
            result = [null];
            _needles = [needles];
        }

        tds.forEach(td => {
            _needles.forEach((needle, i) => {
                if (td.textContent.trim() === needle) {
                    result[i] = pos;
                }
            });

            pos += td.colSpan;
        });

        return result;
    }
}
