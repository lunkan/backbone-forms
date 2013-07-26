;(function(Form) {

  /**
   * Repeater editor
   * 
   * An array editor. Creates a repeater of other editor items.
   *
   * Special options:
   * @param {String} [options.schema.itemType]          The editor type for each item in the repeater. Default: 'Text'
   * @param {String} [options.schema.confirmDelete]     Text to display in a delete confirmation dialog. If falsey, will not ask for confirmation.
   */
  Form.editors.Repeater = Form.editors.Base.extend({

	events: {
      'click [data-action="add"]': function(e) {
        e.preventDefault();
		if($(e.currentTarget).attr("data-target") != this.id)
			return;
			
        this.addItem(null, true);
      }
    },

    initialize: function(options) {
	  options = options || {};

      var editors = Form.editors;

      editors.Base.prototype.initialize.call(this, options);

      var schema = this.schema;
      if (!schema) throw "Missing required option 'schema'";

      this.template = options.template || this.constructor.template;

      //Determine the editor to use
      this.Editor = (function() {
        var type = schema.itemType;

		//Default to Text
        if (!type) return editors.Text;

        //Use Repeater-specific version if available
        //if (editors.Repeater[type]) return editors.Repeater[type];

        //Or whichever was passed
        return editors[type];
      })();

      this.items = [];
    },

    render: function() {
      var self = this,
          value = this.value || [];

      //Create main element
	  //Jonas add id to add butten
	  //alert("key: " + this.key + " # " + this.id);
	  var $el = $($.trim(this.template({repeaterId:this.id})));

      //Store a reference to the repeater (item container)
      this.$repeater = $el.is('[data-items]') ? $el : $el.find('[data-items]');

	  //Add existing items
      if (value.length) {
        _.each(value, function(itemValue) {
          self.addItem(itemValue);
        });
      }

      //If no existing items create an empty one, unless the editor specifies otherwise
      //J*
	  //else {
      //  if (!this.Editor.isAsync) this.addItem();
      //}

      this.setElement($el);
      this.$el.attr('id', this.id);
      this.$el.attr('name', this.key);
            
      if (this.hasFocus) this.trigger('blur', this);
      
      return this;
    },

    /**
     * Add a new item to the repeater
     * @param {Mixed} [value]           Value for the new item editor
     * @param {Boolean} [userInitiated] If the item was added by the user clicking 'add'
     */
    addItem: function(value, userInitiated) {
	
      var self = this,
          editors = Form.editors;
		
      //Create the item
      var item = new editors.Repeater.Item({
		repeater: this,
        form: this.form,
        schema: this.schema,
        value: value,
        Editor: this.Editor,
        key: this.key
      });
	  item.id = this.id + '-item-' + item.cid;
	  item.render();
      
      var _addItem = function() {
        self.items.push(item);
        self.$repeater.append(item.el);
        
        item.editor.on('all', function(event) {
          if (event === 'change') return;

          // args = ["key:change", itemEditor, fieldEditor]
          var args = _.toArray(arguments);
          args[0] = 'item:' + event;
          args.splice(1, 0, self);
          // args = ["item:key:change", this=repeaterEditor, itemEditor, fieldEditor]

          editors.Repeater.prototype.trigger.apply(this, args);
        }, self);

        item.editor.on('change', function() {
          if (!item.addEventTriggered) {
            item.addEventTriggered = true;
            this.trigger('add', this, item.editor);
          }
          this.trigger('item:change', this, item.editor);
          this.trigger('change', this);
        }, self);

        item.editor.on('focus', function() {
          if (this.hasFocus) return;
          this.trigger('focus', this);
        }, self);
        item.editor.on('blur', function() {
          if (!this.hasFocus) return;
          var self = this;
          setTimeout(function() {
            if (_.find(self.items, function(item) { return item.editor.hasFocus; })) return;
            self.trigger('blur', self);
          }, 0);
        }, self);
        
        if (userInitiated || value) {
          item.addEventTriggered = true;
        }
        
        if (userInitiated) {
          self.trigger('add', self, item.editor);
          self.trigger('change', self);
        }
      };

      //Check if we need to wait for the item to complete before adding to the repeater
      if (this.Editor.isAsync) {
        item.editor.on('readyToAdd', _addItem, this);
      }

      //Most editors can be added automatically
      else {
        _addItem();
        item.editor.focus();
      }
      
      return item;
    },

    /**
     * Remove an item from the repeater
     * @param {Repeater.Item} item
     */
    removeItem: function(item) {
		
	  //Confirm delete
      var confirmMsg = this.schema.confirmDelete;
      if (confirmMsg && !confirm(confirmMsg)) return;

      var index = _.indexOf(this.items, item);

      this.items[index].remove();
      this.items.splice(index, 1);
      
      if (item.addEventTriggered) {
        this.trigger('remove', this, item.editor);
        this.trigger('change', this);
      }

	  //Why do I need this?
      //if (!this.items.length && !this.Editor.isAsync) this.addItem();
    },

    getValue: function() {
      var values = _.map(this.items, function(item) {
        return item.getValue();
      });

      //Filter empty items
      return _.without(values, undefined, '');
    },

    setValue: function(value) {
      this.value = value;
      this.render();
    },
    
    focus: function() {
      if (this.hasFocus) return;

      if (this.items[0]) this.items[0].editor.focus();
    },
    
    blur: function() {
      if (!this.hasFocus) return;

      var focusedItem = _.find(this.items, function(item) { return item.editor.hasFocus; });
      
      if (focusedItem) focusedItem.editor.blur();
    },

    /**
     * Override default remove function in order to remove item views
     */
    remove: function() {
      _.invoke(this.items, 'remove');
      Form.editors.Base.prototype.remove.call(this);
    },
    
    /**
     * Run validation
     * 
     * @return {Object|Null}
     */
    validate: function() {
	
	 //j*
	 //removed fields may be undefined
	 //if (!this.validators) return null;
	  
      //Collect errors
      var errors = _.map(this.items, function(item) {
		//alert("item " + JSON.stringify(item.value) + " " + item.validate());
        return item.validate();
      });

	  //Don't bother about error messages (maybe with max/min rows)
	  return null;
	  
      //Check if any item has errors
     /* var hasErrors = _.compact(errors).length ? true : false;
      
	  if (!hasErrors) return null;
	  
      //If so create a shared error
      var fieldError = {
        type: 'repeater',
        message: 'Some of the items in the repeater failed validation',
        errors: errors
      };

      return fieldError;*/
    }
  }, {

    //STATICS
    template: _.template('\
      <div class="repeater-wrapper">\
        <div data-items></div>\
        <button data-target="<%= repeaterId %>" type="button" data-action="add">Add</button>\
      </div>\
    ', null, Form.templateSettings)

  });


  /**
   * A single item in the repeater
   *
   * @param {editors.Repeater} options.repeater The Repeater editor instance this item belongs to
   * @param {Function} options.Editor   Editor constructor function
   * @param {String} options.key        Model key
   * @param {Mixed} options.value       Value
   * @param {Object} options.schema     Field schema
   */
  Form.editors.Repeater.Item = Form.editors.Base.extend({

    events: {
      'click [data-action="remove"]': function(event) {
        event.preventDefault();
        this.repeater.removeItem(this);
      }
	  /*,
      'keydown input[type=text]': function(event) {
        if(event.keyCode !== 13) return;
        event.preventDefault();
        this.repeater.addItem();
        this.repeater.$repeater.find("> li:last input").focus();
      }*/
    },

    initialize: function(options) {
	  this.id = options.id;
	  this.repeater = options.repeater;
      this.schema = options.schema || this.repeater.schema;
      this.value = options.value;
      this.Editor = options.Editor || Form.editors.Text;
      this.key = options.key;
      this.template = options.template || this.schema.itemTemplate || this.constructor.template;
      this.errorClassName = options.errorClassName || this.constructor.errorClassName;
      this.form = options.form;
    },

    render: function() {
	
	
      //Create editor
      this.editor = new this.Editor({
		id: this.id,
        key: this.key,
        schema: this.schema,
        value: this.value,
        repeater: this.repeater,
        item: this,
        form: this.form
      });
	  
	  this.editor.render();

      //Create main element
      var $el = $($.trim(this.template()));

      $el.find('[data-editor]').append(this.editor.el);

      //Replace the entire element so there isn't a wrapper tag
      this.setElement($el);
        
      return this;
    },

    getValue: function() {
      return this.editor.getValue();
    },

    setValue: function(value) {
      this.editor.setValue(value);
    },
    
    focus: function() {
      this.editor.focus();
    },
    
    blur: function() {
      this.editor.blur();
    },

    remove: function() {
      this.editor.remove();
      Backbone.View.prototype.remove.call(this);
    },

    validate: function() {
	
	  /*var value = this.getValue(),
          formValues = this.repeater.form ? this.repeater.form.getValue() : {},
          validators = this.schema.validators,
          getValidator = this.getValidator;

	  //j*
	  alert("item validate " + this.editor.validate());
      if (!validators) return null;*/

      //Run through validators until an error is found
      /*var error = null;
      _.every(validators, function(validator) {
		
		error = getValidator(validator)(value, formValues);
		//alert("##validator " + error + " - " + getValidator(validator) + " # " + validator);
		
		//alert("is error " + error + " " + value);
		return true;
        //return error ? false : true;
      });*/

	  error = this.editor.validate();
	  
      //Show/hide error
      if (error){
        this.setError(error);
      } else {
        this.clearError();
      }

      //Return error to be aggregated by repeater
	  return error ? error : null;
    },

    /**
     * Show a validation error
     */
    setError: function(err) {
	
	  //Nested form editors (e.g. Object) set their errors internally
      if (this.editor.hasNestedForm) return;

      //Add error CSS class
      this.$el.addClass(this.errorClassName);

      //Set error message
      this.$('[data-error]').html(err.message);	
	
      //this.$el.addClass(this.errorClassName);
      //this.$el.attr('title', err.message);
    },

    /**
     * Hide validation errors
     */
	clearError: function() {
	
	  //Nested form editors (e.g. Object) set their errors internally
      if (this.editor.hasNestedForm) return;
	  
      //Remove error CSS class
	  this.$el.removeClass(this.errorClassName);

      //Clear error message
	  this.$('[data-error]').empty();
	}
  
    /*clearError: function() {
      this.$el.removeClass(this.errorClassName);
      this.$el.attr('title', null);
    }*/
  }, {

    //STATICS
    template: _.template('\
      <div>\
        <div data-editor></div>\
        <button type="button" data-action="remove">&times;</button>\
      </div>\
    ', null, Form.templateSettings),

    errorClassName: 'error'

  });

/**
   * Base modal object editor for use with the Repeater editor; used by Object 
   * and NestedModal repeater types
   */
  Form.editors.Repeater.Table = Form.editors.Base.extend({

    events: {
      'click': 'openEditor'
    },

    /**
     * @param {Object} options
     * @param {Form} options.form                       The main form
     * @param {Function} [options.schema.itemToString]  Function to transform the value for display in the repeater.
     * @param {String} [options.schema.itemType]        Editor type e.g. 'Text', 'Object'.
     * @param {Object} [options.schema.subSchema]       Schema for nested form,. Required when itemType is 'Object'
     * @param {Function} [options.schema.model]         Model constructor function. Required when itemType is 'NestedModel'
     */
    initialize: function(options) {
      options = options || {};
      
      Form.editors.Base.prototype.initialize.call(this, options);

      this.form = options.form;
      if (!options.form) throw 'Missing required option: "form"';

      //Template
      this.template = options.template || this.constructor.template;
	  
	  alert("Repeater table template: " + JSON.stringify(this.template));
    },

    /**
     * Render the repeater item representation
     */
    render: function() {
      var self = this;

      //New items in the repeater are only rendered when the editor has been OK'd
      if (_.isEmpty(this.value)) {
        this.renderEditor();
      }

      //But items with values are added automatically
      else {
        this.renderSummary();

        setTimeout(function() {
          self.trigger('readyToAdd');
        }, 0);
      }

      if (this.hasFocus) this.trigger('blur', this);

      return this;
    },

    /**
     * Renders the repeater item representation
     */
    renderSummary: function() {
      this.$el.html($.trim(this.template({
        summary: this.getStringValue()
      })));
    },

    /**
     * Function which returns a generic string representation of an object
     *
     * @param {Object} value
     * 
     * @return {String}
     */
    itemToString: function(value) {
      var createTitle = function(key) {
        var context = { key: key };

        return Form.Field.prototype.createTitle.call(context);
      };

      value = value || {};

      //Pretty print the object keys and values
      var parts = [];
      _.each(this.nestedSchema, function(schema, key) {
        var desc = schema.title ? schema.title : createTitle(key),
            val = value[key];

        if (_.isUndefined(val) || _.isNull(val)) val = '';

        parts.push(desc + ': ' + val);
      });

      return parts.join('<br />');
    },

    /**
     * Returns the string representation of the object value
     */
    getStringValue: function() {
      var schema = this.schema,
          value = this.getValue();

      if (_.isEmpty(value)) return '[Empty]';

      //If there's a specified toString use that
      if (schema.itemToString) return schema.itemToString(value);
      
      //Otherwise use the generic method or custom overridden method
      return this.itemToString(value);
    },

	renderEditor: function() {
	
	  var self = this,
          RepeaterForm = this.form.constructor;

      var form = this.repeaterForm = new RepeaterForm({
        schema: this.nestedSchema,
        data: this.value
      });

      /*var modal = this.modal = new Form.editors.Repeater.Modal.ModalAdapter({
        content: form,
        animate: true
      });

      modal.open();

      this.trigger('open', this);
      this.trigger('focus', this);

      modal.on('cancel', this.onModalClosed, this);
      
      modal.on('ok', _.bind(this.onModalSubmitted, this));*/
	  
	  alert("Repeater table schema: " + JSON.stringify(form.schema));
	  
    },
	
    openEditor: function() {
      var self = this,
          ModalForm = this.form.constructor;

      var form = this.modalForm = new ModalForm({
        schema: this.nestedSchema,
        data: this.value
      });

      var modal = this.modal = new Form.editors.Repeater.Modal.ModalAdapter({
        content: form,
        animate: true
      });

      modal.open();

      this.trigger('open', this);
      this.trigger('focus', this);

      modal.on('cancel', this.onModalClosed, this);
      
      modal.on('ok', _.bind(this.onModalSubmitted, this));
    },

    /**
     * Called when the user clicks 'OK'.
     * Runs validation and tells the repeater when ready to add the item
     */
    onModalSubmitted: function() {
      var modal = this.modal,
          form = this.modalForm,
          isNew = !this.value;

      //Stop if there are validation errors
      var error = form.validate();
      if (error) return modal.preventClose();

      //Store form value
      this.value = form.getValue();

      //Render item
      this.renderSummary();

      if (isNew) this.trigger('readyToAdd');
      
      this.trigger('change', this);

      this.onModalClosed();
    },

    /**
     * Cleans up references, triggers events. To be called whenever the modal closes
     */
    onModalClosed: function() {
      this.modal = null;
      this.modalForm = null;

      this.trigger('close', this);
      this.trigger('blur', this);
    },

    getValue: function() {
      return this.value;
    },

    setValue: function(value) {
      this.value = value;
    },
    
    focus: function() {
      if (this.hasFocus) return;

      this.openEditor();
    },
    
    blur: function() {
      if (!this.hasFocus) return;
      
      if (this.modal) {
        this.modal.trigger('cancel');
      }
    }
  }, {
    //STATICS
    template: _.template('\
      <div><%= summary %></div>\
    ', null, Form.templateSettings),

    //The modal adapter that creates and manages the modal dialog.
    //Defaults to BootstrapModal (http://github.com/powmedia/backbone.bootstrap-modal)
    //Can be replaced with another adapter that implements the same interface.
    ModalAdapter: Backbone.BootstrapModal,
    
    //Make the wait repeater for the 'ready' event before adding the item to the repeater
    isAsync: true
  });
  
  /**
   * Base modal object editor for use with the Repeater editor; used by Object 
   * and NestedModal repeater types
   */
  Form.editors.Repeater.Modal = Form.editors.Base.extend({

    events: {
      'click': 'openEditor'
    },

    /**
     * @param {Object} options
     * @param {Form} options.form                       The main form
     * @param {Function} [options.schema.itemToString]  Function to transform the value for display in the repeater.
     * @param {String} [options.schema.itemType]        Editor type e.g. 'Text', 'Object'.
     * @param {Object} [options.schema.subSchema]       Schema for nested form,. Required when itemType is 'Object'
     * @param {Function} [options.schema.model]         Model constructor function. Required when itemType is 'NestedModel'
     */
    initialize: function(options) {
      options = options || {};
      
      Form.editors.Base.prototype.initialize.call(this, options);
      
	  alert("required");
	  
      //Dependencies
      if (!Form.editors.Repeater.Modal.ModalAdapter) throw 'A ModalAdapter is required';

      this.form = options.form;
      if (!options.form) throw 'Missing required option: "form"';

      //Template
      this.template = options.template || this.constructor.template;
    },

    /**
     * Render the repeater item representation
     */
    render: function() {
      var self = this;

      //New items in the repeater are only rendered when the editor has been OK'd
      if (_.isEmpty(this.value)) {
        this.openEditor();
      }

      //But items with values are added automatically
      else {
        this.renderSummary();

        setTimeout(function() {
          self.trigger('readyToAdd');
        }, 0);
      }

      if (this.hasFocus) this.trigger('blur', this);

      return this;
    },

    /**
     * Renders the repeater item representation
     */
    renderSummary: function() {
      this.$el.html($.trim(this.template({
        summary: this.getStringValue()
      })));
    },

    /**
     * Function which returns a generic string representation of an object
     *
     * @param {Object} value
     * 
     * @return {String}
     */
    itemToString: function(value) {
      var createTitle = function(key) {
        var context = { key: key };

        return Form.Field.prototype.createTitle.call(context);
      };

      value = value || {};

      //Pretty print the object keys and values
      var parts = [];
      _.each(this.nestedSchema, function(schema, key) {
        var desc = schema.title ? schema.title : createTitle(key),
            val = value[key];

        if (_.isUndefined(val) || _.isNull(val)) val = '';

        parts.push(desc + ': ' + val);
      });

      return parts.join('<br />');
    },

    /**
     * Returns the string representation of the object value
     */
    getStringValue: function() {
      var schema = this.schema,
          value = this.getValue();

      if (_.isEmpty(value)) return '[Empty]';

      //If there's a specified toString use that
      if (schema.itemToString) return schema.itemToString(value);
      
      //Otherwise use the generic method or custom overridden method
      return this.itemToString(value);
    },

    openEditor: function() {
      var self = this,
          ModalForm = this.form.constructor;

      var form = this.modalForm = new ModalForm({
        schema: this.nestedSchema,
        data: this.value
      });

      var modal = this.modal = new Form.editors.Repeater.Modal.ModalAdapter({
        content: form,
        animate: true
      });

      modal.open();

      this.trigger('open', this);
      this.trigger('focus', this);

      modal.on('cancel', this.onModalClosed, this);
      
      modal.on('ok', _.bind(this.onModalSubmitted, this));
    },

    /**
     * Called when the user clicks 'OK'.
     * Runs validation and tells the repeater when ready to add the item
     */
    onModalSubmitted: function() {
      var modal = this.modal,
          form = this.modalForm,
          isNew = !this.value;

      //Stop if there are validation errors
      var error = form.validate();
      if (error) return modal.preventClose();

      //Store form value
      this.value = form.getValue();

      //Render item
      this.renderSummary();

      if (isNew) this.trigger('readyToAdd');
      
      this.trigger('change', this);

      this.onModalClosed();
    },

    /**
     * Cleans up references, triggers events. To be called whenever the modal closes
     */
    onModalClosed: function() {
      this.modal = null;
      this.modalForm = null;

      this.trigger('close', this);
      this.trigger('blur', this);
    },

    getValue: function() {
      return this.value;
    },

    setValue: function(value) {
      this.value = value;
    },
    
    focus: function() {
      if (this.hasFocus) return;

      this.openEditor();
    },
    
    blur: function() {
      if (!this.hasFocus) return;
      
      if (this.modal) {
        this.modal.trigger('cancel');
      }
    }
  }, {
    //STATICS
    template: _.template('\
      <div><%= summary %></div>\
    ', null, Form.templateSettings),

    //The modal adapter that creates and manages the modal dialog.
    //Defaults to BootstrapModal (http://github.com/powmedia/backbone.bootstrap-modal)
    //Can be replaced with another adapter that implements the same interface.
    ModalAdapter: Backbone.BootstrapModal,
    
    //Make the wait repeater for the 'ready' event before adding the item to the repeater
    isAsync: true
  });


  /*Form.editors.Repeater.Object = Form.editors.Repeater.Modal.extend({
    initialize: function () {
      Form.editors.Repeater.Modal.prototype.initialize.apply(this, arguments);

      var schema = this.schema;

      if (!schema.subSchema) throw 'Missing required option "schema.subSchema"';

      this.nestedSchema = schema.subSchema;
    }
  });*/
  
  Form.editors.Repeater.Object = Form.editors.Repeater.Table.extend({
    initialize: function () {
      Form.editors.Repeater.Table.prototype.initialize.apply(this, arguments);

      var schema = this.schema;

      if (!schema.subSchema) throw 'Missing required option "schema.subSchema"';

      this.nestedSchema = schema.subSchema;
    }
  });

  Form.editors.Repeater.NestedModel = Form.editors.Repeater.Table.extend({
    initialize: function() {
      Form.editors.Repeater.Table.prototype.initialize.apply(this, arguments);

      var schema = this.schema;

      if (!schema.model) throw 'Missing required option "schema.model"';

      var nestedSchema = schema.model.prototype.schema;

      this.nestedSchema = (_.isFunction(nestedSchema)) ? nestedSchema() : nestedSchema;
    },

    /**
     * Returns the string representation of the object value
     */
    getStringValue: function() {
      var schema = this.schema,
          value = this.getValue();

      if (_.isEmpty(value)) return null;

      //If there's a specified toString use that
      if (schema.itemToString) return schema.itemToString(value);
      
      //Otherwise use the model
      return new (schema.model)(value).toString();
    }
  });

  /*Form.editors.Repeater.NestedModel = Form.editors.Repeater.Modal.extend({
    initialize: function() {
      Form.editors.Repeater.Modal.prototype.initialize.apply(this, arguments);

      var schema = this.schema;

      if (!schema.model) throw 'Missing required option "schema.model"';

      var nestedSchema = schema.model.prototype.schema;

      this.nestedSchema = (_.isFunction(nestedSchema)) ? nestedSchema() : nestedSchema;
    },

    //
     // Returns the string representation of the object value
     //
    getStringValue: function() {
      var schema = this.schema,
          value = this.getValue();

      if (_.isEmpty(value)) return null;

      //If there's a specified toString use that
      if (schema.itemToString) return schema.itemToString(value);
      
      //Otherwise use the model
      return new (schema.model)(value).toString();
    }
  });*/

})(Backbone.Form);
