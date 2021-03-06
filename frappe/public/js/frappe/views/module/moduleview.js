// Copyright (c) 2013, Web Notes Technologies Pvt. Ltd. and Contributors
// MIT License. See license.txt

frappe.provide("frappe.views.moduleview");
frappe.provide("frappe.module_page");

frappe.views.ModuleFactory = frappe.views.Factory.extend({
	make: function(route) {
		var module = route[1];
		frappe.views.moduleview[module] = parent;
		new frappe.views.moduleview.ModuleView(module);
	},
});

frappe.views.show_open_count_list = function(element) {
	var doctype = $(element).attr("data-doctype");
	var condition = frappe.boot.notification_info.conditions[doctype];
	if(condition) {
		frappe.route_options = condition;
		var route = frappe.get_route()
		if(route[0]==="List" && route[1]===doctype) {
			frappe.pages["List/" + doctype].doclistview.refresh();
		} else {
			frappe.set_route("List", doctype);
		}
	}
}

frappe.get_module = function(m) {
	var module = frappe.modules[m];
	if (!module) {
		return;
	}

	module.name = m;

	if(module.type==="module" && !module.link) {
		module.link = "Module/" + m;
	}

	if(module.link) {
		module._id = module.link.toLowerCase().replace("/", "-");
	}

	if(!module.label) {
		module.label = m;
	}

	if(!module._label) {
		module._label = __(module.label || module.name);
	}

	return module;
}


frappe.views.moduleview.ModuleView = Class.extend({
	init: function(module) {
		this.module = module;
		this.module_info = frappe.get_module(module);
		this.sections = {};
		this.current_section = null;
		this.make();
	},

	make: function() {
		var me = this;
		return frappe.call({
			method: "frappe.desk.moduleview.get",
			args: {
				module: this.module
			},
			callback: function(r) {
				me.data = r.message;
				me.parent = frappe.make_page(true);
				frappe.views.moduleview[me.module] = me.parent;
				me.page = me.parent.page;
				me.parent.moduleview = me;
				me.page.set_title(__(frappe.modules[me.module]
					&& frappe.modules[me.module].label || me.module));
				me.render();
			}
		});
	},

	render: function() {
		this.page.main.empty();
		this.make_sidebar();
		this.sections_by_label = {};

		// index by label
		for(var i in this.data.data) {
			this.sections_by_label[this.data.data[i].label] = this.data.data[i];
		}
		this.activate(this.data.data[0].label);
	},

	make_title: function(name) {
		this.page_title = this.page.wrapper.find(".page-title").addClass("hidden-xs");
		this.page.wrapper.find(".mobile-title, .mobile-module-icon").remove();

		$(frappe.render_template("module_title", {
			title: this.page_title.find("h1").html(),
			section_name: name,
			data: this.data
		})).insertAfter(this.page_title);
	},

	make_sidebar: function(name) {
		var me = this;
		$(frappe.render_template("module_sidebar", {data:this.data})).appendTo(this.page.sidebar);

		this.page.wrapper.on("click", ".module-link", function() {
			me.activate($(this).parent().attr("data-label"));
		});
	},

	activate: function(name) {
		var me = this;
		if(this.current_section) {
			this.current_section.addClass("hide");
		}
		if(!this.sections[name]) {
			var data = this.sections_by_label[name];
			this.sections[name] = $(frappe.render_template("module_section", { data: data }))
				.appendTo(this.page.main);

			$(this.sections[name]).find(".module-item").each(function(i, mi) {
				$(mi).on("click", function() {
					frappe.set_route(me.get_route(data.items[$(mi).attr("data-item-index")]));
				});
			});
		}
		this.current_section = this.sections[name];
		this.current_section.removeClass("hide");

		// active
		this.page.sidebar.find("li.active").removeClass("active");
		this.page.sidebar.find('[data-label="'+ name +'"]').addClass("active");

		// make mobile title
		this.make_title(name);

		frappe.app.update_notification_count_in_modules();
	},

	get_route: function(item) {
        var route = [item.route || item.link];
        if (!route[0]) {
            if (item.type == "doctype") {
                route = ["List", item.name];
            } else if (item.type == "page") {
                route = [item.name]
            } else if (item.type == "report") {
				if(item.is_query_report) {
					route = ["query-report", item.name];
				} else {
					route = ["Report", item.doctype, item.name];
				}
            }
        }
		return route;
	}
});
