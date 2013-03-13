// Utility functions


function exists(x) {
  return typeof x !== 'undefined';
}


function is_ipad() {
  return navigator.userAgent.match(/iPad/i) != null;
}


function url() {
  return "" + window.location;
}


function get_pdb_id_from_url(loc) {
  var pieces = loc.split('#')[0].split('/');
  var i = pieces.length-1;
  return pieces[i];
}


grab_float = function(f) {
  return parseFloat(f);
}
    
    
grab_boolean = function(b) {
  if (b === "true") {
    return true;
  }
  if (b === "false") {
    return false;
  }
  return b == true;
}


function create_canvas_dom(parent_tag) {
  var parent_elem = $(parent_tag);
  var style = {'background-color':'black'};
  var canvas_elem = $('<canvas>').css(style);
  parent_elem.append(canvas_elem);
  canvas_dom = canvas_elem[0];
  canvas_dom.width = parent_elem.width();
  canvas_dom.height = parent_elem.height();
  return canvas_dom;
}


blink = function(selector) {
  $(selector).animate(
    {opacity:0}, 50, "linear",
    function() {
      $(this).delay(800);
      $(this).animate(
        {opacity:1}, 50, 
        function(){
          blink(this);
        });
      $(this).delay(800);
    }
  );
}


link_button = function(id_tag, html_text, class_tag, click_callback) {
  var item = $('<a>')
    .attr({'id':id_tag, 'href':''})
    .html(html_text);
  if (class_tag) {
    item.addClass(class_tag);
  }
  if (click_callback) {
    item.click(function(e) { click_callback(); return false; });
  }
  return item;
}


create_message_div = function(text, width, cleanup) {
  var edit_div = $('<div>')
    .addClass('mobile-textbox')
    .css({'width':width});

  var okay = link_button(
      'okay', 'okay', 'mobile-button', 
      function() { cleanup(); return false; });

  edit_div
    .append(text)
    .append("<br><br>")
    .append(okay);
  return edit_div;
}

create_edit_box_div = function(init_text, width, change_callback, cleanup, label) {
  var edit_div = $('<div>')
    .addClass('mobile-textbox')
    .css({'width':width});

  if (label) {
    edit_div.append(label);
  }

  var textarea = $("<textarea>")
    .css({'width':width})
    .addClass('mobile-textarea')
    .text(init_text)
    .keydown(function(e) {
      if (e.keyCode == 27) {
        cleanup();
      }
      return true;
    })

  var accept_edit = function() { 
    change_callback(textarea.val());
    cleanup();
    return false;
  }

  var discard_edit = function() {
    cleanup();
    return false;
  }

  var save_edit = link_button(
      'okay', 'okay', 'mobile-button', accept_edit);

  var discard_edit = link_button(
      'discard', 'discard', 'mobile-button', discard_edit);

  edit_div
    .append(textarea)
    .append(save_edit)
    .append(' ')
    .append(discard_edit);
  return edit_div;
}


editable_text_div = function(init_text, width, change_callback) {
  var div = $('<div>')

  var text_div = $('<div>').css({'width':width})
  var actual_text = $('<div>').html(init_text)
  var edit_div;

  var start_edit = function() {
    text_div.hide();
    edit_div.show();
    var textarea = edit_div.find('textarea')
    setTimeout(function() { textarea.focus(); }, 100)
    return false;
  }
  var edit_button = link_button('edit', 'edit', 'mobile-button', start_edit);
  text_div
    .append(actual_text)

  var accept_edit = function(text) { 
    actual_text.text(text);
    change_callback(text);
  }
    var back_to_text = function() {
    edit_div.hide();
    text_div.show();
    return false;
  }      

  edit_div = create_edit_box_div(
      init_text, width, accept_edit, back_to_text);
  edit_div.hide();

  div
    .append(text_div)
    .append(edit_div)

  return div;
}


function stick_in_top_left(parent, target, x_offset, y_offset) {
  target.css({
    'position':'absolute',
    'z-index':'9000'
  });
  var top = parent.position().top;
  var left = parent.position().left;
  parent.append(target);
  var w_parent = parent.outerWidth();
  var h_parent = parent.outerHeight();
  target.width(w_parent - 2*x_offset);
  target.height(h_parent - 2*y_offset);
  target.css({
      'top': top + y_offset,
      'left': left + x_offset,
  });
}


function stick_in_center(parent, target, x_offset, y_offset) {
  target.css({
    'position':'absolute',
    'z-index':'9000'
  });
  var top = parent.position().top;
  var left = parent.position().left;
  var w_parent = parent.outerWidth();
  var h_parent = parent.outerHeight();
  console.log(top, left, w_parent, h_parent);
  parent.append(target);
  var w_target = target.outerWidth();
  var h_target = target.outerHeight();
  target.css({
      'top': top + h_parent/2 - h_target/2 - y_offset,
      'left': left + w_parent/2 - w_target/2 - x_offset,
  });
}


function in_array(v, w_list) {
  for (var k=0; k<w_list.length; k+=1) {
    if (v == w_list[k]) {
      return true;
    }
  }
  return false;
}


function del_from_array(x, x_list) {
  for (var i=0; i<=x_list.length; i+=1)
    if (x == x_list[i]) {
      x_list.splice(i, 1);
    }
}


function trim(text) {
  return text.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}


function do_nothing() {
  return false;
}


function clone_dict(d) {
  var new_d = {};
  for (var k in d) {
    new_d[k] = d[k];
  };
  return new_d;
}


function clone_list_of_dicts(list_of_dicts) {
  var new_list = [];
  for (var i=0; i<list_of_dicts.length; i+= 1) {
    new_list.push(clone_dict(list_of_dicts[i]));
  }
  return new_list;
}


function equal_dicts(d, e) {
  for (var k in d) {
    if (!k in e) {
      return false;
    }
    if (d[k] != e[k]) {
      return false;
    }
  }
  return true;
}


function random_string(n_char) {
	var chars = 
	   "0123456789abcdefghiklmnopqrstuvwxyz";
	var s = '';
	for (var i=0; i<n_char; i++) {
		var j = Math.floor(Math.random()*chars.length);
		s += chars.substring(j,j+1);
	}
	return s;
}


function random_id() {
  return 'view:' + random_string(6);
}


function get_current_date() {
  var current_view = new Date();
  var month = current_view.getMonth() + 1;
  var day = current_view.getDate();
  var year = current_view.getFullYear();
  return day + "/" + month + "/" + year;
}


