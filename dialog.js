export function createDialog(id, title, body) {
  const dialogFragment = document.createDocumentFragment();
  const dialogContainer = document.createElement('div');
  dialogContainer.className = 'dialog-container';
  dialogContainer.id = id;
  const dialog = document.createElement('div');
  dialog.className = 'dialog';

  const dialogHeader = createDialogHeader();
  const dialogBody = document.createElement('div');
  dialogBody.className = 'dialog-body';
  dialogBody.append(body);
  const dialogFooter = createDialogFooter();

  dialog.append(dialogHeader, dialogBody, dialogFooter);
  dialogContainer.append(dialog);
  dialogFragment.append(dialogContainer);
  return dialogFragment;
}

function createDialogHeader() {
  const dialogHeader = document.createElement('header');
  dialogHeader.className = 'dialog-header';

  const dialogTitle = document.createElement('span');
  dialogTitle.className = 'dialog-title';
  dialogTitle.textContent = title;

  const dialogCloseX = document.createElement('span');
  dialogCloseX.className = 'dialog-hide-x';
  dialogCloseX.setAttribute('data-dialog-hide', id);
  dialogCloseX.innerHTML = '&times;';
  dialogCloseX.addEventListener('click', () => {
    const container = dialogCloseX.closest('.dialog-container');
    if(container.dispatchEvent(new Event('hidedialog', {cancelable: true}))) {
      hideDialog(container.id);
    }
  });

  dialogHeader.append(dialogTitle);
  dialogHeader.append(dialogCloseX);
  return dialogHeader;
}

function createDialogFooter() {
  const dialogFooter = document.createElement('div');
  dialogFooter.className = 'dialog-footer';

  const dialogCloseBtn = document.createElement('button');
  dialogCloseBtn.setAttribute('data-dialog-hide', id);
  dialogCloseBtn.innerHTML = 'OK';
  dialogCloseBtn.addEventListener('click', () => {
    const container = dialogCloseBtn.closest('.dialog-container');
    if(container.dispatchEvent(new Event('hidedialog', {cancelable: true}))) {
      hideDialog(container.id);
    }
  });

  dialogFooter.append(dialogCloseBtn);
  return dialogFooter;
}

export function showDialog(id) {
  document.getElementById(id).style.display = 'block';
}

export function hideDialog(id) {
  document.getElementById(id).style.display = 'none';
}

// enable semantic functionality
window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-dialog-show]').forEach((elem) => {
    elem.addEventListener('click', () => {
      const id = elem.dataset.dialogHide;
      const target = document.getElementById(id);
      if(target.dispatchEvent(new Event('showdialog', {cancelable: true}))) {
        showDialog(id);
      }
    });
  });

  document.querySelectorAll('[data-dialog-hide]').forEach((elem) => {
    elem.addEventListener('click', () => {
      const id = elem.dataset.dialogHide;
      const target = document.getElementById(id);
      if(target.dispatchEvent(new Event('hidedialog', {cancelable: true}))) {
        hideDialog(id);
      }
    });
  });
});
