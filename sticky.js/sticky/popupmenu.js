/*
  popupmenu.js - simple JavaScript popup menu library.

  Copyright (C) 2007 Jiro Nishiguchi <jiro@cpan.org> All rights reserved.
  This is free software with ABSOLUTELY NO WARRANTY.

  You can redistribute it and/or modify it under the modified BSD license.

  Usage:
    var popup = new PopupMenu();
    popup.add(menuText, function(target){ ... });
    popup.addSeparator();
    popup.bind('targetElement');
    popup.bind(); // target is document;
*/
/*
  Modified By SUGAWARA Genki <http://d.hatena.ne.jp/winebarrel/> / 2007
*/
var PopupMenu = Class.create();
PopupMenu.SEPARATOR = 'PopupMenu.SEPARATOR';
PopupMenu.current = null;
PopupMenu.prototype = {
  initialize: function() {
    this.items  = [];
    this.width  = 0;
    this.height = 0;
  },
  setSize: function(width, height) {
    this.width  = width;
    this.height = height;

    if (this.element) {
      if (this.width) { Element.setStyle(this.element, { width:this.width }); }
      if (this.height) { Element.setStyle(this.element, { height:this.height }); }
    }
  },
  //bind: function(element) {
  bind: function(sticky) {
    //this.target = $(element) || document;
    this.sticky = sticky;
    this.target = sticky.table;

    var contextmenu_listener = function(e) {
      if (sticky.edit_mode) { return true; }
      Event.stop(e);
      this.show(e);
      return false;
    }.bindAsEventListener(this);

    Event.observe(this.target, 'contextmenu', contextmenu_listener);

    if (window.opera) {
      Event.observe(this.target, 'click', function(e) {
        if (e.ctrlKey) { return contextmenu_listener(e); }
      });
    }

    Event.observe(document, 'click', function(e) {
      this.hide();
    }.bindAsEventListener(this));
  },
  add: function(text, callback) {
    this.items.push({ text:text, callback:callback });
  },
  addSeparator: function() {
    this.items.push(PopupMenu.SEPARATOR);
  },
  setPos: function(e) {
    if (!this.element) return;
    var x = Event.pointerX(e);
    var y = Event.pointerY(e);
    Element.setStyle(this.element, { top:(y + 'px'), left:(x + 'px') });
  },
  show: function(e) {
    if (PopupMenu.current && PopupMenu.current != this) { return; }
    PopupMenu.current = this;

    //var z_index = Element.getStyle(this.target, 'z-index');
    // FIXME
    var z_index = Sticky.zindex;

    if (this.element) {
      this.setPos(e);
      if (z_index) { Element.setStyle(this.element, { zIndex:(z_index + 1) }); }
      Element.setStyle(this.element, { display:'' });
    } else {
      this.element = this.createMenu(this.items);
      this.setPos(e);
      if (z_index) { Element.setStyle(this.element, { zIndex:(z_index + 1) }); }
      document.body.appendChild(this.element);
    }
  },
  hide: function() {
    PopupMenu.current = null;
    if (this.element) { Element.setStyle(this.element, { display:'none' }); }
  },
  createMenu: function(items) {
    var self = this;
    var _style = 'border:1px solid gray;'+
                 'background-color:white;' +
                 'color:black;' +
                 'font-size: 12px;' +
                 'position:absolute;' +
                 'display:block;' +
                 'padding:2px;' +
                 'cursor:default;';
    if (this.width) { _style += ('width:' + this.width + 'px;'); }
    if (this.height) { _style += ('height:' + this.height+ 'px;'); }
    var menu = Builder.node('div', { style:_style });

    for (var i = 0; i < items.length; i++) {
      var item = (items[i] == PopupMenu.SEPARATOR) ?
                 this.createSeparator() :
                 this.createItem(items[i]);
      menu.appendChild(item);
    }

    return menu;
  },
  createItem: function(item) {
    var elem = Builder.node('div', { style:'padding:2px;' });

    Event.observe(elem, 'click', function(e) {
      this.hide();
      item.callback(this.target, e);
    }.bindAsEventListener(this));

    Event.observe(elem, 'mouseover', function(e) {
      Element.setStyle(elem, { backgroundColor:'#B6BDD2' });
    }.bindAsEventListener(this));

    Event.observe(elem, 'mouseout', function(e) {
      Element.setStyle(elem, { backgroundColor:'white' });
    }.bindAsEventListener(this));

    elem.innerHTML = item.text;
    return elem;
  },
  createSeparator: function() {
    var _style = 'border-top:1px dotted #CCC;' +
                 'font-size:0px;' +
                 'height:0px;';
    var sep = Builder.node('div', { style:_style });
    return sep;
  }
};

