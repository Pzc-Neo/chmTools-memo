(function () {
  "use strict";

  const {
    ipcMain,
    dialog
  } = require('electron')

  const fs = require('fs')
  const path = require('path')

  module.exports = {
    data: {
      tool_config: {},
      tool_key: ''
    },
    /**
     * 打开软件的时候执行(可以为空，但必须要有)
     * @param {Object} ct 主进程传递过来的
     */
    init: function (ct) {
      let tool_config = require('../tool.config.json')
      this.tool_config = tool_config
      this.data.tool_key = ct.util.make_tool_key(tool_config)
      let win = ct.wins[this.data.tool_key]

      // 添加监听器(可以为空，但必须要有)
      ipcMain.on(this.data.tool_key, (event, command, args) => {
        if (command == "save") {
          this.save_database(event)
        } else if (command == "open") {
          this.open_database(event)
        } else if (command == 'win_close') {
          this.save_config(win)
          win.close()
          event.returnValue = "已关闭窗口"
        } else if (command == 'export_txt') {
          this.export_txt(event, args)
        } else if (command == 'win_show') {
          win.show()
          event.returnValue = "显示窗口"
        } else if (command == 'win_always_on_top') {
          win.setAlwaysOnTop(!win.isAlwaysOnTop())
          event.returnValue = "切换置顶"
        } else if (command == 'win_minimize') {
          win.minimize()
          event.returnValue = "窗口最小化"
        } else if (command == 'win_maximize') {
          if (win.isMaximized()) {
            win.unmaximize()
            event.returnValue = '取消最大化'
          } else {
            win.maximize()
            event.returnValue = '最大化'
          }
        }
      })
    },

    // 关闭软件的时候执行(可以为空，但必须要有)
    destroyed: function () {
      // 移除本软件的所有监听器
      ipcMain.removeAllListeners(this.data.tool_key)
    },
    export_txt: function (event, data) {
      dialog.showSaveDialog({
        title: "请选择要保存到的文件夹",
        buttonLabel: "确定",
        defaultPath: `${data.name}.txt`,
        filters: [{
          name: 'Custom File Type',
          extensions: ['txt']
          // extensions: ['js', 'html', 'json']
        }],
        properties: [{
          multiSelections: false,
          openDirectory: true,
          openFile: false,
        }]
      }).then(result => {
        event.returnValue = result
      }).catch(err => {
        alert(err)
      })
    },

    save_config: function (win) {
      let sizes = win.getSize()
      this.tool_config.window_option.width = sizes[0]
      this.tool_config.window_option.height = sizes[1]

      let pos = win.getPosition()
      this.tool_config.window_option.x = pos[0]
      this.tool_config.window_option.y = pos[1]

      let str = JSON.stringify(this.tool_config)
      let file_path = path.join(__dirname, '../tool.config.json')
      fs.writeFileSync(file_path, str)
    },



  }
})()