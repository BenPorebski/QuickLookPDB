//////////////////////////////////////////////////////////
// 
// jolecule - the javascript based protein/dna viewer
//
///////////////////////////////////////////////////////////




function EmbedJolecule(
    pdb_id, init_view_id, parent_div_tag, 
    data_server, h_annotation_view, 
    loading_html, loading_failure_html,
    default_view_text) {
  
  this.load_protein_data = function(protein_data) {
    this.loading_message_div.text("Calculating bonds...");
    this.protein.load(protein_data);
    var default_text = protein_data['default_text'];
    if (!default_text) {
      default_text = "";
    }
    this.scene.make_default_view(default_text);
    this.populate_residue_selector();
    this.loading_message_div.remove();
  }

  this.load_views = function(view_dict) {
    this.controller.load_views_from_flat_views(view_dict);
    view_id = this.scene.current_view.id;
    if (this.init_view_id) {
      if (this.init_view_id in scene.saved_views_by_id) {
        view_id = this.init_view_id;
      }
    }
    this.display_view_annotation(view_id);
  }

  this.save_views_to_server = function() {
    // only save views from 1 onwards
    // i.e. no need to say "default view"
    for (var i=1; i<this.scene.saved_views.length; i+=1) {
      var view = this.scene.saved_views[i];
      var view_dict = this.controller.flat_dict_from_view(view);
      this.data_server.save_protein_view(view_dict);
    }
  }

  this.make_new_annotation = function() {
    var new_id = random_id();
    var j = this.controller.save_current_view(new_id);
    this.save_views_to_server();
    this.display_view_annotation(new_id)
  }

  this.delete_curr_view = function() {
    var i = this.scene.i_last_view;
    if (i == 0) {
      return;
    }
    var id = this.scene.saved_views[i].id;
    this.controller.delete_view(id);
    var i = this.scene.i_last_view;
    this.display_view_annotation(this.scene.saved_views[i].id);
    this.data_server.delete_protein_view(id);
    this.save_views_to_server();
  }

  this.is_changed = function() {
    if (!this.scene) {
      return false;
    }
    return this.scene.changed;
  }

  this.animate = function() {
    if (this.protein_display) {
      this.protein_display.scene.animate();
    }
  }

  this.draw =function() { 
    if (this.scene.changed) {
      this.residue_selector.val(this.scene.current_view.res_id);
      if (this.scene.is_new_view_chosen) {
        this.scene.is_new_view_chosen = false;
      }
      this.protein_display.draw();
      this.scene.changed = false;
    }
  }

  this.cycle_backbone = function() {
    if (this.scene.current_view.show.all_atom) {
      this.controller.set_backbone_option('ribbon');
    } else if (this.scene.current_view.show.ribbon) {
      this.controller.set_backbone_option('trace');
    } else if (this.scene.current_view.show.trace){
      this.controller.set_backbone_option('all_atom');
    }
  }

  this.toggle_text_state = function() {
    this.is_view_displayed = !this.is_view_displayed;
    console.log(h_padding)
    var h_padding = this.view_div.outerHeight() - this.view_div.height();
    if (this.is_view_displayed) {
      this.view_div.height(this.h_annotation_view - h_padding);
      this.view_div.css('overflow-y', 'scroll');
    } else {
      this.view_div.height(14);
      this.view_div.css('overflow-y', 'hidden');
    }
    this.resize();
    this.controller.scene.changed = true;
  }
  
  this.goto_prev_view = function() {
    var id = this.controller.set_target_prev_view();
    this.display_view_annotation(id);
  }
  
  this.goto_next_view = function() {
    var id = this.controller.set_target_next_view();
    this.display_view_annotation(id);
  }


  this.display_view_annotation = function(id) {
    var _this = this;
   
    var scene = this.controller.scene;

    var view = scene.saved_views_by_id[id];
    var n_view = scene.saved_views.length;
    var title = ' ' + (view.order+1) + '/' + n_view + ' ';

    var prev_button = link_button('prev_view', '<', 'mobile-button',
        function() { _this.goto_prev_view(); return false; });
    var next_button = link_button('prev_view', '>', 'mobile-button', 
        function() { _this.goto_next_view(); return false; });
    var toggle = link_button('toggle_text', 'text', 'mobile-button', 
      function() { _this.toggle_text_state(); return false; });
    var save = link_button('save_view', 'save', 'mobile-button', 
      function() { _this.make_new_annotation(); return false; });
    var del = link_button('delete_view', 'del', 'mobile-button', 
      function() { _this.delete_curr_view(); return false; });
  
    var change_text = function(new_text) {
      view.text = new_text;
      _this.save_views_to_server();
    }

    var edit_text_div = editable_text_div(
      view.text, "100%", change_text);

    var left_control = $('<div>')
      .css({'float':'left', 'padding':0})
      ;

    var right_control = $('<div>')
      .css({'float':'right', 'padding':0})
      ;

    this.view_div
      .empty()
      .addClass("annotation_text")
      .append(left_control)
      .append(right_control)
      .append('<br clear=all><br>')
      .append(edit_text_div)
  }

  this.populate_residue_selector = function() {
    var residues = this.protein.residues;
    for (var i=0; i<residues.length; i++) {
      var value = residues[i].id;
      var text = residues[i].id + '-' + residues[i].type;
      this.residue_selector.append(
        $('<option>').attr('value',value).text(text));
    }
    var _this = this;
    var change_fn = function() {
      var res_id = _this.residue_selector.find(":selected").val();
      _this.controller.set_target_view_by_res_id(res_id);
    }
    this.residue_selector.change(change_fn);
  }

  this.help = function() {
    var help_div = $('<div>')
      .addClass('mobile-dialog')
      .css({'width':Math.min(350, this.div.width()-40)});

    var cancel_button = link_button(
      'cancel', 'clear', 'mobile-button', 
      function() { help_div.remove(); return false; });

    help_div.append("<br>");
    help_div.append("<a href='http://jolecule.appspot.com'>JOLECULE</a> ");
    help_div.append("(c) 2012, <a href='http://boscoh.com'>Bosco Ho</a>");
    help_div.append("<br>");
    help_div.append("<br>");
    help_div.append("<ul>");
    help_div.append("<li>[shift]-mouse/right-mouse: zoom/rotate</li>");
    help_div.append("<li>click on atom: center on atom</li>");
    help_div.append("<li>drag on center atom: add a distance label</li>");
    help_div.append("<li>[neigh]: show all neighbouring residues of center atom</li>");
    help_div.append("</ul>");
    help_div.append("<br>");
    help_div.append("<br>");
    help_div.append(cancel_button);
    help_div.append("<br>");
    help_div.append('<br>');
    stick_in_center(this.div, help_div, 0, 0);
  }

  this.create_header_div = function(tag) {
    var _this = this;

    var top_id = this.div_tag.slice(1) + '-'

    var title = link_button(
      top_id + 'help', '?', 'mobile-button', 
      function() { _this.help(); return false; });
    var clear = link_button(
      top_id + 'clear_sidechains', 'clear', 'mobile-button', 
      function() { _this.controller.clear_selected(); return false; });
    var neighbour = link_button(
      top_id + 'neighbour_sidechains', 'neigh', 'mobile-button', 
      function() { _this.controller.select_neighbors(); return false; });
    var backbone = link_button(
      top_id + 'backbone_cycle', 'repr', 'mobile-button', 
      function() { _this.cycle_backbone(); return false; });

    this.residue_selector = $('<select>')
      .attr('id', top_id + 'residue_selector')
      .addClass('mobile-select');

    var left = $('<span>')
        .css('text-align', 'left')
        .css('display', 'table-cell')
        .append(title);

    var right = $('<span>')
        .css('text-align', 'right')
        .css('display', 'table-cell')
        .append(this.residue_selector)
        .append(' ')
        .append(backbone)
        .append(' ')
        .append(clear)
        .append(' ')
        .append(neighbour);

    var header_div = $('<div>')
        .addClass('mobile-header')
        .append($('<div>')
          .css('display', 'table')
          .css('width', '100%')
          .css('border-collapse', 'collapse')
          .append(left)
          .append(right)
          .append('<br clear=all>')
        );

    $(tag).append(header_div);
    return header_div;        
  }

  this.create_protein_div = function(tag) {
    parent = $(tag);
    var height = parent.outerHeight() - 
                   this.header_div.outerHeight() - 
                   this.h_annotation_view;
    var protein_div = $('<div>')
        .addClass('mobile-protein')
        .css({'width':parent.outerWidth(),
              'height':height
             });
    parent.append(protein_div);
    return protein_div;
  }

  this.create_view_div = function(tag) {
    var div = $('<div>').addClass('mobile-view')
    $(tag).append(div);
    var h_padding = div.outerHeight() - div.height();
    div.height(this.h_annotation_view - h_padding);
    return div;
  }

  this.resize = function(event) {
    var parent = this.div;
    this.h_canvas = parent.outerHeight() - 
                    this.header_div.outerHeight() -
                    this.view_div.outerHeight();
    this.canvas_widget.set_height(this.h_canvas);
    this.canvas_widget.set_width(parent.outerWidth());
    if (typeof this.scene !== "undefined") {
      this.scene.changed = true;
    }
  }

  this.pdb_id = pdb_id;

  this.div_tag = parent_div_tag;
  this.div = $(this.div_tag)
  this.div.addClass('mobile-body');
  // turns off context menu
  this.div[0].oncontextmenu = do_nothing;

  this.init_view_id = init_view_id;
  this.data_server = data_server;
  this.h_annotation_view = h_annotation_view;
  this.is_view_displayed = true;

  this.header_div = this.create_header_div(this.div_tag);
  this.protein_div = this.create_protein_div(this.div_tag);
  this.view_div = this.create_view_div(this.div_tag);

  this.protein = new Protein();
  this.scene = new Scene(this.protein);
  this.controller = new Controller(this.scene)

  this.canvas_widget = new CanvasWidget(this.protein_div, 'black');
  this.protein_display = new ProteinDisplay(
      this.scene, this.canvas_widget, this.controller);
  this.protein_display.zslab_display.width = 28;
  this.protein_display.min_radius = 10;

  var blink_text = $('<div>').html(loading_html);
  blink(blink_text);
  this.loading_message_div = $('<div>').append(blink_text);
  stick_in_top_left(this.div, this.loading_message_div, 30, 90);      

  var _this = this;

  var resize_fn = function(e) {
    _this.resize();
    return true;    
  }
  $(window).resize(resize_fn);

  var load_failure = function() {
    _this.loading_message_div.html(loading_failure_html);
  }

  var load_success = function(data) { 
    _this.loading_message_div.empty();
    if (data['pdb_atom_lines'].length > 0) {
      data["default_text"] = default_view_text;
      _this.load_protein_data(data); 
      _this.resize();
      _this.data_server.get_protein_views(
          function(data) {
             _this.load_views(data); 
          });
    } else {
      load_failure();
    }
  }

  this.data_server.get_protein_data(
      load_success, load_failure);
}


