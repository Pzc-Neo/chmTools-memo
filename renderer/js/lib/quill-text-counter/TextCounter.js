class Counter {
    constructor(quill, options) {
        this.quill = quill;
        this.options = options;
        this.container = document.querySelector(options.container);
        quill.on('text-change', this.update.bind(this));
        this.update(); // Account for initial contents
    }

    calculate() {
        let text = this.quill.getText();
        if (this.options.unit === 'chiness') {
            text = text.trim();
            // Splitting empty text returns a non-empty array
            let count = this.count_chiness(text)
            // return text.length > 0 ? text.split(/\s+/).length : 0;
            return count
        } else {
            return text.length;
        }
    }

    update() {
        var length = this.calculate();
        var label = '字';
        if (this.options.unit == 'chiness') {
            label = '字';
        }
        this.container.innerText = length + ' ' + label;
    }
    count_chiness(text) {
        var pattern = /[\u4e00-\u9fa5]/g;
        var words = text.match(pattern);
        var count = 0;
        if (words == null) {
            return count;
        }
        count = words.length
        return count;

    }
}

Quill.register('modules/counter', Counter);