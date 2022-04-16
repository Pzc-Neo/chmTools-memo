(function () {
    const fs = require('fs')
    const path = require('path')

    module.exports = {
        load_folder: function (folder_path) {
            let item_list = []

            let items = fs.readdirSync(folder_path)
            for (let index = 0; index < items.length; index++) {
                const item = items[index];

                let item_path = path.join(folder_path, item)

                let stat = fs.statSync(item_path)

                let temp = {
                    name: item,
                    path: item_path,
                }
                if (stat.isDirectory()) {
                    temp.type = 'folder'
                } else {
                    temp.type = 'file'
                }
                item_list.push(temp)
            }
            return item_list
        },
        open: function (file) {
            file = file || app.view.default_file

            if (file.type == 'file') {
                let text = fs.readFileSync(file.path).toString()
                console.log({app});
                app.view.datas = JSON.parse(text)

                app.view.open_data(app.view.datas[0])

                app.view.app_name = file.name + "-" + configs.name
                app.view.current_file = file
                app.view.show_notification(`[已打开] ${file.name}`)
            }
        },
    }
})()