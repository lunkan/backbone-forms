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

      editors.Base.prototype.initialize.call(this, options);
      var schema = this.schema;
      if (!schema) throw "Missing required option 'schema'";

      this.caption = this.createTitle(this.schema.title);
      this.headers = this.createHeaders(this.schema.model);
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
      str = str.replace(/([A-Z])/g, ' $1');
      str = str.replace(/^./, function(str) { return str.toUpperCase(); });
      return str;
    },
    
    createHeaders: function(model) {
    	
      var self = this;
      var modelInstance = new model({});
        
      var headers = [];
      _.each(modelInstance.schema, function(value, key) {
	    var header = self.createTitle(key);
	    headers.push(header);
	  });
      
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
      
      var item = new editors.RepeaterRow({
  		id: this.id,
        key: this.key,
        schema: this.schema,
        value: value,
        repeater: this,
        item: this,
        form: this.form
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
        item.editor.on('readyToAdd', _addItem, this);
      }

      //Most editors can be added automatically
      else {*/
        _addItem();
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
      //Add error CSS class
      this.$el.addClass('error');

      //Set error message
      this.$('#error-'+this.id).html(msg);
    },
    
    clearError: function() {
      //Remove error CSS class
      this.$el.removeClass('error');

      //Clear error message
  	  //Jonas - changed to error id to avoid nested clear
  	  this.$('#error-'+this.id).empty();
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
    	  this.setError(repeaterErrors[0].weight.message);
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
      <table class="repeater-wrapper">\
		<thead>\
    	  <tr>\
    	  <% _.each(headers, function(value) { %>\
		    <th><%= value %></th>\
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
    
    verticalTemplate: _.template('\
    <div>\
      <div id="error-<%= repeaterId %>"></div>\
      <table class="repeater-wrapper">\
		<tfoot>\
		  <tr>\
            <th colspan="2"><button data-target="<%= repeaterId %>" type="button" data-action="add"><%= addLabel %></button>\
    		</th>\
          </tr>\
		</tfoot>\
		<tbody data-items>\
        </tbody>\
      </table>\
    <div>\
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
  /*Form.editors.Repeater.Item = Form.editors.Base.extend({

    events: {
      'click [data-action="remove"]': function(event) {
        event.preventDefault();
        this.repeater.removeItem(this);
      }
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

	  //Store a reference to the repeater (item container)
      this.$item = $el.is('[data-editor]') ? $el : $el.find('[data-editor]');
	  this.$item.append(this.editor.el);

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

    //Show a validation error
    setError: function(err) {
	
	  //Nested form editors (e.g. Object) set their errors internally
      if (this.editor.hasNestedForm) return;

      //Add error CSS class
      this.$el.addClass(this.errorClassName);

      //Set error message
      this.$('[data-error]').html(err.message);
    },

    //Hide validation errors
	clearError: function() {
	
	  //Nested form editors (e.g. Object) set their errors internally
      if (this.editor.hasNestedForm) return;
	  
      //Remove error CSS class
	  this.$el.removeClass(this.errorClassName);

      //Clear error message
	  this.$('[data-error]').empty();
	}
	
  }, {

    //STATICS
    template: _.template('\
      <tbody data-editor class="repeater-item">\
		<tr>\
			<td><button type="button" data-action="remove">&times;</button></td>\
		</tr>\
      </tbody>\
    ', null, Form.templateSettings),

    errorClassName: 'error'

  });*/

})(Backbone.Form);
