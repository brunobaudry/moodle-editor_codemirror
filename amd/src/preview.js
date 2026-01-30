// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * @module     editor_codemirror/codemirror
 * @file       amd/src/review.js
 *
 */

import {get_string as getString} from 'core/str';

/**
 * Creates and manages preview toggle functionality for the editor.
 *
 * @param {Object} editorInstance - The CodeMirror editor instance
 * @param {HTMLElement} targetElement - The target element where editor is initialized
 * @returns {Object} Preview controller with destroy method
 */
export const initPreview = (editorInstance, targetElement) => {
    const state = {
        isPreview: false,
        elements: {},
        strings: {}
    };

    /**
     * Creates the preview container.
     * @returns {HTMLElement}
     */
    const createPreviewContainer = () => {
        const container = document.createElement('div');
        container.classList.add('editor_codemirror/preview-container');
        container.style.display = 'none';
        container.style.padding = '10px';
        container.style.border = '1px solid #ddd';
        container.style.minHeight = '200px';
        container.style.backgroundColor = '#fff';
        container.setAttribute('role', 'region');
        container.setAttribute('aria-label', state.strings.htmlpreview || 'HTML Preview');
        return container;
    };

    /**
     * Creates the toggle button with fallback icon support.
     * @returns {HTMLElement}
     */
    const createToggleButton = () => {
        const button = document.createElement('button');
        button.type = 'button';
        button.classList.add('btn', 'btn-secondary', 'editor_codemirror/preview-toggle');
        button.setAttribute('aria-label', state.strings.togglepreview || 'Toggle preview');
        button.setAttribute('title', state.strings.togglepreview || 'Toggle preview');

        // Set initial icon (eye for "view preview" state)
        updateButtonIcon(button, false);

        return button;
    };

    /**
     * Updates button icon with fallback for different Moodle versions.
     * Supports both Font Awesome 4.x (Moodle LTS) and 6.x (Moodle 4.0+)
     *
     * @param {HTMLElement} button - The button element
     * @param {boolean} isPreviewMode - Whether preview is currently active
     */
    const updateButtonIcon = (button, isPreviewMode) => {
        // Clear existing content
        button.innerHTML = '';

        const icon = document.createElement('i');

        if (isPreviewMode) {
            // Show code icon when in preview mode (to switch back to code).
            // FA6: fa-solid fa-code, FA4: fa fa-code.
            icon.className = 'fa fa-code';
            icon.setAttribute('aria-hidden', 'true');
            button.appendChild(icon);
            button.appendChild(document.createTextNode(' ' + (state.strings.code || 'Code')));
        } else {
            // Show eye icon when in code mode (to switch to preview).
            // FA6: fa-solid fa-eye, FA4: fa fa-eye.
            icon.className = 'fa fa-eye';
            icon.setAttribute('aria-hidden', 'true');
            button.appendChild(icon);
            button.appendChild(document.createTextNode(' ' + (state.strings.preview || 'Preview')));
        }
    };

    /**
     * Toggles between code and preview mode.
     */
    const togglePreview = () => {
        const {previewContainer, toggleButton, editorElement} = state.elements;

        state.isPreview = !state.isPreview;

        if (state.isPreview) {
            // Switch to preview mode
            previewContainer.style.display = 'block';
            editorElement.hidden = true;

            // Get content from editor and render as HTML
            const content = editorInstance.getValue();
            // Sanitize and render content safely
            previewContainer.innerHTML = content;

            updateButtonIcon(toggleButton, true);
            toggleButton.setAttribute('aria-pressed', 'true');
        } else {
            // Switch to code mode
            previewContainer.style.display = 'none';
            editorElement.hidden = false;

            updateButtonIcon(toggleButton, false);
            toggleButton.setAttribute('aria-pressed', 'false');
        }
    };

    /**
     * Initializes the preview functionality.
     */
    const initialize = async() => {
        // Load language strings
        const strings = await getString('get_strings', {
            stringkeys: [
                {key: 'preview', component: 'editor_codemirror'},
                {key: 'code', component: 'editor_codemirror'},
                {key: 'togglepreview', component: 'editor_codemirror'},
                {key: 'htmlpreview', component: 'editor_codemirror'}
            ]
        });

        // Store strings in state
        state.strings = {
            preview: strings[0],
            code: strings[1],
            togglepreview: strings[2],
            htmlpreview: strings[3]
        };

        const editorElement = document.querySelector('.cm-editor');

        if (!editorElement || !targetElement.parentNode) {
            // eslint-disable-next-line no-console
            console.error('CodeMirror editor element not found');
            return;
        }

        // Create UI elements
        const previewContainer = createPreviewContainer();
        const toggleButton = createToggleButton();

        // Store references
        state.elements = {
            editorElement,
            previewContainer,
            toggleButton
        };

        // Add event listener
        toggleButton.addEventListener('click', togglePreview);

        // Append to DOM
        targetElement.parentNode.appendChild(previewContainer);
        targetElement.parentNode.appendChild(toggleButton);
    };

    /**
     * Destroys the preview functionality and cleans up.
     */
    const destroy = () => {
        const {previewContainer, toggleButton} = state.elements;

        if (toggleButton) {
            toggleButton.removeEventListener('click', togglePreview);
            toggleButton.remove();
        }

        if (previewContainer) {
            previewContainer.remove();
        }

        state.elements = {};
    };

    // Initialize on creation.
    initialize();

    // Return controller.
    return {
        destroy,
        toggle: togglePreview
    };
};
