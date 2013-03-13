//////////////////////////////////////////////////////////
// 
// jolecule - the javascript based protein/dna viewer
//
// relies on data_server jolecule.appspot.com, which, in turn
// relies on the RCSB website http://www.pdb.org.
//
///////////////////////////////////////////////////////////


var keyboard_lock = false;


///////////////////////////////////////////////
// The annotations objects that keeps track of 
// the HTML5 controls on the browswer
///////////////////////////////////////////////


var AnnotationsDisplay = function(controller, data_server) {
  this.scene = controller.scene;
  this.controller = controller;
  this.data_server = data_server;
  this.div = {}; 
  
  this.save_views_to_server = function() {
    // only save views from 1 onwards
    // i.e. no need to say "default view"
    for (var i=1; i<this.scene.saved_views.length; i+=1) {
      var view = this.scene.saved_views[i];
      var view_dict = this.controller.flat_dict_from_view(view);
      this.data_server.save_protein_view(view_dict);
    }
  }

  this.reset_view_div_order = function(id) {
    var order = this.scene.saved_views_by_id[id].order;
    var a = this.div[id].all.find('a').eq(0);
    a.text(order);
  }

  this.reset_borders = function() {
    for (var id in this.div) {
      var last_id = this.scene.saved_views[this.scene.i_last_view].id;
      if (last_id == id) {
        this.div[id].all.removeClass("unselected");
        this.div[id].all.addClass("selected");
      } else {
        this.div[id].all.removeClass("selected");
        this.div[id].all.addClass("unselected");
      }
    }
  }

  this.redraw_selected_view_id = function(id) {
    this.reset_borders();
    var div = this.div[id].all;
    $("#views").scrollTo(div);
  }
  
  this.set_target_by_view_id = function(id) {
    this.controller.set_target_view_by_id(id);
    this.redraw_selected_view_id(id);
    window.location.hash = id;
  }
  
  this.goto_prev_view = function() {
    var id = this.controller.set_target_prev_view();
    this.redraw_selected_view_id(id);
    window.location.hash = id;
  }
  
  this.goto_next_view = function() {
    var id = this.controller.set_target_next_view();
    this.redraw_selected_view_id(id);
    window.location.hash = id;
  }

  this.reset_goto_buttons = function() {
    for (var j=0; j<this.scene.saved_views.length; j+=1) {
      var view = this.scene.saved_views[j];
      this.reset_view_div_order(view.id);
    }
  }
  
  this.remove_view = function(id) {
    var _this = this;
    var success = function() {
      _this.controller.delete_view(id);
      _this.div[id].all.remove();
      delete _this.div[id];
      if (_this.scene.i_last_view >= _this.scene.saved_views.length) {
        _this.scene.i_last_view = _this.scene.saved_views.length-1;
      }
      _this.reset_goto_buttons();
      _this.reset_borders();
    }
    this.data_server.delete_protein_view(id);
    success();
  }

  this.swap_views = function(i, j) {
    var i_id = this.scene.saved_views[i].id;
    var j_id = this.scene.saved_views[j].id;
    var i_div = this.div[i_id].all;
    var j_div = this.div[j_id].all;

    this.controller.swap_views(i, j);

    j_div.insertBefore(i_div);
    this.reset_view_div_order(j_id);
    this.reset_view_div_order(i_id);

    this.save_views_to_server();
  }

  this.swap_up = function(i_id) {
    var i = this.scene.get_i_saved_view_from_id(i_id);
    if (i < 2) {
      return;
    }
    this.swap_views(i-1, i);
  }

  this.swap_down = function(i_id) {
    var i = this.scene.get_i_saved_view_from_id(i_id);
    if (i > this.scene.saved_views.length-2) {
      return;
    }
    this.swap_views(i, i+1);
  }

  this.start_edit = function(id) {
    if (!keyboard_lock) {
      this.set_target_by_view_id(id);
      this.div[id].edit_text.text(view.text);
      this.div[id].edit.show();
      this.div[id].show.hide(); 
      var textarea = this.div[id].edit.find('textarea')
      setTimeout(function() { textarea.focus(); }, 100)
      keyboard_lock = true;
    }
  }
  
  this.save_edit = function(id) {
    var text = this.div[id].edit_text.val();
    var view = this.scene.saved_views_by_id[id];
    this.div[id].show_text.html(text);
    this.div[id].edit.hide();
    this.div[id].show.show(); 
    view.text = text;
    this.save_views_to_server();
    keyboard_lock = false;
  }
  
  this.discard_edit = function(id) {
    this.div[id].edit.hide();
    this.div[id].show.show(); 
    keyboard_lock = false;
  }
  
  this.edit_box = function(id) {
    var this_item = this;
    var save_fn = function(event) { 
        this_item.save_edit(id); 
    };
    var discard_fn = function(event) { 
        this_item.discard_edit(id); 
    }
    var save = link_button("",  "save", "nav", save_fn);
    var discard = link_button("", "discard", "nav",  discard_fn);
    this_item.div[id].edit_text = $("<textarea>")
        .addClass('annotation_text')
        .css({'width':'100%', height:'5em'})
        .click(do_nothing);
    this_item.div[id].edit = $('<div>')
        .click(do_nothing)
        .append(this_item.div[id].edit_text)
        .append('<br>')
        .append(save)
        .append(' ')
        .append(discard)
        .hide();
    return this_item.div[id].edit;
  }

  this.show_box = function(id) {
    var this_item = this;
    var view = this.scene.saved_views_by_id[id];
    var pdb_id = this_item.scene.protein.pdb_id;

    var edit_fn = function() { this_item.start_edit(id); };
    this_item.div[id].edit_fn = edit_fn;
    var edit_a = link_button("", "edit", "nav", edit_fn); 

    var swap_up_a = link_button("", "up", "nav",  
        function() { this_item.swap_up(id); });
    var swap_down_a = link_button("", "down", "nav", 
        function() { this_item.swap_down(id); });

    var delete_a = link_button("", "delete", "nav",  
        function() { this_item.remove_view(id); });

    this_item.div[id].show_text = $('<div>')
        .addClass("annotation_text")
        .html(view.text)

    var show = $('<div>')
        .css({'width':'100%'})
        .append(this_item.div[id].show_text);

    if (view.order > 0) {
      var s = '~ ' + view.creator + ' @' + view.time;
      show.append($('<div>').addClass("author").html(s))
    }
    if ((id != 'view:000000') && (!view.lock)) {
      show.append(edit_a)
          .append(" ")
          .append(swap_up_a)
          .append(" ")
          .append(swap_down_a)
          .append(" ")
          .append(
            $("<div>")
              .css("float","right")
              .append(delete_a)
          );
    }
    this_item.div[id].show = show;
    return this_item.div[id].show;
  }

  this.text_box = function(id) {
    this.div[id].text_box = $('<div>')
        .css({"width":$("#views").width()-50, "padding-bottom":"10px"})
        .append(this.show_box(id))
        .append(this.edit_box(id))
    return this.div[id].text_box;
  }

  this.make_annotation_div = function(id) {
    var i = this.scene.get_i_saved_view_from_id(id);
    var view = this.scene.saved_views_by_id[id];
    var j = view.order;
    var this_item = this;
    var fn = function () { this_item.set_target_by_view_id(id); }
    var a = link_button("", j, 'goto_button', fn);
    this.div[id] = {};
    this.div[id].all = $('<table>').addClass("full_width")
    this.div[id].all.append($('<td>').append(a));
    this.div[id].all.append($('<td>').append(this.text_box(id)));
    return this.div[id].all;
  }

  this.make_new_annotation = function() {
    new_id = random_id();
    var j = this.controller.save_current_view(new_id);
    this.save_views_to_server();

    var div = this.make_annotation_div(new_id);
    if (this.scene.i_last_view == this.scene.saved_views.length-1) {
      $("#views").append(div);
    } else {
      var j = this.scene.i_last_view-1;
      var j_id = this.scene.saved_views[j].id;
      var j_div = this.div[j_id].all;
      div.insertAfter(j_div);
    }

    this.reset_goto_buttons();
    this.reset_borders();
    $("#views").scrollTo(this.div[new_id].all);
  }

  this.create_annotations = function() {
    for (var i=0; i<this.scene.saved_views.length; i+=1) {
      var id = this.scene.saved_views[i].id;
      var div = this.make_annotation_div(id);
      $('#views').append(div);
    }
  }

  var _this = this;

  var save_view = function() { _this.make_new_annotation(); return false; };
  var prev_view = function() { _this.goto_prev_view(); return false; };
  var next_view = function() { _this.goto_next_view(); return false; };

  var header = $("<div id='jolecule-views-header'></div>")
    .append($("<div>").addClass("jolecule-little-header").text("RESIDUES"))
    .append(link_button('', 'save [v]iew', 'jolecule-button', save_view))
    .append(" ")
    .append(link_button('', 'prev[&uarr;]', 'jolecule-button', prev_view))
    .append(" ")
    .append(link_button('', 'next[&darr;]', 'jolecule-button', next_view))
    .append(" ")
    // call-back function will be added later
    .append(link_button('make_label', '[a]dd label', 'jolecule-button'))

  this.top_div = $('#jolecule-views-container');
  this.top_div.append(header);
  this.top_div.append("<div id='views'></div>");
}


/////////////////////////////////////
// show option controls
/////////////////////////////////////


var OptionDisplay = function(controller) {
  this.controller = controller;
  this.scene = controller.scene;

  this.set_backbone = function(option) {
    $('#all_atom').attr('checked', false);
    $('#trace').attr('checked', false);
    $('#ribbon').attr('checked', false);
    $('#' + option).attr('checked', true);
    this.controller.set_backbone_option(option);
  }

  this.set_show = function(option, bool) {
    var check_id = 'input[name=' + option + ']';
    $(check_id).attr('checked', bool);
    this.controller.set_show_option(option, bool);
  }

  this.toggle = function(option) {
    this.set_show(
        option, !this.controller.get_show_option(option));
  }

  this.update = function() {
    var show = this.scene.current_view.show;
    this.set_show('ligands', show.ligands);
    this.set_show('hydrogen', show.hydrogen);
    this.set_show('sidechain', show.sidechain);
    this.set_show('water', show.water);
    if (show.ribbon) {
      this.set_backbone('ribbon');
    } else if (show.trace) {
      this.set_backbone('trace');
    } else {
      this.set_backbone('all_atom');
    }
  }

  this.register_checkbox = function(name) {
    var check_id = 'input[name=' + name + ']';
    var scene = this.scene;
    $(check_id).click(function() { 
      var v = $(check_id + ':checked').val();
      scene.current_view.show[name] = v;
      scene.changed = true;
    });
    $(check_id).attr(
        'checked', scene.current_view.show[name]);
  }
  
  this.register_backbone = function() {
    var check_id = 'input[name=backbone]';
    var controller = this.controller;
    $(check_id).click(function() { 
      var v = $(check_id + ':checked').val();
      controller.set_backbone_option(v);
    });
  }
  
  make_input = function(name, text) {
    var div = $("<span>")
      .append(
        $("<input>")
          .attr("type", "checkbox")
          .attr("name", name)
      )
      .addClass("jolecule-onscreen-control")
      .append(text)
      ;
    return div;
  }

  this.div = $('#jolecule-display-options');
  
  this.div.append(
    $("<span>")
      .addClass("jolecule-onscreen-control")
      .append("[b]ackbone")
      .append(
        $("<input>")
          .attr("id", "ribbon")
          .attr("type","radio")
          .attr("name","backbone")
          .attr("value","ribbon")
          .attr("checked","checked")
      )
      .append("ribbon")
      .append(
        $("<input>")
          .attr("id", "trace")
          .attr("type","radio")
          .attr("name","backbone")
          .attr("value","trace")
      )
      .append("trace")
      .append(
        $("<input>")
          .attr("id", "all_atom")
          .attr("type","radio")
          .attr("name","backbone")
          .attr("value","all_atom")
      )
      .append("atom")
  );
  this.register_backbone();

  this.div.append("&nbsp;");

  this.div.append(make_input("water", "[w]ater"));
  this.register_checkbox('water');

  this.div.append("&nbsp;");

  this.div.append(make_input("hydrogen", "[h]ydrogen"));
  this.register_checkbox('hydrogen');

  this.div.append("&nbsp;");

  this.div.append(make_input("ligands", "[l]igands"));
  this.register_checkbox('ligands');

  this.div.append("&nbsp;");

  this.div.append(make_input("sidechain", "[s]idechain"));
  this.register_checkbox('sidechain');
}


// sequence bar with callbacks to move to
// any chosen residues

var SequenceDisplay = function(top_div_tag, controller) {
  this.controller = controller;
  this.scene = controller.scene;
  this.protein = controller.scene.protein;
  this.div = [];

  this.redraw = function() {
    for (var i=0; i<this.div.length; i+=1) {
      var res_id = this.protein.residues[i].id;
      if (res_id == this.scene.current_view.res_id) {
        this.div[i].target.removeClass("unselected");
        this.div[i].target.addClass("selected");
        $("#sequence").scrollTo(this.div[i].target);
      } else {
        this.div[i].target.removeClass("selected");
        this.div[i].target.addClass("unselected");
      }
    }
    for (var i=0; i<this.protein.residues.length; i+=1) {
      if (this.protein.residues[i].selected) {
        this.div[i].select.attr('checked', true);
      } else {
        this.div[i].select.attr('checked', false);
      }
    }
  }
  
  this.goto_prev_residue = function() {
    this.controller.set_target_prev_residue();
    window.location.hash = this.scene.target_view.res_id;
  }

  this.goto_next_residue = function() {
    this.controller.set_target_next_residue();
    window.location.hash = this.scene.target_view.res_id;
  }

  function html_pad(s, n_padded) {
    var trim_s = trim(s)
    var n = (n_padded - trim_s.length);
    var padded_s = trim_s;
    for (var k=0; k<n; k++) {
      padded_s += '&nbsp;';
    }
    return padded_s;
  }
  
  this.set_residue_select = function(res_id, v) {
    var i = this.protein.get_i_res_from_res_id(res_id);
    this.controller.select_residue(i, v);
  }
  
  this.toggle_residue_select = function(res_id) {
    var r = this.protein.res_by_id[res_id]
    this.set_residue_select(res_id, !r.selected);
  }

  this.create_residue_div = function(i) {
    var controller = this.controller;
    var _this = this;
    var res_id = this.protein.residues[i].id;
    var res_type = this.protein.residues[i].type;
    var html = "&nbsp;" + html_pad(res_id, 7) + html_pad(res_type, 3)
    var show_res_id = res_id + ":show";
    var checkbox = $("<input>")
        .attr({
            type:'checkbox', id:show_res_id, name:show_res_id,
            checked:false})
        .click( 
            function(event) {
              var check_id = 'input[name="' + show_res_id + '"' + ']';
              var v = $(check_id).is(':checked');
              _this.set_residue_select(res_id, v);
            });
    var elem = $("<div></div>")
        .css({'display':'block','margin':'0','padding':'0'})
        .append(checkbox)
        .append($("<a>")
            .attr("href", "#" + res_id)
            .html(html)
            .click(function() { 
                controller.set_target_view_by_res_id(res_id);
                _this.redraw();
            }))
    return { 'target':elem, 'select':checkbox };
  }
  
  this.build_divs = function() {
    var sequence_div = $("#sequence");
    for (var i=0; i<this.protein.residues.length; i+=1) {
      elem = this.create_residue_div(i);
      sequence_div.append(elem.target);
      this.div.push(elem);
    }
    
    this.scene.current_view.res_id = this.protein.residues[0].id;
    hash_tag = url().split('#')[1];
    if (hash_tag in this.protein.res_by_id) {
      this.controller.set_target_view_by_res_id(hash_tag);
    }
    this.redraw();
  }

  var _this = this;

  var clear = function() { _this.controller.clear_selected(); };
  var prev_residue = function() { _this.goto_prev_residue(); };
  var next_residue = function() { _this.goto_next_residue(); };
  var neighbourhood = function() { _this.controller.select_neighbors(); };

  var header = $("<div id='jolecule-sequence-header'></div>")
    .append($("<div>").addClass("jolecule-little-header").text("RESIDUES"))
    .append(link_button("", '[c]lear', 'jolecule-button', clear))
    .append(" ")
    .append(link_button("", '[n]eighbor', 'jolecule-button', neighbourhood))
    .append(" ")
    .append(link_button("", 'prev[k]', 'jolecule-button', prev_residue))
    .append(" ")
    .append(link_button("", 'next[j]', 'jolecule-button', next_residue))

  this.top_div = $(top_div_tag);
  this.top_div.append(header);
  this.top_div.append("<div id='sequence'></div>");
}



var Jolecule = function(div_tag, data_server, pdb_id, loading_html) {

  this.is_changed = function() { 
    return this.protein_display.scene.changed; 
  };

  this.draw = function() {
    if (this.protein_display.scene.changed) {
      if (this.protein_display.scene.is_new_view_chosen) {
        this.annotations.reset_borders();
        this.sequence.redraw();
        this.protein_display.scene.is_new_view_chosen = false;
      }
      this.buttons.update();
      this.protein_display.draw();
      this.protein_display.scene.changed = false;
    }
  }

  this.animate = function() {
    this.protein_display.scene.animate();
  }
  
  this.resize_all_displays_in_window = function(event) {
    var w = window.innerWidth -
      $('#jolecule-sequence-container').outerWidth() -
      $('#jolecule-views-container').outerWidth() -
      60;
    this.canvas_widget.set_width(w);
    $('#jolecule-protein-container').width(w);      
    $('#jolecule-display-options').width(w);      

    var h_main = window.innerHeight - 
           $("#jolecule-header").outerHeight() -
           $("#jolecule-footer").outerHeight() - 15 
           ;
    $('#jolecule-sequence-container').height(h_main);      
    $('#jolecule-views-container').height(h_main);      
    $('#jolecule-protein-container').height(h_main);      

    console.log(window.innerHeight, 
           $("#jolecule-header").outerHeight(),
           $("#jolecule-footer").outerHeight(),
           h_main);

    h = h_main - $("#jolecule-display-options").outerHeight();
    this.canvas_widget.set_height(h);

    var h = h_main - $('#jolecule-sequence-header').outerHeight();
    $('#sequence').height(h);

    var h = h_main - $('#jolecule-views-header').outerHeight();
    $('#views').height(h);

    if (typeof this.scene !== "undefined") {
      this.scene.changed = true;
    }
  }

  this.onkeydown = function(event) {
    if (!keyboard_lock) {
      var c = String.fromCharCode(event.keyCode).toUpperCase();
      var s = "[" + c + "]";
      if (c == 'V') {
        this.annotations.make_new_annotation();
        return;
      } else if ((c == "K") || (event.keyCode == 37)) {
        this.sequence.goto_prev_residue();
      } else if ((c == "J") || (event.keyCode == 39)) {
        this.sequence.goto_next_residue();
      } else if (c == "X") {
        var i_atom = this.scene.current_view.i_atom;
        if (i_atom >= 0) {
          var res_id = this.controller.protein.atoms[i_atom].res_id;
          this.sequence.toggle_residue_select(res_id);
        }
      } else if (event.keyCode == 38) {
        this.annotations.goto_prev_view();
      } else if (c == " " || event.keyCode == 40) {
        this.annotations.goto_next_view();
      } else if (c == 'B') {
        if (this.scene.current_view.show.all_atom) {
          this.buttons.set_backbone('ribbon');
        } else if (scene.current_view.show.ribbon) {
          this.buttons.set_backbone('trace');
        } else if (scene.current_view.show.trace){
          this.buttons.set_backbone('all_atom');
        }
      } else if (c == 'L') {
        this.buttons.toggle('ligands');
      } else if (c == 'S') {
        this.buttons.toggle('sidechain');
      } else if (c == 'W') {
        this.buttons.toggle('water');
      } else if (c == 'H') {
        this.buttons.toggle('hydrogen');
      } else if (c == 'C') {
        this.protein_display.controller.clear_selected();
      } else if (c == 'E') {
        var i_view = this.protein_display.scene.i_last_view;
        if (i_view > 0) {
          var view_id = this.protein_display.scene.saved_views[i_view].id;
          this.annotations.div[view_id].edit_fn();
        }
      } else if (c == 'N') {
        this.protein_display.controller.select_neighbors();
      } else if (c == 'A') {
        this.atom_label_dialog();
      } else {
        var i = parseInt(c);
        if ((i || i==0) && (i<this.scene.saved_views.length)) {
          var id = this.scene.saved_views[i].id;
          this.annotations.set_target_by_view_id(id);
        }
      }
      this.protein_display.scene.changed = true;
    }
  }

  this.register_callacks = function() {
    var _this = this;

    document.oncontextmenu = do_nothing;
    document.onkeydown = function(e) { _this.onkeydown(e); }
    var resize_fn = function() { 
      _this.resize_all_displays_in_window(); 
    }
    $(window).resize(resize_fn);
    window.onorientationchange = resize_fn;

    $("#make_label").click(
      function() {
        _this.protein_display.atom_label_dialog();
        return false;
      });
  }

  this.make_loading_dialog = function(loading_html){
    this.loading_dialog = $('<div>')
        .append(loading_html)
        .ajaxError(function(e) { 
            $(this).text('Server timed out.'); 
        });
    stick_in_top_left(
        $(this.div_tag), this.loading_dialog, 30, 30);      
  }

  this.load_protein_data = function(protein_data) {
    this.protein_display.protein.load(protein_data);
    var default_html;
    if (protein_data['filename']) {
      default_html = 
         'Uploaded file "' + protein_data['filename'] + '".';
    } else {
      pdb_url = 'http://www.rcsb.org/pdb/explore' + 
          '/explore.do?structureId=' + pdb_id;
      pdb_wiki_url = "http://pdbwiki.org/index.php/" + pdb_id
      default_html =
          'Default view in PDB structure ' +
          "<a href='" + pdb_url +
          "'>" + pdb_id.toUpperCase() + "</a>." +
          " For more information, also check out the <a href='" + pdb_wiki_url +
          "'>PDB-wiki</a>.";
    }
    this.protein_display.scene.make_default_view(default_html);
    this.sequence.build_divs();
    this.loading_dialog.remove();
  }

  this.load_views = function(views) {
    this.controller.load_views_from_flat_views(views);
    this.annotations.create_annotations();
    hash_tag = url().split('#')[1];
    if (hash_tag in this.scene.saved_views_by_id) {
      this.annotations.set_target_by_view_id(hash_tag);
      this.scene.is_new_view_chosen = true;
    }
    this.annotations.reset_borders();
  }

  var _this = this;

  // create all objects
  this.data_server = data_server;
  this.div_tag = div_tag;
  this.div = $(div_tag);
  this.canvas_widget = new CanvasWidget(this.div, 'black');
  this.scene = new Scene(new Protein());
  this.controller = new Controller(this.scene)
  this.protein_display = new ProteinDisplay(
      this.scene, this.canvas_widget, this.controller);
  this.annotations = new AnnotationsDisplay(
      this.controller, this.data_server);
  this.sequence = new SequenceDisplay(
      "#jolecule-sequence-container", this.controller);
  this.buttons = new OptionDisplay(this.controller);

  this.register_callacks();
  this.resize_all_displays_in_window();
  this.make_loading_dialog(loading_html);

  this.data_server.get_protein_data(
      function(data) { 
        _this.load_protein_data(data); 
        _this.resize_all_displays_in_window();
        _this.data_server.get_protein_views(
            function(data) { _this.load_views(data); });
      }
  );
}



function start_on_load() {
  var pdb_id = get_pdb_id_from_url(url());
  $('title').html('jolecule - pdb:' + pdb_id);
  var loading_html = 
      'Loading ' + pdb_id + ' from data_server.<br><br>' +
      'If for the first time, the structure needs <br>' +
      'to be downloaded from rcsb.org, and bonds <br>' +
      'need to be calculated. This may take several <br>' +
      'minutes for large structures. <br><br>' +
      'After, the structure is cached on the data_server.';

  var data_server = new ExampleEmbededDataServer();
  var screen_display = new Jolecule(
      '#jolecule-protein-display', data_server, pdb_id, loading_html);

  register_global_animation_loop(screen_display);
}


$(start_on_load);



