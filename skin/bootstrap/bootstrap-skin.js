
var BootstrapForm = Form.extend(null, {

  //STATICS
  template: _.template('\
    <form data-fieldsets></form>\
  ', null, this.templateSettings),

  templateSettings: {
    evaluate: /<%([\s\S]+?)%>/g, 
    interpolate: /<%=([\s\S]+?)%>/g, 
    escape: /<%-([\s\S]+?)%>/g
  },

  editors: {}

});

BootstrapForm.Fieldset = Form.Fieldset.extend(null, {
  template: _.template('\
    <fieldset data-fields>\
      <% if (legend) { %>\
        <legend><%= legend %></legend>\
      <% } %>\
    </fieldset>\
  ', null, Form.templateSettings)

});

BootstrapForm.Field = Form.Field.extend(null, {
	template: _.template('\
	  <div class="form-group">\
	    <label for="<%= editorId %>"><%= title %></label>\
	    <div data-editor></div>\
		<div class="help-block">\
		  <span id="error-<%= editorId %>" data-error class="text-danger"></span>\
		  <small class="text-muted"><%= help %></small>\
		</div>\
	  </div>\
	', null, Form.templateSettings),
	
	errorClassName: 'has-error'
});

Form.editors.BootstrapText = Form.editors.Text.extend({
  attributes: {'class':'form-control'}
});
