"use strict";

function createDialog(id,title,fragment) {
	var dialogFragment = document.createDocumentFragment();
	var dialogContainer = document.createElement("div");
	dialogContainer.className = "dialog-container";
	dialogContainer.id = id;
	var dialog = document.createElement("div");
	dialog.className = "dialog";
	var dialogHeader = document.createElement("header");
	dialogHeader.className = "dialog-header";
	var dialogTitle = document.createElement("span");
	dialogTitle.className = "dialog-title";
	dialogTitle.textContent = title;
	var dialogCloseX = document.createElement("span");
	dialogCloseX.className = "dialog-hide-x";
	dialogCloseX.setAttribute("data-dialog-hide",id);
	dialogCloseX.innerHTML = "&times;";
	dialogCloseX.addEventListener("click",function() {
		if(dialogContainer.dispatchEvent(new Event("hidedialog",{cancelable:true}))) {
			dialogContainer.style.display = "none";
		}
	});
	dialogHeader.appendChild(dialogTitle);
	dialogHeader.appendChild(dialogCloseX);
	var dialogBody = document.createElement("div");
	dialogBody.className = "dialog-body";
	dialogBody.appendChild(fragment);
	var dialogFooter = document.createElement("div");
	dialogFooter.className = "dialog-footer";
	var dialogCloseBtn = document.createElement("button");
	dialogCloseBtn.setAttribute("data-dialog-hide",id);
	dialogCloseBtn.innerHTML = "OK";
	dialogCloseBtn.addEventListener("click",function() {
		if(dialogContainer.dispatchEvent(new Event("hidedialog",{cancelable:true}))) {
			dialogContainer.style.display = "none";
		}
	});
	dialogFooter.appendChild(dialogCloseBtn);
	dialog.appendChild(dialogHeader);
	dialog.appendChild(dialogBody);
	dialog.appendChild(dialogFooter);
	dialogContainer.appendChild(dialog);
	dialogFragment.appendChild(dialogContainer);
	return dialogFragment;
}

function showDialog(id) {
	document.getElementById(id).style.display = "block";
}

function hideDialog(id) {
	document.getElementById(id).style.display = "none";
}

window.addEventListener("DOMContentLoaded",function() {
	document.querySelectorAll("[data-dialog-show]").forEach(function(elem) {
		elem.addEventListener("click",function() {
			var target = document.getElementById(this.getAttribute("data-dialog-show"));
			if(target.dispatchEvent(new Event("showdialog",{cancelable:true}))) {
				target.style.display = "block";
			}
		});
	});
	document.querySelectorAll("[data-dialog-hide]").forEach(function(elem) {
		elem.addEventListener("click",function() {
			var target = document.getElementById(this.getAttribute("data-dialog-hide"));
			if(target.dispatchEvent(new Event("hidedialog",{cancelable:true}))) {
				target.style.display = "none";
			}
		});
	});
});