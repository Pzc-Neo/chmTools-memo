/**
 * Custom module for quilljs to allow user to drag images from their file system into the editor
 * and paste images from clipboard (Works on Chrome, Firefox, Edge, not on Safari)
 * @see https://quilljs.com/blog/building-a-custom-module/
 */
window.Quill.register('modules/FileDrop', function (quill, options) {

	const plugin = {}

	/**
	 * Instantiate the module given a quill instance and any options
	 * @param {Quill} quill
	 * @param {Object} options
	 */
	plugin.init = function (quill, options = {}) {
		// save the quill reference
		this.quill = quill;
		this.quill.root.addEventListener('drop', function (event) {
			plugin.handleDrop(event)
		}, false);
		return
		// 这个暂时搞不明白，先不管-2021年12月9日03:32:23
		this.quill.root.addEventListener('paste', function (event) {
			plugin.handlePaste(event)
		}, false);
	}

	/**
	 * Handler for drop event to read dropped files from evt.dataTransfer
	 * @param {Event} evt
	 */
	plugin.handleDrop = function (evt) {
		if (evt.dataTransfer && evt.dataTransfer.files && evt.dataTransfer.files.length) {
			if (document.caretRangeFromPoint) {
				const selection = document.getSelection();
				const range = document.caretRangeFromPoint(evt.clientX, evt.clientY);
				if (selection && range) {
					selection.setBaseAndExtent(range.startContainer, range.startOffset, range.startContainer, range.startOffset);
				}
			}
			plugin.readFiles(evt.dataTransfer.files, function (text) {
				plugin.insert(text)
			});
		}
	}

	/**
	 * Handler for paste event to read pasted files from evt.clipboardData
	 * @param {Event} evt
	 */
	plugin.handlePaste = function (evt) {
		evt.preventDefault()
		console.log({
			evt
		});
		if (evt.clipboardData && evt.clipboardData.items && evt.clipboardData.items.length) {
			plugin.readFiles(evt.clipboardData.items, dataUrl => {
				const selection = this.quill.getSelection();
				if (selection) {
					// we must be in a browser that supports pasting (like Firefox)
					// so it has already been placed into the editor
				} else {
					// otherwise we wait until after the paste when this.quill.getSelection()
					// will return a valid index
					setTimeout(() => plugin.insert(dataUrl), 0);
				}
			});
		}
	}

	/**
	 * Insert the image into the document at the current cursor position
	 * @param {String} dataUrl  The base64-encoded image URI
	 */
	plugin.insert = function (dataUrl) {
		const index = (this.quill.getSelection() || {}).index || this.quill.getLength();
		// this.quill.insertEmbed(index, 'image', dataUrl, 'user');
		this.quill.setText(dataUrl)
	}

	/**
	 * Extract image URIs a list of files from evt.dataTransfer or evt.clipboardData
	 * @param {File[]} files  One or more File objects
	 * @param {Function} callback  A function to send each data URI to
	 */
	plugin.readFiles = function (files, callback) {
		// check each file for an image
		console.log(files);
		[].forEach.call(files, file => {
			// if (!file.type.match(/^image\/(gif|jpe?g|a?png|svg|webp|bmp|vnd\.microsoft\.icon)/i)) {
			if (!file.type.match(/^(text|application)\/(plain|doc|json|javascript|html|css)/i)) {
				// file is not an txt 
				// Note that some file formats such as psd start with image/* but are not readable
				return;
			}
			// set up file reader
			const reader = new FileReader();
			reader.onload = (evt) => {
				callback(evt.target.result);
			};
			// read the clipboard item or file
			const blob = file.getAsFile ? file.getAsFile() : file;
			if (blob instanceof Blob) {
				reader.readAsText(blob);
			}
		});
	}
	plugin.init(quill, options)

});