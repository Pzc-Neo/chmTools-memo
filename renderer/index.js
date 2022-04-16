"use strict";
const { ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");

let configs = require("../tool.config.json");
let tool_key = require("electron").ipcRenderer.sendSync(
  "get_tool_key",
  configs
);

const app = {};

app.file = require("./js/file");

app.view = new Vue({
  el: "#app",
  data: {
    app_name: configs.name,
    // file_name: current_data.name + "-" + configs.name,
    // app_name: `${configs.name} v${configs.version}`,
    app_setting: {},

    target_el: ".chmST_bottom_bar .left .data_list",

    files: [],
    current_file: {},

    default_file: {
      type: "file",
      name: "默认",
      path: path.join(__dirname, "./data.json"),
    },
    datas: {},
    current_data: {},

    contextmenu_data_index: 0,
    contextmenu_ev: {},

    editor: {},
    editor_is_change: false,
    word_count: 100,

    style_contextmenu: {
      position: "fixed",
      display: "none",
      top: "0px",
      left: "0px",
    },
    is_show_side_bar: true,
    is_show_more_tool: false,
    is_show_setting_panel: false,
    is_show_folder_panel: false,

    shortcut_key: [
      {
        titie: "显示隐藏侧栏",
        key: "ctrl+q",
      },
      {
        titie: "显示隐藏侧栏",
        key: "ctrl+shift+q",
      },
      {
        titie: "显示隐藏侧栏",
        key: "ctrl+shift+q+t",
      },
    ],

    win_always_on_top: false,
  },
  mounted() {
    this.init();
  },
  methods: {
    init: function () {
      let default_folder = path.join(__dirname, "./data");
      this.files = app.file.load_folder(default_folder);

      this.editor = this.new_editor("#editor");
      this.open_file(this.default_file);

      this.add_shortcut_key("html");

      document.title = this.app_name;

      window.onblur = function () {
        document.querySelector(".chmST_top_bar").style.color = "#a2a2a2";
      };
      window.onfocus = function () {
        document.querySelector(".chmST_top_bar").style.color = "inherit";
      };
    },
    new_editor: function (target) {
      const toolbarOptions = [
        ["bold", "italic", "underline", "strike"], //加粗，斜体，下划线，删除线
        [
          {
            header: 1,
          },
          {
            header: 2,
          },
        ], // 标题，键值对的形式；1、2表示字体大小

        ["blockquote", "code-block"], //引用，代码块
        [
          {
            list: "ordered",
          },
          {
            list: "bullet",
          },
        ], //列表
        [
          {
            script: "sub",
          },
          {
            script: "super",
          },
        ], // 上下标
        [
          {
            indent: "-1",
          },
          {
            indent: "+1",
          },
        ], // 缩进
        // [{
        //     'direction': 'rtl'
        // }], // 文本方向

        [
          {
            header: [1, 2, 3, 4, 5, 6, false],
          },
        ], //几级标题

        [
          {
            color: [],
          },
          {
            background: [],
          },
        ], // 字体颜色，字体背景颜色
        [
          {
            // 'font': []
            font: [
              "Microsoft-YaHei",
              "SimSun",
              "SimHei",
              "KaiTi",
              "FangSong",
              "Arial",
              "Times-New-Roman",
              "sans-serif",
            ],
          },
        ], //字体
        [
          {
            size: ["small", false, "large", "huge"],
          },
        ], // 字体大小
        [
          {
            align: [],
          },
        ], //对齐方式

        ["clean"], //清除字体样式
        ["image", "video"], //上传图片、上传视频
      ];
      var options = {
        debug: "error",
        modules: {
          syntax: true,
          // toolbar: toolbarOptions,
          toolbar: "#editor_toolbar",
          imageResize: {},
          imageDrop: true,
          FileDrop: true,
          counter: {
            container: "#counter",
            unit: "chiness",
          },
        },
        placeholder: "输入内容...",
        readOnly: false,
        theme: "snow",
      };
      // Add fonts to whitelist
      var Font = Quill.import("formats/font");
      // We do not add Aref Ruqaa since it is the default
      Font.whitelist = [
        "SimSun",
        "SimHei",
        "Microsoft-YaHei",
        "KaiTi",
        "FangSong",
        "Arial",
        "Times-New-Roman",
        "sans-serif",
      ];
      Quill.register(Font, true);

      let quill = new Quill(target, options);
      quill.on("text-change", function (delta, oldDelta, source) {
        if (source == "api") {
        } else if (source == "user") {
          app.view.editor_is_change = true;
        }
      });

      return quill;
    },
    save_file: function (is_show_notification, file) {
      let content = this.editor.getContents();
      for (let index = 0; index < this.datas.length; index++) {
        const data = this.datas[index];

        if (data.id == this.current_data.id) {
          this.datas[index].data = content;

          let datas = this.datas;
          let text = JSON.stringify(datas);

          file = file || this.current_file;

          fs.writeFileSync(file.path, text);

          this.editor_is_change = false;
          if (is_show_notification == true) {
            this.show_notification(
              `[已保存] ${file.name}->${this.current_data.name}`
            );
          }
          return;
        }
      }
    },
    new_data: function () {
      let id = this.random_str("data");
      let date = this.date_format("default", new Date());
      let data = {
        id: id,
        name: "新片段",
        created_date: date,
        updated_date: date,
        data: {
          ops: [
            {
              insert: "",
            },
          ],
        },
      };
      this.datas.push(data);

      this.show_notification(`[${data.name}] 已创建`);
      this.save_file();
    },
    switch_data: function (current_data, is_to_prev) {
      let index = this.datas.findIndex((data) => {
        return data.id == current_data.id;
      });
      if (is_to_prev == true) {
        index--;
      } else {
        index++;
      }
      if (index == this.datas.length) {
        index = 0;
      }
      if (index == -1) {
        index = this.datas.length - 1;
      }
      this.open_data(this.datas[index]);
    },
    delete_data: function (index) {
      if (index == undefined) {
        index = this.contextmenu_data_index;
      }
      if (window.confirm(`是否删除${this.datas[index].name}`)) {
        let data = this.datas.splice(index, 1)[0];
        this.save_file();
        this.show_notification(`[${data.name}] 已删除`);
      }
    },
    add_shortcut: function (target_el) {
      for (let index = 0; index < this.shortcut_key.length; index++) {
        const shortcut_key_obj = this.shortcut_key[index];

        let keys = shortcut_key_obj.key.split("+");
        let has = function (arr, str) {
          let result = arr.find((item) => {
            return item == str;
          });
          if (result != undefined) {
            return true;
          } else {
            return false;
          }
        };

        let use_ctrl = has(keys, "ctrl");
        let use_shift = has(keys, "shift");
        let use_alt = has(keys, "alt");
        let other_keys = shortcut_key_obj.key
          .replace(/(ctrl\+|shift\+|alt\+)/g, "")
          .split("+");

        console.log([use_ctrl, use_shift, use_alt, other_keys]);

        continue;
        // let other_keys = []
        el.addEventListener("keyup", (ev) => {
          if (use_ctrl && use_shift && use_alt) {
            if (ev.ctrlKey && ev.shiftKey && ev.altKey) {
              if (ev.key == other_keys[0]) {
              }
            }
          } else if (use_ctrl && use_shift) {
          } else if (use_ctrl && use_alt) {
          } else if (use_shift && use_alt) {
          } else if (use_ctrl) {
          } else if (use_shift) {
          } else if (use_alt) {
          }
        });
      }
    },
    add_shortcut_key: function (target_el) {
      let el = document.querySelector(target_el);
      el.addEventListener("keyup", (ev) => {
        if (ev.ctrlKey && ev.key == "s") {
          this.save_file(true);
        } else if (ev.key == "Escape") {
          this.hide_contextmenu();
          // } else if (ev.key == 'ContextMenu') {
          //     app.show_contextmenu()
        } else if (ev.ctrlKey && ev.key == "q") {
          this.is_show_side_bar = !this.is_show_side_bar;
        } else if (ev.ctrlKey && ev.key == "n") {
          this.new_data();
        } else if (ev.ctrlKey && ev.key == "g") {
          this.switch_data(this.current_data);
        } else if (ev.ctrlKey && ev.key == "t") {
          this.switch_data(this.current_data, true);
        }
      });
    },
    open_data: function (data) {
      // if (data.id == this.current_data.id) {
      //     return
      // }

      if (this.editor_is_change) {
        this.save_file();
      }

      this.editor.setContents(data.data);
      this.current_data = data;
    },
    handle_drap_over: function (ev) {
      ev.preventDefault();
    },
    handle_drap: function (ev) {
      var drap_type = ev.target.attributes.drap_type.nodeValue;
      var drap_index = ev.target.attributes.index.nodeValue;

      ev.dataTransfer.setData("drap_type", drap_type);
      ev.dataTransfer.setData("drap_index", drap_index);
    },
    handle_drop: function (ev) {
      var drap_type = ev.dataTransfer.getData("drap_type");
      var drop_type = ev.target.attributes.drop_type.nodeValue;
      var drap_index = ev.dataTransfer.getData("drap_index");
      var drop_index = ev.target.attributes.index.nodeValue;
      drap_index = parseInt(drap_index);
      drop_index = parseInt(drop_index);

      if (drap_type == drop_type) {
        let tool = this.datas.splice(drap_index, 1)[0];
        this.datas.splice(drop_index, 0, tool);

        this.save_file();
      }
    },
    random_str: function (str, len) {
      var timestamp = Date.parse(new Date());
      len = len || 6;
      var $chars =
        "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678"; /****默认去掉了容易混淆的字符LoOl,9gq,Vv,Uu,I1****/
      var maxPos = $chars.length;
      var pwd = "";
      for (let i = 0; i < len; i++) {
        pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
      }
      return str + "-" + timestamp + "-" + pwd;
    },
    date_format: function (fmt, date) {
      if (fmt == "default") {
        fmt = "YYYY-mm-dd HH:MM:SS";
      } else if (fmt == "backup_file") {
        fmt = "YYYY年mm月dd日-HH时MM分SS秒";
      }
      let ret;
      const opt = {
        "Y+": date.getFullYear().toString(), // 年
        "m+": (date.getMonth() + 1).toString(), // 月
        "d+": date.getDate().toString(), // 日
        "H+": date.getHours().toString(), // 时
        "M+": date.getMinutes().toString(), // 分
        "S+": date.getSeconds().toString(), // 秒
        // 有其他格式化字符需求可以继续添加，必须转化成字符串
      };
      for (let k in opt) {
        ret = new RegExp("(" + k + ")").exec(fmt);
        if (ret) {
          fmt = fmt.replace(
            ret[1],
            ret[1].length == 1 ? opt[k] : opt[k].padStart(ret[1].length, "0")
          );
        }
      }
      return fmt;
    },
    remove_class: function (selector, class_str, is_element) {
      let els = [];

      if (is_element) {
        els = selector;
      } else {
        els = document.querySelectorAll(selector);
      }

      for (let i = 0; i < els.length; i++) {
        const el = els[i];

        let class_list = el.className.split(" ");
        let result = "";
        for (let index = 0; index < class_list.length; index++) {
          const class_name = class_list[index];
          if (class_name !== class_str) {
            result += class_name + " ";
          }
        }
        el.className = result.trim();
      }
    },

    add_class: function (selector, class_str, is_element) {
      let els = [];

      if (is_element) {
        els = selector;
      } else {
        els = document.querySelectorAll(selector);
      }

      let result = "";

      for (let index = 0; index < els.length; index++) {
        const el = els[index];
        result = el.className + " " + class_str;
        el.className = result.replace(/[ ]+/g, " ");
        // el.className = result.replace(/[ ]+/g, ' ')
      }
    },
    /**
     * 显示右键菜单
     * @param {Object} event 右键点击事件
     * @param {String} selector 要显示的菜单的css选择器
     */
    show_contextmenu: function (event, index) {
      event.preventDefault();

      // this.datas.contextmenu_ev = event
      this.contextmenu_data_index = index;
      this.contextmenu_ev = event;

      let x = event.pageX;
      let y = event.pageY;

      // 如果鼠标指针的位置超过软件高度的一半的话，菜单就显示在指针上面
      let height = document.body.clientHeight;
      if (y > height / 2) {
        let my_div = document.getElementById("main_contextmenu");
        let h = window.getComputedStyle(my_div, null).height;
        if (h != "auto") {
          y = y - parseInt(h);
        }
      }

      this.style_contextmenu.display = "block";
      this.style_contextmenu.left = x + "px";
      this.style_contextmenu.top = y + "px";
    },
    hide_contextmenu: function () {
      this.style_contextmenu.display = "none";
    },
    rename: function (event, data_index) {
      if (event == undefined) {
        event = this.contextmenu_ev;
        data_index = this.contextmenu_data_index;
      }
      var element = event.target;
      // let data_index = element.getAttribute('index')
      var oldhtml = element.innerHTML;
      //如果已经双击过，内容已经存在input，不做任何操作
      if (oldhtml.indexOf('type="text"') > 0) {
        return;
      }
      //创建新的input元素
      var newobj = document.createElement("input");
      //为新增元素添加类型
      newobj.type = "text";
      newobj.className = "chmST_rename_input_box";

      //为新增元素添加value值
      newobj.value = oldhtml.trim();
      // newobj.value = oldhtml
      newobj.id = "temp_rename_input";

      //设置该标签的子节点为空
      // element.innerHTML = '';
      //添加该标签的子节点，input对象
      element.appendChild(newobj);
      //设置选择文本的内容或设置光标位置（两个参数：start,end；start为开始位置，end为结束位置；如果开始位置和结束位置相同则就是光标位置）
      newobj.setSelectionRange(0, oldhtml.length);
      //设置获得光标
      newobj.focus();

      newobj.onkeyup = function (event) {
        if (event.key == "Enter") {
          newobj.blur();
          // 被全局的快捷键覆盖了，以后再解决
        } else if (event.key == "Escape") {
          is_rename = false;
          newobj.blur();
        }
      };

      let is_rename = true;
      //为新增元素添加光标离开事件
      newobj.onblur = function () {
        //当触发时判断新增元素值是否为空，为空则不修改，并返回原有值
        if (
          this.value &&
          this.value.trim() !== "" &&
          is_rename &&
          this.value.trim() != oldhtml.trim()
        ) {
          app.view.datas[data_index].name = this.value;
          app.view.save_file();
          app.view.show_notification("重命名成功");

          if (this != undefined) {
            this.remove();
          }
        } else {
          if (this != undefined) {
            this.remove();
          }
        }
      };
    },
    show_notification: function (notification, display_time) {
      notification =
        notification.replace(
          /\[(.+?)\]/g,
          `<span style="color:#fff;font-weight:bold">$1</span>`
        ) || notification;

      let el = document.createElement("div");
      el.className = "notification";
      el.innerHTML = notification;

      let div = document.querySelector(".notification_container");
      div.appendChild(el);

      display_time = display_time || 1500;
      setTimeout(function () {
        el.remove();
      }, display_time);
    },
    export_txt: function () {
      let result = ipcRenderer.sendSync(
        tool_key,
        "export_txt",
        this.current_data
      );
      if (result.canceled != true) {
        let text = this.editor.getText();
        fs.writeFile(result.filePath, text, function (err) {
          if (err) {
            this.show_notification("[export_txt]" + err);
          } else {
            this.show_notification("导出txt成功");
          }
        });
      }
    },
    // 废弃
    open_file: function (file) {
      file = file || this.default_file;

      if (file.type == "file") {
        let text = fs.readFileSync(file.path).toString();
        this.datas = JSON.parse(text);

        this.open_data(this.datas[0]);

        this.app_name = file.name + "-" + configs.name;
        this.current_file = file;
        this.show_notification(`[已打开] ${file.name}`);
      }
    },

    app_command: function (command) {
      if (command == "win_always_on_top") {
        if (this.win_always_on_top) {
          this.show_notification("[置顶] 取消");
        } else {
          this.show_notification("[置顶] 窗口");
        }
        this.win_always_on_top = !this.win_always_on_top;
      } else if (command == "win_close") {
        this.save_file();
      }
      ipcRenderer.sendSync(tool_key, command);
    },
  },
});
