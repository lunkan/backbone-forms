/**
 * RepeaterRow editor
 *
 * Creates a child form. For editing nested Backbone models
 *
 * Special options:
 *   schema.model:   Embedded model constructor
 */
Form.editors.RepeaterRow = Form.editors.Base.extend({
//Form.editors.Object.extend({

  tagName: "tr",
  className: "repeater-row",
  hasNestedForm: true,
  
  initialize: function(options) {
    Form.editors.Base.prototype.initialize.call(this, options);

    if (!this.form) throw 'Missing required option "form"';
    if (!options.schema.model) throw 'Missing required "schema.model" option for RepeaterRow editor';
  },

  render: function() {
    //Get the constructor for creating the nested form; i.e. the same constructor as used by the parent form
    //var NestedForm = this.form.constructor;

	//alert("NestedForm " + this.form.constructor);
	
    var data = this.value || {},
        key = this.key,
        repeaterRow = this.schema.model;

    //Wrap the data in a model if it isn't already a model instance
    var modelInstance = (data.constructor === repeaterRow) ? data : new repeaterRow(data);
   
	this.nestedForm = new Backbone.RepeaterForm({
	  model: modelInstance,
      idPrefix: this.id + '_',
      fieldTemplate: 'field'
    });
	
	
    /*this.nestedForm = new NestedForm({
      model: modelInstance,
      idPrefix: this.id + '_',
      fieldTemplate: 'nestedField'
    });*/

    this._observeFormEvents();

    //Render form
    this.$el.html(this.nestedForm.render().el);
	//view.setElement(element) 
	
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
      // args = ["key:change", form, fieldEditor]
      var args = _.toArray(arguments);
      args[1] = this;
      // args = ["key:change", this=objectEditor, fieldEditor]

      this.trigger.apply(this, args);
    }, this);
  }

});