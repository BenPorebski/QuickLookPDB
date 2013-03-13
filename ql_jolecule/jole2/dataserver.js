// $.get(url + '/ajax/load_views_of_pdb/' + this.pdb_id, callback);
// $.post(url + '/ajax/save_view', view, do_nothing);
// $.post('/ajax/delete_view', {'pdb_id':pdb_id, 'id':view_id})



function extract_atom_lines(data) {
  var lines = data.split(/\r?\n/);
  var pdb_lines = [];
  for (var i=0; i<lines.length; i++) {
    var line = lines[i];
    if ((line.slice(0,4) === "ATOM") ||
        (line.slice(0,6) === "HETATM")) {
           pdb_lines.push(line);
    }
  }
  return pdb_lines;
}


var DataServer = function(pdb_data) {

  this.get_protein_data = function(callback) {
    var protein_data = {
        'pdb_atom_lines': pdb_data};
    callback(protein_data);
  }
  this.get_protein_views = function(callback) {
    var views = [{"id":"view:i23ysg","order":500,"show_sidechain":false,"show_hydrogen":false,"show_water":false,"show_ligands":true,"show_trace":false,"show_ca_trace":false,"show_ribbon":true,"show_all_atom":false}];
    console.log(views);
    callback(views)
  }
}



function register_global_animation_loop(new_display) {
  var ms_per_step = 25;

  var loop = function() {
    if (global_displays == []) {
      return;
    }
    var curr_time = (new Date).getTime();
    var n_step = (curr_time - last_time)/ms_per_step;
    if (n_step < 1) {
      n_step = 1;
    }
    for (var i=0; i<n_step; i++) {
      for (var j=0; j<global_displays.length; j++) {
        global_displays[j].animate();
      }
    }
    for (var j=0; j<global_displays.length; j++) {
      var display = global_displays[j];
      if (display.is_changed()) {
        display.draw();
      }
    }
    last_time = curr_time;
  }

  if (typeof global_displays == 'undefined') {
    global_displays = []
    var interval_id = setInterval(loop, ms_per_step);
    var last_time = (new Date).getTime();
  }

  global_displays.push(new_display);
}






