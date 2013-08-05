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
      var self = this
    	
	  options = options || {};

      var editors = Form.editors;

    //Override defaults
      /*var constructor = this.constructor;
      this.template = options.template || constructor.template;
      this.Fieldset = options.Fieldset || constructor.Fieldset;
      this.Field = options.Field || constructor.Field;
      this.NestedField = options.NestedField || constructor.NestedField;*/
      //alert("tmp: " + options.template + " s: " + JSON.stringify(this.form.template));
      
      editors.Base.prototype.initialize.call(this, options);
      var schema = this.schema;
      if (!schema) throw "Missing required option 'schema'";
      
      this.caption = this.createTitle(this.schema.title);
      this.headers = this.createHeaders();
      this.addLabel = "Add " + this.createTitle(this.schema.title);
      
      //Set display layout - default to 'horizontal'
      this.schema.layout = this.schema.layout || 'horizontal';
      if(this.schema.layout == 'vertical') {
    	  this.template = options.template || this.constructor.verticalTemplate;
      } else {
    	  this.template = options.template || this.constructor.template;
      }

      this.items = [];
    },

    createTitle: function(str) {
	  if(str) {
        str = str.replace(/([A-Z])/g, ' $1');
        str = str.replace(/^./, function(str) { return str.toUpperCase(); });
        return str;
      } else {
    	  return "No title";
      }
    },
    
    createHeaders: function() {
    	
  	  var self = this;
  	  var headers = [];
  	  var schemaHeaders = this.schema.headers || {};

  	  if(this.schema.subSchema) {
  		_.each(this.schema.subSchema, function(value, key) {
  			var headerText = schemaHeaders[key] || self.createTitle(key);
  	    	var header = { title: headerText, help:value.help };
  		    headers.push(header);
  	    });
        } else if(this.schema.model) {
      	var model = this.schema.model;
      	var modelInstance = new model({});
      	_.each(modelInstance.schema, function(value, key) {
      	  var headerText = schemaHeaders[key] || self.createTitle(key);
      	  var header = { title: headerText, help:value.help };
      	  headers.push(header);
          });
        } else {
    	    throw "Missing item 'schema'";
        }
        
        return headers;
    },
    
    render: function() {
      var self = this,
          value = this.value || [];

      var $el = $($.trim(this.template({repeaterId:this.id, caption: self.caption, headers: self.headers, addLabel: self.addLabel})));

      //Store a reference to the repeater (item container)
      this.$repeater = $el.is('[data-items]') ? $el : $el.find('[data-items]');
      
	  //Add existing items
      if (value.length) {
        _.each(value, function(itemValue) {
          self.addItem(itemValue);
        });
      }

      //Add items as long as less than min
      var minNumItems = this.schema.min || 0;
      while(this.items.length < minNumItems) {
    	  this.addItem(null);
      }
      
      this.setElement($el);
      this.$el.attr('id', this.id);
      this.$el.attr('name', this.key);
            
      if (this.hasFocus) this.trigger('blur', this);
      
      this.invalidateCollection();
      
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
      
      
      //fieldsetConstructor: this.constructor.Fieldset,
      //fieldConstructor: this.constructor.Field
      
      //var item = new editors.RepeaterRow({
      var item = new editors.Repeater.Item({
  		id: this.id,
        key: this.key,
        schema: this.schema,
        value: value,
        repeater: this,
        item: this,
        form: this.form,
        Field: this.constructor.Field,
        Fieldset: this.constructor.Fieldset
      });
      item.id = this.id + '-item-' + item.cid;
      item.render();
      
      var _addItem = function() {
        self.items.push(item);
        self.$repeater.append(item.el);
        
        /*item.editor.on('all', function(event) {
          if (event === 'change') return;

          var args = _.toArray(arguments);
          args[0] = 'item:' + event;
          args.splice(1, 0, self);

          editors.Repeater.prototype.trigger.apply(this, args);
        }, self);*/
        
        /*item.editor.on('change', function() {
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
        }, self);*/
        
        if (userInitiated || value) {
          item.addEventTriggered = true;
        }
        
        if (userInitiated) {
          self.trigger('add', self, item.editor);
          self.trigger('change', self);
        }
      };
      
      //Check if we need to wait for the item to complete before adding to the repeater
      /*if (this.Editor.isAsync) {
    	  alert("!async");
        item.editor.on('readyToAdd', _addItem, this);
      }
      else {
    	  alert("!not async");*/
        _addItem();
      //}  
        
        //item.editor.focus();
      //}
      
        //$("input").prop('disabled', true);
        //$("input").prop('disabled', false);
        
      
        
       this.invalidateCollection();
        
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
      
      this.invalidateCollection();
      
    },

    invalidateCollection: function() {
    	
    	//Disable add button if max number of items is reached
        if(this.schema.max) {
      	  if(this.items.length >= this.schema.max) {
      		  this.$('[data-target="'+this.id+'"]').prop('disabled', true);
      	  } else {
      		  this.$('[data-target="'+this.id+'"]').prop('disabled', false);
      	  }
        }
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
    
    setError: function(msg) {
      //Todo:field target an id field of the parent element - can it be changed?
      //Target id instead of tag, becouse forms may be nested
      $('#error-'+this.id).html(msg);
    },
    
    clearError: function() {
      $('#error-'+this.id).empty();
    },
    
    /**
     * Run validation
     * 
     * @return {Object|Null}
     */
    validate: function() {
	  
      //Collect item errors
      var errors = [];
      _.each(this.items, function(item) {
        var itemErrors = item.validate();
        if(itemErrors) {
        	errors.push(itemErrors);
        }
      });
      
      //Validate max number of items
      if(this.schema.max) {
    	  if(this.items.length > this.schema.max) {
    		  var repeaterError = {};
    		  repeaterError[this.key] = { type:"max", message:"Maximum number of items is "+this.schema.max };
    		  repeaterErrors.push(repeaterError);
    	  }
      }
      
      //Validate min number of items
      var repeaterErrors = [];
      if(this.schema.min) {
    	  if(this.items.length < this.schema.min) {
    		  var repeaterError = {};
    		  repeaterError[this.key] = { type:"min", message:"Minimum number of items is "+this.schema.min };
    		  repeaterErrors.push(repeaterError);
    	  }
      }
      
      if(repeaterErrors.length > 0) {
    	  for (var key in repeaterErrors[0]) {
    		this.setError(repeaterErrors[0][key].message);
    		break;
    	  }
    	  
    	  errors = errors.concat(repeaterErrors);
      } else {
    	  this.clearError();
      }
      
	  //Don't bother about error messages (maybe with max/min rows)
      if(errors.length == 0) {
    	return null;
      } else {
	  	return errors;
      }
    }
  }, {
  
    template: _.template('\
    <div>\
      <div id="error-<%= repeaterId %>"></div>\
      <table>\
        <colgroup>\
  		  <% _.each(headers, function(header, index) { %>\
      	  <col class="col-<%= index %>">\
      	  <% }); %>\
      	  <col class="col-<%= headers.length %>">\
      	</colgroup>\
		<thead>\
    	  <tr>\
    	  <% _.each(headers, function(header) { %>\
		    <th>\
				<%= header.title %><br>\
				<small class="text-muted"><%= header.help %></small>\
			</th>\
		  <% }); %>\
    		<th></th>\
          </tr>\
        </thead>\
		<tfoot>\
		  <tr>\
            <th colspan="<%= (headers.length+1) %>"><button data-target="<%= repeaterId %>" type="button" data-action="add"><%= addLabel %></button></th>\
          </tr>\
		</tfoot>\
		<tbody data-items>\
        </tbody>\
      </table>\
    <div>\
    ', null, Form.templateSettings),
    
    /*<div>\
      <table class="table table-bordered">\
		<tfoot class="your foot">\
		  <tr>\
            <th colspan="2"><button class="btn btn-primary pull-right" data-target="<%= repeaterId %>" type="button" data-action="add"><%= addLabel %></button>\
    		</th>\
          </tr>\
		</tfoot>\
		<tbody data-items>\
        </tbody>\
      </table>\
    <div>\*/
    
    /*<div>\
      <div id="error-<%= repeaterId %>"></div>\
      <table">\
		<tfoot>\
		  <tr>\
            <th colspan="2"><button data-target="<%= repeaterId %>" type="button" data-action="add"><%= addLabel %></button>\
    		</th>\
          </tr>\
		</tfoot>\
		<tbody data-items>\
        </tbody>\
      </table>\
    <div>\*/
    
    verticalTemplate: _.template('\
	<div>\
      <table>\
		<tfoot>\
		  <tr>\
            <th colspan="2"><button class="btn btn-primary pull-right" data-target="<%= repeaterId %>" type="button" data-action="add"><%= addLabel %></button>\
    		</th>\
          </tr>\
		</tfoot>\
		<tbody data-items>\
        </tbody>\
      </table>\
    <div>\
    ', null, Form.templateSettings),
    
    Fieldset: Form.Fieldset,
    Field: Form.Field

  });
  
  /**
   * RepeaterRow editor
   *
   * Creates a child form. For editing nested Backbone models
   *
   * Special options:
   *   schema.model:   Embedded model constructor
   */
  //Form.editors.RepeaterRow = Form.editors.Base.extend({
  Form.editors.Repeater.Item = Form.editors.Base.extend({

    events: {
        'click [data-action="remove"]': function(e) {
          e.preventDefault();
          if($(e.currentTarget).attr("data-target") != this.id)
  			return;
          
          this.repeater.removeItem(this);
        }
    },
      
    initialize: function(options) {
  	
      Form.editors.Base.prototype.initialize.call(this, options);
      this.repeater = options.repeater;
      this.Field = options.Field;
      this.Fieldset = options.Fieldset;
      if (!this.form) throw 'Missing required option "form"';
      if (!options.schema.model && !options.schema.subSchema) throw 'Missing required "schema.model" option for RepeaterRow editor';
    },

    render: function() {
      var data = this.value || {},
          key = this.key;
          
      
      //Wrap the data in a model if it isn't already a model instance
      var modelInstance = null;
      if(this.schema.model) {
      	var repeaterRow = this.schema.model;
      	var modelInstance = (data.constructor === repeaterRow) ? data : new repeaterRow(data);
      }
      
      //this.nestedForm = new RepeaterForm({
      this.nestedForm = new Form.editors.Repeater.Form({
  	    model: modelInstance,
  	    schema: this.schema.subSchema,
        idPrefix: this.id + '_',
        fieldTemplate: 'field',
        layout: this.schema.layout,
        Field: this.Field,
        Fieldset: this.Fieldset
      });

      this._observeFormEvents();
      
      //Render fields
      var $el = $(this.nestedForm.render().el);
      
      //Render remove button
      var $removeButton = $($.trim(this.constructor.removeButtonTemplate({ itemId:this.id })));
      $el.append($removeButton);
      		
      //$el.append('<td><button type="button" data-target="'+this.id+'" data-action="remove">&times;</button></td>');
      this.setElement($el);
      
      if (this.hasFocus) this.trigger('blur', this);

      return this;
    },

    /**
     * Update the embedded model, checking for nested validation errors and pass them up
     * Then update the main model if all OK
     *
     * @return {Error|null} Validation error or null
     */
    commit: function() {
      var error = this.nestedForm.commit();
      if (error) {
        this.$el.addClass('error');
        return error;
      }

      //Change!!!
      return Form.editors.Object.prototype.commit.call(this);
    },

    /**
     * J starts
     */
    getValue: function() {
      if (this.nestedForm) return this.nestedForm.getValue();

      return this.value;
    },

    setValue: function(value) {
      this.value = value;

      this.render();
    },

    focus: function() {
      if (this.hasFocus) return;

      this.nestedForm.focus();
    },

    blur: function() {
      if (!this.hasFocus) return;

      this.nestedForm.blur();
    },

    remove: function() {
      this.nestedForm.remove();

      Backbone.View.prototype.remove.call(this);
    },

    validate: function() {
      return this.nestedForm.validate();
    },

    _observeFormEvents: function() {
      if (!this.nestedForm) return;
      
      this.nestedForm.on('all', function() {
        var args = _.toArray(arguments);
        args[1] = this;

        this.trigger.apply(this, args);
      }, this);
    }

  }, {
    removeButtonTemplate: _.template('\
  	  <td><button type="button" data-target="<%= itemId %>" data-action="remove" class="btn pull-right">&times;</button></td>\
  	', null, this.templateSettings)
  });
  
  Form.editors.Repeater.Form = Form.extend({
		
	  /**
	   * Constructor
	   * 
	   * @param {Object} [options.schema]
	   * @param {Backbone.Model} [options.model]
	   * @param {Object} [options.data]
	   * @param {String[]|Object[]} [options.fieldsets]
	   * @param {String[]} [options.fields]
	   * @param {String} [options.idPrefix]
	   * @param {Form.Field} [options.Field]
	   * @param {Form.Fieldset} [options.Fieldset]
	   * @param {Function} [options.template]
	   */
	  initialize: function(options) {
		 
		var self = this;
		
	    options = options || {};
	    
	    //Find the schema to use
	    var schema = this.schema = (function() {
	      
	      //Prefer schema from options
	      if (options.schema) return _.result(options, 'schema');
	      
	      //Then schema on model
	      var model = options.model;
	      if (model && model.schema) {
	        return (_.isFunction(model.schema)) ? model.schema() : model.schema;
	      }
	      
	      //Then built-in schema
	      if (self.schema) {
	        return (_.isFunction(self.schema)) ? self.schema() : self.schema;
	      }
	      
	      //Fallback to empty schema
	      return {};
	    })();
	    
	    if (!options.layout) throw 'Missing required "layout" option for Repeater.Form'; 	
	    this.layout = options.layout;

	    //Store important data
	    _.extend(this, _.pick(options, 'model', 'data', 'idPrefix'));

	    //Override defaults
	    var constructor = this.constructor;
	    
	    if(this.layout === 'vertical') {
	    	this.template = options.template || constructor.verticalTemplate;
	    } else {
	    	this.template = options.template || constructor.template;
	    }
	    
	    this.Fieldset = options.Fieldset || constructor.Fieldset;//BootstrapForm.Fieldset;//
	    this.Field = options.Field || constructor.Field;//BootstrapForm.Field;//
	    //this.NestedField = options.NestedField || constructor.NestedField;
	    
	    //Check which fields will be included (defaults to all)
	    var selectedFields = this.selectedFields = options.fields || _.keys(schema);

	    //Create fields
	    var fields = this.fields = {};
	    
	    _.each(selectedFields, function(key) {
	      var fieldSchema = schema[key];
	      fields[key] = this.createField(key, fieldSchema);
	    }, this);
	    
	    //Create fieldsets
	    var fieldsetSchema = options.fieldsets || [selectedFields],
	        fieldsets = this.fieldsets = [];

	    _.each(fieldsetSchema, function(itemSchema) {
	      this.fieldsets.push(this.createFieldset(itemSchema));
	    }, this);
	  },
		  
	  /**
	   * Creates a Field instance
	   *
	   * @param {String} key
	   * @param {Object} schema       Field schema
	   *
	   * @return {Form.Field}
	   */
	  createField: function(key, schema) {
	  	
	    if(this.layout === 'vertical') {
	    	var fieldTemplate = this.constructor.verticalFieldTemplate;
	    } else {
	    	var fieldTemplate = this.constructor.fieldTemplate;
	    } 
	    
		var options = {
	      form: this,
	      key: key,
	      schema: schema,
	      idPrefix: this.idPrefix,
	      template: fieldTemplate
	    };

	    if (this.model) {
	      options.model = this.model;
	    } else if (this.data) {
	      options.value = this.data[key];
	    } else {
	      options.value = null;
	    }

	    var field = new this.Field(options);

	    this.listenTo(field.editor, 'all', this.handleEditorEvent);

	    return field;
	  },
	  
	  createTitle: function(str) {
	  	str = str.replace(/([A-Z])/g, ' $1');
	    str = str.replace(/^./, function(str) { return str.toUpperCase(); });
	    return str;
	  },
	    
	  render: function() {
	    var self = this,
	        fields = this.fields;
	    
	    //Render form
	    var $form = $($.trim(this.template(_.result(this, 'templateData'))));
	    
	    //Render standalone editors
	    /*$form.find('[data-editors]').add($form).each(function(i, el) {
	      var $container = $(el),
	          selection = $container.attr('data-editors');

	      if (_.isUndefined(selection)) return;

	      //Work out which fields to include
	      var keys = (selection == '*')
	        ? self.selectedFields || _.keys(fields)
	        : selection.split(',');

	      //Add them
	      _.each(keys, function(key) {
	        var field = fields[key];

	        $container.append(field.editor.render().el);
	      });
	    });*/

	    //Render standalone fields
	    /*$form.find('[data-fields]').add($form).each(function(i, el) {
	      var $container = $(el),
	          selection = $container.attr('data-fields');

	      if (_.isUndefined(selection)) return;

	      //Work out which fields to include
	      var keys = (selection == '*')
	        ? self.selectedFields || _.keys(fields)
	        : selection.split(',');

	      //Add them
	      _.each(keys, function(key) {
	        var field = fields[key];

	        $container.append(field.render().el);
	      });
	    });*/
	    
	    //Render fieldsets
	    $form.find('[data-fieldsets]').add($form).each(function(i, el) {
	      var $container = $(el),
	          selection = $container.attr('data-fieldsets');

	      if (_.isUndefined(selection)) return;

	      _.each(self.fieldsets, function(fieldset) {
	    	  	_.each(fieldset.fields, function(field) {
	    	        $container.append(field.render().el);
	    	    });
	      });
	    });

	    //Set the main element
	    this.setElement($form);
	    
	    //Set class
	    $form.addClass(this.className);

	    return this;
	  }
		  
	}, {

	  fieldTemplate: _.template('\
	    <td class="form-group">\
	      <div data-editor></div>\
		  <div class="help-block">\
		    <span id="error-<%= editorId %>" data-error class="text-danger"></span>\
		  </div>\
	    </td>\
	  ', null, Form.templateSettings),
				  
	  template: _.template('\
	    <tr data-fieldsets class="repeater-form">\
		</tr>\
	  ', null, this.templateSettings),
	  
	  verticalFieldTemplate: _.template('\
	    <tr>\
		  <th><%= title %></th>\
	      <td class="form-group">\
	        <div data-editor></div>\
			<div class="help-block">\
			  <span id="error-<%= editorId %>" data-error class="text-danger"></span>\
			</div>\
	      </td>\
		</tr>\
	  ', null, Form.templateSettings),
	  
	  verticalTemplate: _.template('\
	    <tr class="repeater-form">\
		  <td>\
			  <table class="table table-bordered">\
			  	<tbody data-fieldsets>\
			    </tbody>\
			  </table>\
		  </td>\
		</tr>\
	  ', null, this.templateSettings),

	  templateSettings: {
	    evaluate: /<%([\s\S]+?)%>/g, 
	    interpolate: /<%=([\s\S]+?)%>/g, 
	    escape: /<%-([\s\S]+?)%>/g
	  },

	  editors: {},
	  
	  errorClassName: 'has-error'

	});

})(Backbone.Form);
