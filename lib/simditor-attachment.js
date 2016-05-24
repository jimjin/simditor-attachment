  (function(root, factory) {
    if ((typeof define === 'function') && define.amd) {
      define('simditor-attachment', ["jquery", 'simditor', 'simple-filedrop/lib/filedrop'], function($, Simditor, filedrop) {
        return (root['AttachmentButton'] = factory($, Simditor, filedrop));
      });
    } else if (typeof exports === 'object') {
      module.exports = factory(require("jquery"),require("simditor"));
    } else {
      root['AttachmentButton'] = factory(jQuery,Simditor);
    }
  }(this, function($, Simditor, filedrop) {
    var AttachmentButton;
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __hasProp = {}.hasOwnProperty,
    __slice = [].slice;

    AttachmentButton = (function(_super) {
      __extends(AttachmentButton, _super);

      function AttachmentButton() {
        return AttachmentButton.__super__.constructor.apply(this, arguments);
      }

      AttachmentButton.prototype.name = 'attachment';

      AttachmentButton.prototype.icon = 'paperclip';

      AttachmentButton.prototype.title = '上传附件';

      AttachmentButton.prototype._init = function() {
        AttachmentButton.__super__._init.call(this);
        if (this.editor.uploader == null) {
          throw new Error('simditor: attachment button depend on uploader.coffee');
        }
        return $.extend(this._tpl, {
          attachment: "<div class='attachment'>\n  <div class='thumb-wrap'>\n    <img src='<%= asset_path 'file_icons/file_extension_others.png' %>' class='file'/>\n  </div>\n  <span class='name'></span>\n  <span class='size'></span>\n  <div class='progress-bar'><div><span></span></div></div>\n  <span class='percent'>0%</span>\n  <a href='javascript:;' class='link-cancel' title='Cancel'>Cancel</a>\n</div>"
        });
      };

      AttachmentButton.prototype.render = function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        AttachmentButton.__super__.render.apply(this, args);
        this.attachmentList = this.editor.el.siblings('.simditor-attachments');
        if (this.attachmentList.length > 0) {
          this.editor.el.append(this.attachmentList);
        } else {
          this.attachmentList = $('<div class="simditor-attachments"></div>').appendTo(this.editor.el);
        }
        this.attachmentList.sortable({
          axis: 'y',
          item: '.attachment',
          cursor: 'move',
          helper: 'clone',
          tolerance: 'pointer',
          placeholder: 'attachment-placeholder',
          containment: 'parent'
        });
        this.attachmentList.on('click', '.link-cancel', (function(_this) {
          return function(e) {
            var attachmentEl, fileId, siblings;
            e.preventDefault();
            attachmentEl = $(e.currentTarget).parents('.attachment:first');
            siblings = attachmentEl.siblings('.attachment:visible');
            fileId = attachmentEl.attr('fileid');
            if (fileId && attachmentEl.hasClass('uploading')) {
              attachmentEl.hide().removeClass('uploading');
              _this.editor.uploader.cancel(fileId);
            } else {
              attachmentEl.hide().removeClass('uploading');
            }
            return _this.attachmentList.trigger('change');
          };
        })(this));
        this.attachmentList.on('change', (function(_this) {
          return function() {
            _this.attachmentList.sortable('refresh');
            if (_this.attachmentList.find('.attachment:visible').length > 1) {
              return _this.attachmentList.sortable('enable');
            } else {
              return _this.attachmentList.sortable('disable');
            }
          };
        })(this));
        return this._initUploader();
      };

      AttachmentButton.prototype._initUploader = function() {
        var createInput;
        createInput = (function(_this) {
          return function() {
            var $localFileItem;
            if (_this.input) {
              _this.input.remove();
            }
            _this.input = $('<input type="file" name="upload_file" tabIndex="-1" multiple="true" />');
            if (_this.menu) {
              $localFileItem = _this.menuEl.find('.menu-item-local-file');
              return _this.input.appendTo($localFileItem);
            } else {
              return _this.input.appendTo(_this.el);
            }
          };
        })(this);
        createInput();
        this.wrapper.on('click mousedown', 'input[type=file]', (function(_this) {
          return function(e) {
            return e.stopPropagation();
          };
        })(this));
        this.wrapper.on('change', 'input[type=file]', (function(_this) {
          return function(e) {
            _this.editor.uploader.upload(_this.input, {
              attachment: true
            });
            createInput();
            return _this.wrapper.removeClass('menu-on');
          };
        })(this));
        this.editor.uploader.on('beforeupload', (function(_this) {
          return function(e, file) {
            var attachEl, size;
            if (!file.attachment) {
              return;
            }
            if (file.size && file.size / 1048576 > 50) {
              simple.dialog.message({
                content: '抱歉，本地文件最大只支持 50M。',
                width: 420
              });
              return false;
            }
            attachEl = $(_this._tpl.attachment).attr({
              fileid: file.id
            }).appendTo(_this.attachmentList);
            _this.attachmentList.trigger('change');
            _this.editor.uploader.readImageFile(file.obj, function(img) {
              var imgPath, imgUrl;
              if (img) {
                return attachEl.find("img").attr({
                  src: img.src,
                  'data-image-src': img.src,
                  'data-image-size': img.width + "," + img.height,
                  'data-image-name': file.name
                }).css('cursor', 'pointer').removeClass('file');
              } else {
                imgPath = "<%= asset_path 'file_icons/' %>";
                imgUrl = imgPath + "file_extension_" + file.ext + ".png";
                img = new Image();
                img.onload = function() {
                  return attachEl.find("img").attr("src", img.src);
                };
                img.onerror = function() {
                  return attachEl.find("img").attr("src", imgPath + "file_extension_others.png");
                };
                return img.src = imgUrl;
              }
            });
            if (file.size >= 1048576) {
              size = (file.size / 1048576).toFixed(1) + "M";
            } else {
              size = (file.size / 1024).toFixed(0) + "K";
            }
            attachEl.addClass("uploading");
            attachEl.find(".name").text(file.name);
            attachEl.find(".size").text(size);
            return attachEl.find(".link-cancel").text("取消上传").attr("title", "取消上传");
          };
        })(this));
        this.editor.uploader.on('uploadprogress', (function(_this) {
          return function(e, file, loaded, total) {
            var attachEl, percent;
            if (!file.attachment) {
              return;
            }
            attachEl = _this.attachmentList.find(".attachment[fileid=" + file.id + "]");
            percent = loaded / total;
            if (percent > 0.99) {
              percent = "正在处理...";
            } else {
              percent = (percent * 100).toFixed(0) + "%";
            }
            attachEl.find(".progress-bar span").width(percent);
            return attachEl.find(".percent").text(percent);
          };
        })(this));
        this.editor.uploader.on('uploadsuccess', (function(_this) {
          return function(e, file, result) {
            var $img, attachEl, img;
            if (!file.attachment) {
              return;
            }
            attachEl = _this.attachmentList.find(".attachment[fileid=" + file.id + "]");
            attachEl.find(".progress-bar, .percent").remove();
            attachEl.removeClass("uploading").attr("attachid", result.attach).find(".link-cancel").text("移除附件").attr("title", "移除附件");
            $img = attachEl.find('img');
            if (!$img.hasClass('file')) {
              img = new Image();
              img.onload = function() {
                return $img.attr({
                  src: img.src + '&version=small',
                  'data-image-src': img.src,
                  'data-image-size': img.width + "," + img.height
                });
              };
              return img.src = result.file_path;
            }
          };
        })(this));
        this.editor.uploader.on('uploadcomplete', (function(_this) {
          return function(e, file, result) {
            if (!file.attachment) {
              return;
            }
            if (_this.attachmentList.find('.attachment.uploading').length < 1) {
              return _this.editor.uploader.trigger('uploadready', [file, result]);
            }
          };
        })(this));
        this.editor.uploader.on('uploaderror', (function(_this) {
          return function(e, file, xhr) {
            var msg, result;
            if (xhr.statusText === 'abort') {
              return;
            }
            _this.attachmentList.find(".attachment[fileid=" + file.id + "] .link-cancel").click();
            if (xhr.responseText) {
              try {
                result = $.parseJSON(xhr.responseText);
                msg = result.msg;
              } catch (_error) {
                e = _error;
                msg = '上传出错了';
              }
              if ((typeof simple !== "undefined" && simple !== null) && (simple.dialog.message != null)) {
                simple.dialog.message({
                  content: msg
                });
              } else {
                alert(msg);
              }
            }
            if (_this.attachmentList.find('.attachment.uploading').length < 1) {
              return _this.editor.uploader.trigger('uploadready', [file, result]);
            }
          };
        })(this));
        this.editor.on('destroy', (function(_this) {
          return function() {
            return _this.attachmentList.find('.link-cancel').click();
          };
        })(this));
        this.editor.el.data('droppable', 'true').attr('data-droppable', 'true');
        this.filedrop = filedrop({
          el: this.editor.el,
          hints: '拖拽到这里上传'
        }).on('drop', (function(_this) {
          return function(e, files) {
            if (files && files.length) {
              return _this.editor.uploader.upload($.makeArray(files), {
                attachment: true
              });
            }
          };
        })(this));
        return this.editor.on('destroy', (function(_this) {
          return function(e) {
            return _this.filedrop.destroy();
          };
        })(this));
      };

      AttachmentButton.prototype.status = function($node) {
        return true;
      };

      AttachmentButton.prototype.command = function(param) {};

      return AttachmentButton;

    })(Simditor.Button);
    Simditor.Toolbar.addButton(AttachmentButton);
    return AttachmentButton;
  }));
