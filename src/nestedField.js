
//==================================================================================================
//NESTEDFIELD
//==================================================================================================

Form.NestedField = Form.Field.extend({

  template: _.template($.trim('\
    <div class="nested-field">\
      <span data-editor></span>\
      <% if (help) { %>\
        <div><%= help %></div>\
      <% } %>\
      <div data-error></div>\
    </div>\
  '), null, Form.templateSettings)

});
