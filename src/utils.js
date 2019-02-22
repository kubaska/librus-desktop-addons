const overlayBox = document.getElementById('preloader-box');

function showOverlay() {
    overlayBox.classList.remove('hidden');
    overlayBox.style.display = 'block';

    let preloader = document.getElementById('preloader');
    document.getElementById('preloader-curtain').style.opacity = '0.5';
    preloader.style.left = (window.innerWidth / 2) - (preloader.offsetWidth / 2) + 'px';
    preloader.style.top = (window.innerHeight / 2) - (preloader.offsetHeight / 2) + 'px';
}

function hideOverlay() {
    overlayBox.classList.add('hidden');
    overlayBox.style.display = 'none';
}

/**
 * Insert HTMLElement after specified node.
 *
 * @param newNode
 * @param referenceNode
 */
function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

export default {
    showOverlay,
    hideOverlay,
    insertAfter
}