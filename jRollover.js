/*
 * Use It and don't complain
 * THX to Sinnerschrader
 */
(function($) { 

  var Rollover = function(node, option) {
//console.log("construct", this);
    this.base = node
    this.option = option || {}
    this.visible_area = node.find('.frame') /* visible area */
    this.visible_area.css('position', 'relative')
    this.visible_area.css('overflow-x', 'hidden')
    this.visible_area.css('overflow-y', 'hidden')
//        this.visible_area.css('overflow', 'hidden')
    this.list = node.find('ul') 
    this.list.css('position', 'relative')
    this.list.css('float', 'none')
    this.sliding = false

    var self = this
    var _click = function(dir) { return function(e) { 
        e.preventDefault() 
        $(this).blur()
        if (self.sliding) { return }
        self.sliding = true
        dir()
      }
    }
    node.bind("jRollover.stepNext", _click(function() { self.next() }))
    node.bind("jRollover.stepPrev", _click(function() { self.prev() }))
    node.find('.next').click(_click(function() { self.next() }))
    node.find('.prev').click(_click(function() { self.prev() }))

    this.setup()
  }

  Rollover.prototype.setup = function() {
      var self = this
      this.jq_items = this.list.find('>li').css('position', 'absolute')
      this.items = []

      this.jq_items.each(function() {
        var my = $(this)
        my.data('pos', self.items.length);
        self.items.push(my);
      })
      this.items_first = 0
      this.item_width = parseInt(this.items[0].css('width'),10)+
                        parseInt(this.items[0].css('margin-right'),10)+
                        parseInt(this.items[0].css('margin-left'),10);
      for(var i = 0, l = this.items.length; i < l; ++i) {
        this.items[i].css('left', (self.item_width * i)+'px');
      }
      this.list.width(this.item_width*this.items.length)
      this.visible_items = parseInt(parseInt(this.visible_area.css('width'),10)/this.item_width, 10)
      if (this.items.length <= this.visible_items) {
        var center_offset = (parseInt(this.visible_area.css('width'),10)-(this.items.length*this.item_width))/2
//console.log('carousel:center_offset:'+center_offset+":"+this.visible_items+":"+this.item_width+":"+this.visible_area.css('width'))
        this.list.css('margin-left', center_offset + 'px')
        this.base.find('.next,.prev').hide()
      } else {
        this.base.find('.next,.prev').show()
      }
      if (this.items.length == 1) {
        this.base.hide()
      } else {
        if (!jQuery.browser.msie6) {
          var direction = "hide"
          var jq_hide = this.base.find('.hide')
          jq_hide.html(jq_hide.data("data-direction", direction))
          var over = function() { 
//console.log('jq_hide:')
            jq_hide.trigger('click') 
          }
          jq_hide.click(function(e) {
            var my = $(this)
            var my_offset = my.outerHeight()
            var directions = {
                                hide: { removeClass: "hide", 
                                        addClass: "show", 
                                        direction: (-1*(self.base.outerHeight()-my_offset))+"px" 
                                      },
                                show: { removeClass: "show", 
                                        addClass: "hide", 
                                        direction: "0px" 
                                      }
                             }
            e.preventDefault()
            var current_direction = direction
            var next_direction = (direction == "hide"&&"show")||"hide"
            my.fadeOut('fast', function() {
              my.removeClass(directions[current_direction].removeClass) 
              my.addClass(directions[current_direction].addClass) 
              jq_hide.html(jq_hide.data("data-direction", next_direction))
              my.fadeIn('fast')
            })
            self.base.animate({bottom:directions[direction].direction}, "slow", function() {
              direction = next_direction
              if (direction == 'show') { 
                my.bind('mouseover', over) 
                self.base.unbind('mouseleave', over) 
              }
              else { 
                my.unbind('mouseover', over) 
                self.base.bind('mouseleave', over) 
              }
            })
          })
          jq_hide.length && setTimeout(function() { jq_hide.trigger('click') }, 750)
          
        }
        this.base.fadeIn('fast')
      }
      this.base.trigger("jRollover.ready", this.nowVisible())
    }

  Rollover.prototype.nowVisible = function() {
    var window_margin = this.list.css("margin-left").replace('-', "");
    for(var i = this.items.length-1; i>= 0; --i) {
      var left = this.items[i].css('left').replace('-', "")
      if (window_margin === left) {
//console.log("nowVisible", this.items[i]);
        return this.items[i];
      }
    }
    return null;
  }

  Rollover.prototype.prev = function() {
    if (this.items.length <= this.visible_items) { return }
    var prev = ((this.first()+this.items.length)-1)%this.items.length
    var left = parseInt(this.items[this.first()].css('left'),10)-this.item_width
    this.items[prev].css('left', left)
//  console.log('Rollover.prev:click:'+prev+":"+left)
    this.items_first = prev 
    this.base.trigger("jRollover.Prev");
    var self = this;
    this.direction(+1, function() { self.base.trigger("jRollover.nowVisible", self.nowVisible()); })
  }

  Rollover.prototype.next = function() {
    if (this.items.length <= this.visible_items) { return }
    var next = (this.first()+this.visible_items)%this.items.length
    var left = parseInt(this.items[this.last()].css('left'),10)+this.item_width
    this.items[next].css('left', left + 'px')
//  console.log('Rollover.next:click:'+next+":"+this.last()+":"+left)
    this.items_first = (this.first()+1)%this.items.length
    this.base.trigger("jRollover.Next");
    var self = this;
    this.direction(-1, function() { self.base.trigger("jRollover.nowVisible", self.nowVisible()); }) 
  }

  Rollover.prototype.direction = function(direction, completed) {
    var left = parseInt(this.list.css('margin-left'), 10)
    var self = this
    this.list.animate({"margin-left": left+(direction*this.item_width)+"px"}, 
      "fast", 
      function(){  self.sliding = false; completed && completed() })
  }

  Rollover.prototype.first = function() {
    return this.items_first
  }
  Rollover.prototype.last = function() {
//console.log("Rollover.prototype.last:",this.items_first,this.visible_items,this.items.length);
    return (this.items_first+this.visible_items-1)%this.items.length
  }

  $.fn.jRollover = function(option) {
    $(this).each(function() {
//console.log("create carousel on:", $(this));
      new Rollover($(this), option)
    })
    return this;
  }

})(jQuery)
