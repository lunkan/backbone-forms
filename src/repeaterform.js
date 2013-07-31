//==================================================================================================
//FORM
//==================================================================================================

var RepeaterForm = Form.extend({
	
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
    
    if (!options.layout) throw 'Missing required "layout" option for RepeaterForm'; 	
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
	    <small class="text-muted"><%= help %></small>\
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
		  <small class="text-muted"><%= help %></small>\
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
