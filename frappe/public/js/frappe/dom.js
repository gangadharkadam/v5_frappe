// Copyright (c) 2013, Web Notes Technologies Pvt. Ltd. and Contributors
// MIT License. See license.txt

// add a new dom element
frappe.provide('frappe.dom');

frappe.dom = {
	id_count: 0,
	freeze_count: 0,
	by_id: function(id) {
		return document.getElementById(id);
	},
	set_unique_id: function(ele) {
		var id = 'unique-' + frappe.dom.id_count;
		if(ele)
			ele.setAttribute('id', id);
		frappe.dom.id_count++;
		return id;
	},
	eval: function(txt) {
		if(!txt) return;
		var el = document.createElement('script');
		el.appendChild(document.createTextNode(txt));
		// execute the script globally
		document.getElementsByTagName('head')[0].appendChild(el);
	},
	set_style: function(txt) {
		if(!txt) return;
		var se = document.createElement('style');
		se.type = "text/css";
		if (se.styleSheet) {
			se.styleSheet.cssText = txt;
		} else {
			se.appendChild(document.createTextNode(txt));
		}
		document.getElementsByTagName('head')[0].appendChild(se);
	},
	add: function(parent, newtag, className, cs, innerHTML, onclick) {
		if(parent && parent.substr)parent = frappe.dom.by_id(parent);
		var c = document.createElement(newtag);
		if(parent)
			parent.appendChild(c);

		// if image, 3rd parameter is source
		if(className) {
			if(newtag.toLowerCase()=='img')
				c.src = className
			else
				c.className = className;
		}
		if(cs) frappe.dom.css(c,cs);
		if(innerHTML) c.innerHTML = innerHTML;
		if(onclick) c.onclick = onclick;
		return c;
	},
	css: function(ele, s) {
		if(ele && s) {
			$.extend(ele.style, s);
		};
		return ele;
	},
	freeze: function() {
		// blur
		if(!$('#freeze').length) {
			$("<div id='freeze' class='modal-backdrop'>")
				.on("click", function() {
					if (cur_frm && cur_frm.cur_grid) {
						cur_frm.cur_grid.toggle_view();
						return false;
					}
				})
				.appendTo("#body_div");
		}
		$('#freeze').toggle(true);
		frappe.dom.freeze_count++;
	},
	unfreeze: function() {
		if(!frappe.dom.freeze_count)return; // anything open?
		frappe.dom.freeze_count--;
		if(!frappe.dom.freeze_count) {
			$('#freeze').toggle(false);
		}
	},
	save_selection: function() {
		// via http://stackoverflow.com/questions/5605401/insert-link-in-contenteditable-element
		if (window.getSelection) {
			sel = window.getSelection();
			if (sel.getRangeAt && sel.rangeCount) {
				var ranges = [];
				for (var i = 0, len = sel.rangeCount; i < len; ++i) {
					ranges.push(sel.getRangeAt(i));
				}
				return ranges;
			}
		} else if (document.selection && document.selection.createRange) {
			return document.selection.createRange();
		}
		return null;
	},
	restore_selection: function(savedSel) {
		if (savedSel) {
			if (window.getSelection) {
				sel = window.getSelection();
				sel.removeAllRanges();
				for (var i = 0, len = savedSel.length; i < len; ++i) {
					sel.addRange(savedSel[i]);
				}
			} else if (document.selection && savedSel.select) {
				savedSel.select();
			}
		}
	}
}

frappe.get_modal = function(title, content) {
	return $(frappe.render_template("modal", {title:title, content:content})).appendTo(document.body);
};

var pending_req = 0
frappe.set_loading = function() {
	pending_req++;
	$('body').css('cursor', 'progress').attr("data-ajax-state", "running");
	NProgress.start();
	$("body");
}

frappe.done_loading = function() {
	pending_req--;
	if(!pending_req){
		$('body').css('cursor', 'default').attr("data-ajax-state", "complete");
		NProgress.done();
	} else {
		NProgress.inc();
	}
}

var get_hex = function(i) {
	i = Math.round(i);
	if(i>255) return 'ff';
	if(i<0) return '00';
	i =i .toString(16);
	if(i.length==1) i = '0'+i;
	return i;
}

frappe.get_shade = function(color, factor) {
	if(color.substr(0,3)=="rgb") {
		var rgb = function(r,g,b) {
			return get_hex(r) + get_hex(g) + get_hex(b);
		}
		color = eval(color);
	}
	if(color.substr(0,1)=="#") {
		var color = color.substr(1);
	}

	var get_int = function(hex) {
		return parseInt(hex,16);
	}
	return get_hex(get_int(color.substr(0,2)) + factor)
		+ get_hex(get_int(color.substr(2,2)) + factor)
		+ get_hex(get_int(color.substr(4,2)) + factor)
}

frappe.get_cookie = function(c) {
	var clist = (document.cookie+'').split(';');
	var cookies = {};
	for(var i=0;i<clist.length;i++) {
		var tmp = clist[i].split('=');
		cookies[strip(tmp[0])] = strip($.trim(tmp.slice(1).join("=")), "\"");
	}
	return cookies[c];
}

frappe.dom.set_box_shadow = function(ele, spread) {
	$(ele).css('-moz-box-shadow', '0px 0px '+ spread +'px rgba(0,0,0,0.3);')
	$(ele).css('-webkit-box-shadow', '0px 0px '+ spread +'px rgba(0,0,0,0.3);')
	$(ele).css('-box-shadow', '0px 0px '+ spread +'px rgba(0,0,0,0.3);')

};

// add <option> list to <select>
(function($) {
	$.fn.add_options = function(options_list) {
		// create options
		for(var i=0; i<options_list.length; i++) {
			var v = options_list[i];
			if (is_null(v)) {
				var value = null;
				var label = null;
			} else {
				var is_value_null = is_null(v.value);
				var is_label_null = is_null(v.label);

				if (is_value_null && is_label_null) {
					var value = v;
					var label = __(v);
				} else {
					var value = is_value_null ? "" : v.value;
					var label = is_label_null ? __(value) : __(v.label);
				}
			}
			$('<option>').html(cstr(label)).attr('value', value).appendTo(this);
		}
		// select the first option
		this.selectedIndex = 0;
		return $(this);
	}
	$.fn.set_working = function() {
		this.prop('disabled', true);
	}
	$.fn.done_working = function() {
		this.prop('disabled', false);
	}
})(jQuery);

(function($) {
    function pasteIntoInput(el, text) {
        el.focus();
        if (typeof el.selectionStart == "number") {
            var val = el.value;
            var selStart = el.selectionStart;
            el.value = val.slice(0, selStart) + text + val.slice(el.selectionEnd);
            el.selectionEnd = el.selectionStart = selStart + text.length;
        } else if (typeof document.selection != "undefined") {
            var textRange = document.selection.createRange();
            textRange.text = text;
            textRange.collapse(false);
            textRange.select();
        }
    }

    function allowTabChar(el) {
        $(el).keydown(function(e) {
            if (e.which == 9) {
                pasteIntoInput(this, "\t");
                return false;
            }
        });

        // For Opera, which only allows suppression of keypress events, not keydown
        $(el).keypress(function(e) {
            if (e.which == 9) {
                return false;
            }
        });
    }

    $.fn.allowTabs = function() {
        if (this.jquery) {
            this.each(function() {
                if (this.nodeType == 1) {
                    var nodeName = this.nodeName.toLowerCase();
                    if (nodeName == "textarea" || (nodeName == "input" && this.type == "text")) {
                        allowTabChar(this);
                    }
                }
            })
        }
        return this;
    }
})(jQuery);
