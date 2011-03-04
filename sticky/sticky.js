/*
  sticky.js
  Copyright 2007- SUGAWARA Genki <http://d.hatena.ne.jp/winebarrel/>

  ex)
    <link href="sticky.css" rel="stylesheet" type="text/css" />
    <script src="prototype.js" type="text/javascript"></script>
    <script src="scriptaculous.js?load=builder,effects,dragdrop" type="text/javascript"></script>
    <script src="sticky.js" type="text/javascript"></script>
    ...
    <script type="text/javascript">
      var sticky = new Sticky('sticky', '...', 100, 100);
      sticky.onattach      = function(sticky) { ... };
      sticky.onmove        = function(sticky) { ... };
      sticky.onedit        = function(sticky) { ... };
      sticky.ondetach      = function(sticky) { ... };
      sticky.onsetcolor    = function(sticky) { ... };
      sticky.onsetfontsize = function(sticky) { ... };

      sticky.attach();
      //sticky.detach();
    </script>
*/
var Sticky = Class.create();
Sticky.zindex = 1000;
Sticky.find = function(id) {
  var table = $(id);
  return table ? table.sticky : null;
};
Sticky.focused = null;
Sticky.prototype = {
  initialize: function(id, content, top, left, bgcolor, font_size) {
    this.id = id;
    this.content = content;
    var td_style = bgcolor ? {backgroundColor:bgcolor} : {};
    this.table = Builder.node('table', {id:id, className:'sticky', style:'position:absolute;'} , [
                     Builder.node('tbody', {}, [
                       Builder.node('tr', {}, [
                         Builder.node('td', {}, [
                           Builder.node('div', {className:'content_wrapper' },[
                             Builder.node('div', {}),
                             Builder.node('textarea', {}, content)]) ]) ]) ]) ]);


    this.td = this.table.getElementsByTagName('td')[0];
    this.viewer = this.td.getElementsByTagName('div')[1];
    this.viewer.innerHTML = this.format(content);
    this.editor = this.td.getElementsByTagName('textarea')[0];
    this.editor.resize = function(ignore_small) {
      var cols = this.measure_text_width(this.editor.value);
      cols = (cols < 1) ? 1 : cols;
      var rows = this.measure_text_height(this.editor.value);
      if (ignore_small) {
        if (this.editor.cols < cols) { this.editor.cols = cols; }
        if (this.editor.rows < rows) { this.editor.rows = rows; }
      } else {
        this.editor.cols = cols;
        this.editor.rows = rows;
      }
    }.bind(this);

    this.draggable = new Draggable(this.table, { zindex:0xffff, starteffect:null, endeffect:null });

    Draggables.addObserver({
      onEnd: function(eventName, draggable, event) {
        if (draggable != this.draggable) return;
        this.top = Element.getStyle(this.table, 'top');
        this.left = Element.getStyle(this.table, 'left');
        draggable.originalZ = Sticky.zindex++;
        this.onmove && this.onmove(this);
      }.bind(this)
    });

    this.edit_mode = false;
    Event.observe(this.td, 'click', function(e) {
      //Event.stop(e);
      if (Sticky.focused && Sticky.focused != this.editor) { Sticky.focused.blur(); }
      this.forward();
      //return false;
    }.bindAsEventListener(this));
    Event.observe(this.td, 'dblclick', function(e) {
      //Event.stop(e);
      if(this.onpreedit && this.onpreedit(this) == false) { return; }
      this.edit_mode = true;
      this.edit();
      //return false;
    }.bindAsEventListener(this));
    Event.observe(this.editor, 'focus', function(e) {
      Sticky.focused = this.editor;
    }.bindAsEventListener(this));
    Event.observe(this.editor, 'blur', function(e) {
      //Event.stop(e);
      Sticky.focused = null;
      this.editor.resize();
      this.view();
      var prev_content = this.content;
      this.content = this.editor.value;
      this.edit_mode && this.update();
      this.edit_mode = false;
      this.onedit && this.onedit(this, (prev_content != this.content));
      //return false;
    }.bindAsEventListener(this));
    Event.observe(this.editor, 'keyup', function(e) {
      //Event.stop(e);
      this.editor.resize(true);
      //return false;
    }.bindAsEventListener(this));

    this.position(top, left);
    this.hide();
    if(bgcolor) { this.setColor(bgcolor, true); }
    if(font_size) { this.setFontSize(font_size, true); }
    this.view();
    this.table.sticky = this;
  },
  attach: function(no_event) {
    var body = document.getElementsByTagName('body')[0];
    body.appendChild(this.table);
    this.forward();
    this.show();
    if(!no_event && this.onattach) { this.onattach(this); }
  },
  detach: function(no_event) {
    if(!no_event && this.ondetach) {
      if(this.ondetach(this) == false) { return; }
    }

    this.hide();
    document.body.removeChild(this.table);
  },
  show: function() {
    Element.setStyle(this.table, {visibility:'visible'});
  },
  hide: function() {
    Element.setStyle(this.table, {visibility:'hidden'});
  },
  view: function() {
    var style = {width:'', height:''}
    if(!this.editor.value) style = {width:'16px', height:'16px'};
    Element.setStyle(this.viewer, style);
    Element.hide(this.editor);
    Element.show(this.viewer);
  },
  edit: function() {
    this.editor.value = this.content;
    this.editor.resize();
    Element.hide(this.viewer);
    Element.show(this.editor);
    this.editor.focus();
  },
  position: function(top, left) {
    this.top = top;
    this.left = left;
    var style = {};
    top  && (style.top  = top );
    left && (style.left = left);
    Element.setStyle(this.table, style);
  },
  forward: function() {
    Element.setStyle(this.table, {zIndex:Sticky.zindex++});
  },
  getStyle: function(style) {
    return Element.getStyle(this.td, style);
  },
  setStyle: function(style) {
    Element.setStyle(this.td, style);
  },
  getColor: function() {
    return this.getStyle('background-color');
  },
  setColor: function(bgcolor, no_event) {
    this.setStyle({backgroundColor:bgcolor});
    if(!no_event && this.onsetcolor) { this.onsetcolor(this); }
  },
  getFontSize: function() {
    return this.getStyle('font-size');
  },
  setFontSize: function(font_size, no_event) {
    this.setStyle({fontSize:font_size});
    Element.setStyle(this.editor, {fontSize:font_size});
    if(!no_event && this.onsetfontsize) { this.onsetfontsize(this); }
  },
  update: function(content) {
    if (content) { this.content = content; }
    this.viewer.innerHTML = this.format(this.content);
  },
  format: function(src) {
    if (!this.formaters) {
      //this.formaters = [this.escape_content.bind(this)];
      this.formaters = [this.auto_link.bind(this), this.simple_format.bind(this), this.nl2br.bind(this)];
    }
    return this.formaters.inject(src, function(result, f) {
      return f(result);
    });
  },
  /*
  escape_content: function(source) {
    return source.replace(/&/g, '&amp;').
                  replace(/\</g, '&lt;').
                  replace(/\>/g, '&gt;').
                  replace(/"/g,  '&quot;').
                  replace(/'/g,  '&#39;' ).
                  replace(/(\x0d\x0a|\x0d|\x0a)/g, '<br>$1').
                  replace(/\x20/g, '&nbsp;');
  },
  */
  //url_regexp: (new RegExp('s?https?://[-_.!~*\'()a-zA-Z0-9;/?:@&=+$,%#]+', 'g')),
  url_regexp: (new RegExp('(s?https?://[-_.!~*()a-zA-Z0-9;/?:@&=+$,%#]+|&|\<|\>|\"|\'|\x20)', 'g')),
  auto_link: function(source) {
    return source.replace(this.url_regexp, function(m) {
      if (m == '&') {
        return '&amp;';
      } else if (m == '<') {
        return '&lt;';
      } else if (m == '>') {
        return '&gt;';
      } else if (m == '\"') {
        return '&quot;';
      } else if (m == '\'') {
        return '&#39;';
      } else if (m == '\x20') {
        return '&nbsp;';
      } else if(/(gif|png|jpg|jpeg)$/i.test(m) || /(gif|png|jpg|jpeg)\?/i.test(m)) {
        return '<img src=\"' + m + '\">';
      } else {
        return '<a href=\"' + m + '\" target=\"_blank\">' + m + '</a>';
      }
    });
  },
  simple_format_regexp: /\[(\w+):([^\]]+)\]/g,
  simple_format: function(source) {
    return source.replace(this.simple_format_regexp, function(m, m1, m2) {
      return '<' + m1 + '>' + m2 + '</' + m1 + '>';
    });
  },
  nl2br: function(source) {
    return source.replace(/(\x0d\x0a|\x0d|\x0a)/g, '<br>$1');
  },
  measure_text_width: function(text) {
    var width = 0;
    var lines = text.split(/\x0d\x0a|\x0d|\x0a/);

    for(var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var charct = 0;

      for(var j = 0; j < line.length; j++) {
        charct += (line.charCodeAt(j) <= 0x7f ? 1 : 2);
      }

      if(width < charct) { width = charct; }
    }

    return width;
  },
  measure_text_height: function(text) {
    var linect = 1;
    text.replace(/\x0d\x0a|\x0d|\x0a/g, function() { linect++ });
    return linect;
  },
  read_only: function(flag) {
    this.editor.readOnly = flag;
  }
};
