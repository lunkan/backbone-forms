//==================================================================================================
//BOOTSTRAPREPEATER
//==================================================================================================

Form.editors.BootstrapRepeater = Form.editors.Repeater.extend(null, {

	template: _.template('\
    <div>\
      <table class="table table-striped table-bordered">\
		<thead class="">\
    	  <tr>\
    	  <% _.each(headers, function(value) { %>\
		    <th><%= value %></th>\
		  <% }); %>\
    		<th></th>\
          </tr>\
        </thead>\
		<tfoot>\
		  <tr>\
            <th colspan="<%= (headers.length+1) %>"><button class="btn btn-primary pull-right" data-target="<%= repeaterId %>" type="button" data-action="add"><%= addLabel %></button></th>\
          </tr>\
		</tfoot>\
		<tbody data-items>\
        </tbody>\
      </table>\
    <div>\
    ', null, Form.templateSettings),
    
    verticalTemplate: _.template('\
    <div>\
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
    <div>\
    ', null, Form.templateSettings),

    errorClassName: 'has-error',
    Fieldset: BootstrapForm.Fieldset,
    Field: BootstrapForm.Field
});