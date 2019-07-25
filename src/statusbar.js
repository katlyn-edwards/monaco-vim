export default class VimStatusBar {
  /**
   * @param {!Element} node
   * @param {!monaco.editor.IStandaloneCodeEditor} editor
   */
  constructor(node, editor) {
    /** @type {!Element} */
    this.node = node;
    /** @type {!Element} */
    this.modeInfoNode = document.createElement('span');
    /** @type {!Element} */
    this.secInfoNode = document.createElement('span');
    /** @type {!Element} */
    this.notifNode = document.createElement('span');
    /** @type {!Element} */
    this.keyInfoNode = document.createElement('span');
    /** @type {!monaco.editor.IStandaloneCodeEditor} */
    this.editor = editor;

    this.notifNode.className = 'vim-notification';
    this.keyInfoNode.setAttribute('style', 'float: right');
    this.node.appendChild(this.modeInfoNode);
    this.node.appendChild(this.secInfoNode);
    this.node.appendChild(this.notifNode);
    this.node.appendChild(this.keyInfoNode);
    this.toggleVisibility(false);
  }

  /**
   * @param {!CustomEvent} ev
   *
   * Custom event has the form {{mode: string}} where the mode could be
   * 'normal', 'insert', etc.
   */
  setMode(ev) {
    if (ev.mode === 'visual' && ev.subMode === 'linewise') {
      this.setText('--VISUAL LINE--');
      return;
    }

    this.setText(`--${ev.mode.toUpperCase()}--`);
  }

  /**
   * @param {string} key A string representation of the Vim key sequences.
   */
  setKeyBuffer(key) {
    this.keyInfoNode.textContent = key;
  }

  /**
   * @param {string} text
   * @param {function} callback
   * @param {{
   *    bottom: boolean,
   *    desc: string,
   *    onKeyDown: function,
   *    onKeyUp: function(),
   *    onClose: function(),
   *    prefix: string,
   *    selectValueOnOpen: boolean}} options,
   *    value: string,
   * }};
   */
  setSec(text, callback, options) {
    this.notifNode.textContent = '';
    if (text === undefined) {
      return;
    }

    this.secInfoNode.innerHTML = text;
    const input = this.secInfoNode.querySelector('input');

    if (input) {
      input.focus();
      this.input = {
        callback,
        options,
        node: input,
      };

      if (options) {
        if (options.selectValueOnOpen) {
          input.select();
        }

        if (options.value) {
          input.value = options.value;
        }
      }

      this.addInputListeners();
    }

    return this.closeInput;
  }

  /**
   * @param {string} text
   */
  setText(text) {
    this.modeInfoNode.textContent = text;
  }

  /**
   * @param {boolean} toggle
   */
  toggleVisibility(toggle) {
    if (toggle) {
      this.node.style.display = 'block';
    } else {
      this.node.style.display = 'none';
    }

    if (this.input) {
      this.removeInputListeners();
    }

    clearInterval(this.notifTimeout);
  }

  /**
   * @param {!Event} e
   */
  closeInput = (e) => {
    this.removeInputListeners();
    this.input = null;
    this.setSec('');

    if (this.editor) {
      this.editor.focus();
    }
  };

  /**
   * @param {!Event} e
   */
  inputKeyUp = (e) => {
    const { options } = this.input;
    if (options && options.onKeyUp) {
      options.onKeyUp(e, e.target.value, this.closeInput);
    }
  };

  /**
   * @param {!Event} e
   */
  inputBlur = (e) => {
    const { options } = this.input;

    if (options.closeOnBlur) {
      this.closeInput();
    }
  };

  /**
   * @param {!Event} e
   */
  inputKeyDown = (e) => {
    const { options, callback } = this.input;

    if (options && options.onKeyDown && options.onKeyDown(e, e.target.value, this.closeInput)) {
      return;
    }

    if (e.keyCode === 27 || (options && options.closeOnEnter !== false && e.keyCode == 13)) {
      this.input.node.blur();
      e.stopPropagation();
      this.closeInput();
    }

    if (e.keyCode === 13 && callback) {
      e.stopPropagation();
      e.preventDefault();
      callback(e.target.value);
    }
  };

  /**
   * Adds keyboard and focus listeners from the user input box.
   */
  addInputListeners() {
    const { node } = this.input;
    node.addEventListener('keyup', this.inputKeyUp);
    node.addEventListener('keydown', this.inputKeyDown);
    node.addEventListener('input', this.inputKeyInput);
    node.addEventListener('blur', this.inputBlur);
  }

  /**
   * Removes keyboard and focus listeners from the user input box.
   */
  removeInputListeners() {
    if (!this.input || !this.input.node) {
      return;
    }

    const { node } = this.input;
    node.removeEventListener('keyup', this.inputKeyUp);
    node.removeEventListener('keydown', this.inputKeyDown);
    node.removeEventListener('input', this.inputKeyInput);
    node.removeEventListener('blur', this.inputBlur);
  }

  /**
   * @param {string} text This text can contain HTML tags.
   */
  showNotification(text) {
    const sp = document.createElement('span');
    sp.innerHTML = text;
    this.notifNode.textContent = sp.textContent;
    this.notifTimeout = setTimeout(() => {
      this.notifNode.textContent = '';
    }, 5000);
  }
}
