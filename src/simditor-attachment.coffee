((factory)->
  if (typeof define is 'function') and define.amd
    define ['simditor', 'simditor-attachment'], factory
  else
    factory window.Simditor, window.attachment
)(($, Simditor)->

class AttachmentButton extends Simditor.Button

  name: 'attachment'

  icon: 'paperclip'

  title: '上传附件'

  _init: () ->
    super()

    unless @editor.uploader?
      throw new Error('simditor: attachment button depend on uploader.coffee')

    $.extend(@_tpl, {
      attachment: """
        <div class='attachment'>
          <div class='thumb-wrap'>
            <img src='<%= asset_path 'file_icons/file_extension_others.png' %>' class='file'/>
          </div>
          <span class='name'></span>
          <span class='size'></span>
          <div class='progress-bar'><div><span></span></div></div>
          <span class='percent'>0%</span>
          <a href='javascript:;' class='link-cancel' title='Cancel'>Cancel</a>
        </div>
      """
    })

  render: (args...) ->
    super(args...)

    @attachmentList = @editor.el.siblings('.simditor-attachments')
    if @attachmentList.length > 0
      @editor.el.append @attachmentList
    else
      @attachmentList = $('<div class="simditor-attachments"></div>')
        .appendTo(@editor.el)

    @attachmentList.sortable
      axis: 'y'
      item: '.attachment'
      cursor: 'move'
      helper: 'clone'
      tolerance: 'pointer'
      placeholder: 'attachment-placeholder'
      containment: 'parent'

    @attachmentList.on 'click', '.link-cancel', (e) =>
      e.preventDefault()
      attachmentEl = $(e.currentTarget).parents('.attachment:first')
      siblings = attachmentEl.siblings('.attachment:visible')
      fileId = attachmentEl.attr('fileid')

      if fileId && attachmentEl.hasClass('uploading')
        attachmentEl.hide().removeClass('uploading')
        @editor.uploader.cancel(fileId)
      else
        attachmentEl.hide().removeClass('uploading')

      @attachmentList.trigger('change')

    @attachmentList.on 'change', =>
      @attachmentList.sortable('refresh')
      if @attachmentList.find('.attachment:visible').length > 1
        @attachmentList.sortable('enable')
      else
        @attachmentList.sortable('disable')

    @_initUploader()

  _initUploader: ->
    createInput = =>
      @input.remove() if @input
      @input = $('<input type="file" name="upload_file" tabIndex="-1" multiple="true" />')

      if @menu
        $localFileItem = @menuEl.find('.menu-item-local-file')
        @input.appendTo($localFileItem)
      else
        @input.appendTo(@el)

    createInput()

    @wrapper.on 'click mousedown', 'input[type=file]', (e) =>
      e.stopPropagation()

    @wrapper.on 'change', 'input[type=file]', (e) =>
      @editor.uploader.upload(@input, {
        attachment: true
      })
      createInput()
      @wrapper.removeClass('menu-on')

    @editor.uploader.on 'beforeupload', (e, file) =>
      return unless file.attachment

      # validate file size: < 50M
      if file.size && file.size/1048576 > 50
        simple.dialog.message({
          content: '抱歉，本地文件最大只支持 50M。',
          width: 420
        })
        return false

      attachEl = $(@_tpl.attachment).attr({
        fileid: file.id
      }).appendTo(@attachmentList)

      @attachmentList.trigger('change')

      @editor.uploader.readImageFile file.obj, (img) =>
        if img
          attachEl.find("img").attr
            src: img.src
            'data-image-src': img.src
            'data-image-size': img.width + "," + img.height
            'data-image-name': file.name
          .css('cursor', 'pointer')
          .removeClass 'file'

        else
          imgPath = "<%= asset_path 'file_icons/' %>"
          imgUrl = imgPath + "file_extension_" + file.ext + ".png"

          img = new Image()
          img.onload = ->
            attachEl.find("img").attr("src", img.src)
          img.onerror = ->
            attachEl.find("img").attr("src", imgPath + "file_extension_others.png")
          img.src = imgUrl

      if file.size >= 1048576
        size = (file.size / 1048576).toFixed(1) + "M"
      else
        size = (file.size / 1024).toFixed(0) + "K"

      attachEl.addClass("uploading")
      attachEl.find(".name").text(file.name)
      attachEl.find(".size").text(size)
      attachEl.find(".link-cancel")
        .text("取消上传")
        .attr("title", "取消上传")

    @editor.uploader.on 'uploadprogress', (e, file, loaded, total) =>
      return unless file.attachment

      attachEl = @attachmentList.find(".attachment[fileid=#{file.id}]")
      percent = loaded / total

      if percent > 0.99
        percent = "正在处理...";
      else
        percent = (percent * 100).toFixed(0) + "%"

      attachEl.find(".progress-bar span").width(percent)
      attachEl.find(".percent").text(percent)

    @editor.uploader.on 'uploadsuccess', (e, file, result) =>
      return unless file.attachment

      attachEl = @attachmentList.find(".attachment[fileid=#{file.id}]")
      attachEl.find(".progress-bar, .percent").remove()
      attachEl.removeClass("uploading")
        .attr("attachid", result.attach)
        .find(".link-cancel")
        .text("移除附件")
        .attr("title", "移除附件")

      $img = attachEl.find('img')
      unless $img.hasClass 'file'
        img = new Image()
        img.onload = =>
          $img.attr
            src: img.src + '&version=small'
            'data-image-src': img.src
            'data-image-size': img.width + "," + img.height
        img.src = result.file_path

    @editor.uploader.on 'uploadcomplete', (e, file, result) =>
      return unless file.attachment

      if @attachmentList.find('.attachment.uploading').length < 1
        @editor.uploader.trigger('uploadready', [file, result])

    @editor.uploader.on 'uploaderror', (e, file, xhr) =>
      return if xhr.statusText == 'abort'

      @attachmentList.find(".attachment[fileid=#{file.id}] .link-cancel").click()

      if xhr.responseText
        try
          result = $.parseJSON xhr.responseText
          msg = result.msg
        catch e
          msg = '上传出错了'

        if simple? and simple.dialog.message?
          simple.dialog.message
            content: msg
        else
          alert msg

      if @attachmentList.find('.attachment.uploading').length < 1
        @editor.uploader.trigger('uploadready', [file, result])


    @editor.on 'destroy', =>
      @attachmentList.find('.link-cancel').click()

    @editor.el
      .data('droppable', 'true')
      .attr('data-droppable', 'true')

    @filedrop = simple.filedrop
      el: @editor.el
      hints: '拖拽到这里上传'
    .on 'drop', (e, files) =>
      if files && files.length
        @editor.uploader.upload($.makeArray(files), {
            attachment: true
        })

    @editor.on 'destroy', (e) =>
      @filedrop.destroy()

  status: ($node) ->
    true

  command: (param) ->


Simditor.Toolbar.addButton(AttachmentButton)

)
