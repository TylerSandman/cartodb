
/**
 *  LNG pane
 *
 *  Pane for adding internal LNG data layer.
 *  Provides options for filtering based on criteria
 *  like status, location, etc
 *
 *  new cdb.admin.LNGPane(opts);
 *
*/

cdb.admin.LNGPane = cdb.admin.ImportPane.extend({

  events: {
    'submit form':              "submitUpload",
    'click .common_data a':     "_onCommonDataClick"  
  },

  _UPLOADER: {
    url:              '',
    acceptSync:       false,
    resolution:       ""
  },

  _TEXTS: {
    connectionError:      "Sorry, there was a problem with the upload, try again please.",
  },

  initialize: function() {
    cdb.admin.ImportPane.prototype.initialize.call(this);

    _.bindAll(this, "submitUpload", "_onUploadError", "_onUploadSubmit");
    this.template = this.options.template || cdb.templates.getTemplate('old_common/views/import/lng');

    this.model.on('change:value change:interval', this._onValueChange, this);
    this.render();
  },

  loadData(){
    this.model.set({
      type: 'url',
      value: 'http://tyler.oven.dnj1.bcpc.bloomberg.com/bas/lng',
      valid: true
    });
  },

  render: function() {
    var $content = $('<div>');
    $content.append(this.template());
    var self = this;
    
    // Setup your file importer options
    // and messages
    _.each(this.options, function(val,i) {
      if (self._TEXTS[i] !== undefined)     self._TEXTS[i] = val
      if (self._UPLOADER[i] !== undefined)  self._UPLOADER[i] = val
    });

    // Init uploader
    this._initUploader($content);

    // Init import info (sync, error, user report, ... etc)
    this._initImportInfo($content);

    this.$el.append($content);

    return this;
  },

  _initUploader: function($content) {
    var $upload = this.$upload = $content.find("form");
    $upload.fileupload({
      url:                    this._UPLOADER.url,
      paramName:              'filename',
      progressInterval:       100,
      bitrateInterval:        500,
      autoUpload:             false,
      add:                    this._onUploadAdd,
      submit:                 this._onUploadSubmit,
      fail:                   this._onUploadError
    });   
  },

  _initImportInfo: function($content) {
    // It will show errors, sync, user,... etc
    this.import_info = new cdb.admin.ImportInfo({
      el:         $content.find('div.infobox'),
      model:      this.model,
    });

    this.addView(this.import_info);
  },


  //////////////////////////
  //          UI          //
  //////////////////////////

  // Trick to catch mixpanel event
  _onCommonDataClick: function(e) {
    this.killEvent(e);
    cdb.god.trigger('mixpanel', 'Common data clicked');
    window.location = cdb.config.prefixUrl() + $(e.target).attr('href');
  },

  // When value model property changes
  _onValueChange: function() {
    if (this.model.get('type') == "file") return;

    this[this.model.get('value') == "" ? '_showUploader' : '_hideUploader' ]();
    this.trigger('valueChange', this.model.get('value'), this);
  },

  // Show or hide uploader
  _showUploader: function(msg) {
    this.$('div.holder').fadeIn()
  },
  _hideUploader: function() {
    this.$('div.holder').fadeOut('fast')
  },

  cleanInput: function() {
    this.$("input.url-input").val('');
  },


  //////////////////////////
  //      UPLOADER        //
  //////////////////////////

  _setValidFileExtensions: function(list) {
    return RegExp("(\.|\/)(" + list.join('|') + ")$", "i");
  },

  // When url input is fill and done
  submitUpload: function(e) {
    if (e) this.killEvent(e);

    var url = this.getURL();

    // Check url
    if (cdb.Utils.isURL(url)) {
      this._send();
    } else {
      this.import_info.activeTab('error', this._TEXTS.urlError);
    }
  },

  // If an upload fails
  _onUploadError: function(e,data) {
    var error = data.files[0].error || data.errorThrown;
    var filename = data.files[0].name;
    var msg = this._TEXTS[error + "Error"]
                .replace("{filename}", filename)

    this.import_info.activeTab('error', msg);
  },

  _onUploadAdd: function(e,data) {
    data.submit();
  },

  _onUploadSubmit: function(e,data) {
    if (this.$upload.data('fileupload')._validate(data.files)) {
      // Set new values
      this.model.set({
        type:     'file',
        value:    data.files[0],
        interval: 0, // NEVER
        valid:    true
      });
      // Trigger changes
      this._send();
      return false;
    }
  },


  //////////////
  //   HELP   //
  //////////////
  getURL: function() {
    return this.$("input.url-input").val();
  },

  setValue: function(d) {
    if (d.type === "file") {
      this.$upload.fileupload('add', { files: [ d.value ] });
    } else {
      this.model.set(d, { silent: true });
      this._send();
    }
  },


  //////////////
  //   VIEW   //
  //////////////

  // Trigger model
  _send: function() {
    this.trigger('fileChosen', this.model.toJSON());
  },

  clean: function() {
    // Destroy fileupload
    this.$upload.fileupload("destroy");
    this.$upload.unbind("mouseleave");

    cdb.admin.ImportPane.prototype.clean.call(this);
  }
});
