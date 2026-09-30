import { translate } from '../core/preferences.js';

function setNameDialogTitle(key) {
  const title = document.getElementById('dlg-name-title');
  title.setAttribute('data-i18n', key);
  title.textContent = translate(key);
}

function setNameDialogSubmit(key) {
  const button = document.getElementById('btn-name-ok');
  button.setAttribute('data-i18n', key);
  button.textContent = translate(key);
}

function setNameDialogValue(value) {
  const input = document.getElementById('name-input');
  input.value = value;
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
}

function setNameDialogDismissible(dismissible) {
  document.getElementById('btn-name-cancel').hidden = !dismissible;
}

function setRegistrationDialogTitle(key) {
  const title = document.getElementById('dlg-register-title');
  title.setAttribute('data-i18n', key);
  title.textContent = translate(key);
}

export {
  setNameDialogTitle,
  setNameDialogSubmit,
  setNameDialogValue,
  setNameDialogDismissible,
  setRegistrationDialogTitle,
};
